import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyApiToken } from '@/lib/api-token'
import { rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

const syncSchema = z.object({
  workout_source_id: z.string().min(1),
  date: z.string().datetime({ offset: true }),
  distance_km: z.number().positive().max(300),
  duration_sec: z.number().int().positive(),
  avg_heart_rate_bpm: z.number().int().min(40).max(250).optional().nullable(),
  local_date_key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(request: Request) {
  // 1. Bearer 토큰 추출
  const auth = request.headers.get('Authorization') ?? ''
  const rawToken = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!rawToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 2. Rate limiting (토큰 단위, 1분 10회)
  const { allowed } = rateLimit(`sync:${rawToken.slice(-8)}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // 3. 토큰 검증 → user_id 획득
  const userId = await verifyApiToken(rawToken)
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // 4. 페이로드 검증
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const parsed = syncSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { workout_source_id, date, distance_km, duration_sec, avg_heart_rate_bpm, local_date_key } = parsed.data
  const avg_pace_sec_per_km = duration_sec / distance_km

  // 5. DB 삽입 (중복 시 409)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('runs')
    .insert({
      user_id: userId,
      workout_source_id,
      date,
      local_date_key,
      distance_km,
      duration_sec,
      avg_pace_sec_per_km,
      avg_heart_rate_bpm: avg_heart_rate_bpm ?? null,
      source: 'shortcut',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 })
    }
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }

  return NextResponse.json({ run_id: data.id }, { status: 201 })
}
