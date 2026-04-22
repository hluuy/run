import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  date: z.string().min(1),
  distance_km: z.number().positive().max(200),
  duration_sec: z.number().int().positive(),
  avg_pace_sec_per_km: z.number().positive(),
  avg_heart_rate_bpm: z.number().int().min(40).max(250).nullable().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('runs')
    .update({
      date: new Date(`${body.data.date}T00:00:00+09:00`).toISOString(),
      local_date_key: body.data.date,
      distance_km: body.data.distance_km,
      duration_sec: body.data.duration_sec,
      avg_pace_sec_per_km: body.data.avg_pace_sec_per_km,
      avg_heart_rate_bpm: body.data.avg_heart_rate_bpm ?? null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
