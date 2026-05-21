import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureFreshToken } from '@/lib/strava'
import type { Split } from '@/types/database'

const RUN_SPORT_TYPES = new Set(['Run', 'VirtualRun', 'TrailRun'])

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: connection } = await admin
    .from('strava_connections')
    .select('user_id, access_token, refresh_token, expires_at, last_synced_at')
    .eq('user_id', user.id)
    .single()

  if (!connection) return NextResponse.json({ error: 'not_connected' }, { status: 400 })

  const accessToken = await ensureFreshToken(connection)
  if (!accessToken) return NextResponse.json({ error: 'token_refresh_failed' }, { status: 400 })

  // 첫 동기화: 30일, 이후: 마지막 동기화 - 1일 (Strava 업로드 지연 대응)
  const after = connection.last_synced_at
    ? Math.floor(new Date(connection.last_synced_at).getTime() / 1000) - 24 * 60 * 60
    : Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60

  const listRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (listRes.status === 429) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  if (!listRes.ok) return NextResponse.json({ error: 'strava_api_error' }, { status: 502 })

  const activities: StravaActivity[] = await listRes.json()
  const runs = activities.filter(a => RUN_SPORT_TYPES.has(a.sport_type ?? a.type))

  let synced = 0
  let skipped = 0

  for (const activity of runs) {
    const distance_km = activity.distance / 1000
    const duration_sec = activity.moving_time
    if (distance_km < 0.1 || duration_sec < 10) continue

    // 상세 조회로 splits 가져오기
    let splits: Split[] | null = null
    const detailRes = await fetch(
      `https://www.strava.com/api/v3/activities/${activity.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (detailRes.ok) {
      const detail: StravaActivityDetail = await detailRes.json()
      splits = detail.splits_metric?.map(s => ({
        split: s.split,
        distance: s.distance,
        moving_time: s.moving_time,
        average_heartrate: s.average_heartrate ?? null,
        elevation_difference: s.elevation_difference ?? null,
      })) ?? null
    }

    const { error } = await admin.from('runs').insert({
      user_id: user.id,
      workout_source_id: `strava-${activity.id}`,
      date: activity.start_date,
      local_date_key: activity.start_date_local.slice(0, 10),
      distance_km,
      duration_sec,
      avg_pace_sec_per_km: duration_sec / distance_km,
      avg_heart_rate_bpm: activity.average_heartrate ?? null,
      is_treadmill: activity.trainer ?? false,
      polyline: activity.map?.summary_polyline ?? null,
      elevation_gain_m: activity.total_elevation_gain ?? null,
      splits,
      source: 'strava',
    })

    if (error) {
      if (error.code === '23505') skipped++
    } else {
      synced++
    }
  }

  await admin
    .from('strava_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({ synced, skipped })
}

interface StravaActivity {
  id: number
  type: string
  sport_type?: string
  start_date: string
  start_date_local: string
  distance: number
  moving_time: number
  average_heartrate?: number
  trainer?: boolean
  total_elevation_gain?: number
  map?: { summary_polyline?: string }
}

interface StravaActivityDetail extends StravaActivity {
  splits_metric?: {
    split: number
    distance: number
    moving_time: number
    average_heartrate?: number
    elevation_difference?: number
  }[]
}
