import { NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyApiToken } from '@/lib/api-token'
import { rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

const syncSchema = z.object({
  workout_source_id: z.string().min(1).optional().nullable(),
  date: z.string().datetime({ offset: true }),
  distance_km: z.number().positive().max(300),
  duration_sec: z.number().int().positive(),
  avg_heart_rate_bpm: z.number().int().min(40).max(250).optional().nullable(),
  local_date_key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

// "2026. 4. 21. 오후 7:57" → "2026-04-21T19:57:00+09:00"
function parseKoreanDate(s: string): string | null {
  const m = s.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2})/)
  if (!m) return null
  const [, year, month, day, ampm, h, min] = m
  let hour = parseInt(h)
  if (ampm === '오후' && hour !== 12) hour += 12
  if (ampm === '오전' && hour === 12) hour = 0
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(parseInt(month))}-${pad(parseInt(day))}T${pad(hour)}:${min}:00+09:00`
}

// "39:08" → 2348, "1:39:08" → 5948
function parseDuration(s: string): number | null {
  const parts = s.split(':').map(Number)
  if (parts.some(isNaN) || parts.length < 2 || parts.length > 3) return null
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

// "5.017km" → 5.017
function parseDistance(s: string): number | null {
  const n = parseFloat(s.replace(/[^\d.]/g, ''))
  return isNaN(n) ? null : n
}

function normalizeBody(raw: Record<string, unknown>): Record<string, unknown> {
  const result = { ...raw }

  if (typeof result.date === 'string' && !result.date.includes('T')) {
    result.date = parseKoreanDate(result.date) ?? result.date
  }

  if (typeof result.distance_km === 'string') {
    result.distance_km = parseDistance(result.distance_km as string)
  }

  if (typeof result.duration_sec === 'string') {
    const s = result.duration_sec as string
    result.duration_sec = s.includes(':') ? parseDuration(s) : parseInt(s)
  }

  return result
}

export async function POST(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  const rawToken = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!rawToken) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { allowed } = rateLimit(`sync:${rawToken.slice(-8)}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const userId = await verifyApiToken(rawToken)
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const normalized = normalizeBody(body as Record<string, unknown>)
  const parsed = syncSchema.safeParse(normalized)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { workout_source_id, date, distance_km, duration_sec, avg_heart_rate_bpm } = parsed.data
  const avg_pace_sec_per_km = duration_sec / distance_km

  const local_date_key = parsed.data.local_date_key
    ?? new Date(new Date(date).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

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
