import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureFreshToken } from '@/lib/strava'
import type { Split } from '@/types/database'

const RUN_SPORT_TYPES = new Set(['Run', 'VirtualRun', 'TrailRun'])

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('strava_syncs')
    .select('id, synced_count, synced_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? null)
}

export async function POST(request: Request) {
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

  // skip_dates: null = 아직 확인 안 됨, [] = 전부 추가, ['date',...] = 해당 날짜 건너뜀
  let skipDates: string[] | null = null
  try {
    const body = await request.json()
    if (body && Array.isArray(body.skip_dates)) skipDates = body.skip_dates
  } catch { /* no body */ }

  // 첫 동기화이고 아직 확인 전이라면 → 최근 5개로 충돌 검사
  if (!connection.last_synced_at && skipDates === null) {
    const previewRes = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=5',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (previewRes.status === 429) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    if (!previewRes.ok) return NextResponse.json({ error: 'strava_api_error' }, { status: 502 })

    const previewActivities: StravaActivity[] = await previewRes.json()
    const previewRuns = previewActivities.filter(a => RUN_SPORT_TYPES.has(a.sport_type ?? a.type))
    const previewDates = previewRuns.map(a => a.start_date_local.slice(0, 10))

    if (previewDates.length > 0) {
      const { data: existingRuns } = await admin
        .from('runs')
        .select('local_date_key, distance_km')
        .eq('user_id', user.id)
        .in('local_date_key', previewDates)

      if (existingRuns && existingRuns.length > 0) {
        const existingByDate = new Map<string, number>()
        for (const r of existingRuns) {
          existingByDate.set(r.local_date_key, (existingByDate.get(r.local_date_key) ?? 0) + r.distance_km)
        }

        const conflicts = previewRuns
          .filter(a => existingByDate.has(a.start_date_local.slice(0, 10)))
          .map(a => ({
            date: a.start_date_local.slice(0, 10),
            strava_distance_km: a.distance / 1000,
            existing_distance_km: existingByDate.get(a.start_date_local.slice(0, 10))!,
          }))

        if (conflicts.length > 0) {
          return NextResponse.json({ needs_confirmation: true, conflicts })
        }
      }
    }
    // 충돌 없음 → 전부 추가로 진행
    skipDates = []
  }

  const { data: defaultShoe } = await admin
    .from('shoes')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .eq('is_retired', false)
    .single()

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
  const insertedRunIds: string[] = []
  const skipDateSet = new Set(skipDates ?? [])

  for (const activity of runs) {
    if (skipDateSet.has(activity.start_date_local.slice(0, 10))) { skipped++; continue }
    const distance_km = activity.distance / 1000
    const duration_sec = activity.moving_time
    if (distance_km < 0.1 || duration_sec < 10) continue

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

    const { data: inserted, error } = await admin.from('runs').insert({
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
      shoe_id: defaultShoe?.id ?? null,
    }).select('id').single()

    if (error) {
      if (error.code === '23505') skipped++
    } else {
      synced++
      if (inserted) insertedRunIds.push(inserted.id)
    }
  }

  await admin
    .from('strava_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('user_id', user.id)

  // 이전 sync 기록 삭제 후 새 기록 저장 (synced > 0일 때만)
  await admin.from('strava_syncs').delete().eq('user_id', user.id)
  if (synced > 0) {
    await admin.from('strava_syncs').insert({
      user_id: user.id,
      synced_count: synced,
      run_ids: insertedRunIds,
      prev_last_synced_at: connection.last_synced_at,
    })
  }

  return NextResponse.json({ synced, skipped })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: sync } = await admin
    .from('strava_syncs')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!sync) return NextResponse.json({ error: 'no_sync' }, { status: 404 })

  if (sync.run_ids.length > 0) {
    await admin.from('runs').delete().in('id', sync.run_ids).eq('user_id', user.id)
  }

  await admin
    .from('strava_connections')
    .update({ last_synced_at: sync.prev_last_synced_at })
    .eq('user_id', user.id)

  await admin.from('strava_syncs').delete().eq('user_id', user.id)

  return NextResponse.json({ rolled_back: sync.synced_count })
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
