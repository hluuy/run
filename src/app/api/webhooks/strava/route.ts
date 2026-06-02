import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureFreshToken } from '@/lib/strava'
import { sendPushToUser, formatPace } from '@/lib/push'
import type { Split } from '@/types/database'

const RUN_SPORT_TYPES = new Set(['Run', 'VirtualRun', 'TrailRun'])

// Strava hub.challenge verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const verifyToken = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && verifyToken === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge })
  }
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

// Strava activity event handler
export async function POST(request: Request) {
  const event: StravaWebhookEvent = await request.json()

  // Respond 200 immediately; Strava retries on non-2xx
  const response = NextResponse.json({ ok: true })

  if (event.object_type === 'activity') {
    if (event.aspect_type === 'create') {
      await handleActivityCreate(event.owner_id, event.object_id).catch(() => {})
    } else if (event.aspect_type === 'update') {
      await handleActivityUpdate(event.owner_id, event.object_id).catch(() => {})
    } else if (event.aspect_type === 'delete') {
      await handleActivityDelete(event.owner_id, event.object_id).catch(() => {})
    }
  }

  return response
}

async function handleActivityCreate(athleteId: number, activityId: number) {
  const admin = createAdminClient()

  const { data: connection } = await admin
    .from('strava_connections')
    .select('user_id, access_token, refresh_token, expires_at, last_synced_at')
    .eq('strava_athlete_id', athleteId)
    .single()

  if (!connection) return

  const accessToken = await ensureFreshToken(connection)
  if (!accessToken) {
    await sendPushToUser(connection.user_id, {
      title: 'Strava 연동 오류',
      body: '재연동이 필요합니다. 설정에서 다시 연결해 주세요.',
      url: '/settings',
    })
    return
  }

  const res = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return

  const activity: StravaActivityDetail = await res.json()
  if (!RUN_SPORT_TYPES.has(activity.sport_type ?? activity.type)) return

  const distance_km = activity.distance / 1000
  const duration_sec = activity.moving_time
  if (distance_km < 0.1 || duration_sec < 10) return

  const splits: Split[] | null = activity.splits_metric?.map(s => ({
    split: s.split,
    distance: s.distance,
    moving_time: s.moving_time,
    average_heartrate: s.average_heartrate ?? null,
    elevation_difference: s.elevation_difference ?? null,
  })) ?? null

  const { data: defaultShoe } = await admin
    .from('shoes')
    .select('id')
    .eq('user_id', connection.user_id)
    .eq('is_default', true)
    .eq('is_retired', false)
    .single()

  const { error } = await admin.from('runs').insert({
    user_id: connection.user_id,
    workout_source_id: `strava-${activityId}`,
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
  })

  if (!error) {
    await admin
      .from('strava_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', connection.user_id)

    await sendPushToUser(connection.user_id, {
      title: 'Strava 러닝 기록 추가됨',
      body: `${distance_km.toFixed(1)}km · ${formatPace(duration_sec / distance_km)}/km`,
      url: '/',
    })
  }
}

async function handleActivityUpdate(athleteId: number, activityId: number) {
  const admin = createAdminClient()

  const { data: connection } = await admin
    .from('strava_connections')
    .select('user_id, access_token, refresh_token, expires_at, last_synced_at')
    .eq('strava_athlete_id', athleteId)
    .single()

  if (!connection) return

  // 우리 DB에 이 활동이 없으면 무시
  const { data: existing } = await admin
    .from('runs')
    .select('id')
    .eq('user_id', connection.user_id)
    .eq('workout_source_id', `strava-${activityId}`)
    .single()

  if (!existing) return

  const accessToken = await ensureFreshToken(connection)
  if (!accessToken) return

  const res = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return

  const activity: StravaActivityDetail = await res.json()
  if (!RUN_SPORT_TYPES.has(activity.sport_type ?? activity.type)) return

  const distance_km = activity.distance / 1000
  const duration_sec = activity.moving_time
  if (distance_km < 0.1 || duration_sec < 10) return

  const splits: Split[] | null = activity.splits_metric?.map(s => ({
    split: s.split,
    distance: s.distance,
    moving_time: s.moving_time,
    average_heartrate: s.average_heartrate ?? null,
    elevation_difference: s.elevation_difference ?? null,
  })) ?? null

  await admin
    .from('runs')
    .update({
      date: activity.start_date,
      local_date_key: activity.start_date_local.slice(0, 10),
      distance_km,
      duration_sec,
      avg_pace_sec_per_km: duration_sec / distance_km,
      avg_heart_rate_bpm: activity.average_heartrate ?? null,
      is_treadmill: activity.trainer ?? false,
      elevation_gain_m: activity.total_elevation_gain ?? null,
      polyline: activity.map?.summary_polyline ?? null,
      splits,
    })
    .eq('id', existing.id)
}

async function handleActivityDelete(athleteId: number, activityId: number) {
  const admin = createAdminClient()

  const { data: connection } = await admin
    .from('strava_connections')
    .select('user_id')
    .eq('strava_athlete_id', athleteId)
    .single()

  if (!connection) return

  await admin
    .from('runs')
    .delete()
    .eq('user_id', connection.user_id)
    .eq('workout_source_id', `strava-${activityId}`)
}

interface StravaWebhookEvent {
  object_type: string
  object_id: number
  aspect_type: string
  owner_id: number
  subscription_id: number
  event_time: number
  updates: Record<string, string>
}

interface StravaActivityDetail {
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
  splits_metric?: {
    split: number
    distance: number
    moving_time: number
    average_heartrate?: number
    elevation_difference?: number
  }[]
}
