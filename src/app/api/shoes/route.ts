import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const postSchema = z.object({
  name: z.string().min(1).max(100),
  target_km: z.number().positive().max(10000).default(500),
  initial_km: z.number().min(0).max(10000).default(0),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const [{ data: shoesData }, { data: runTotals }] = await Promise.all([
    admin
      .from('shoes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_retired', { ascending: true })
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false }),
    admin
      .from('runs')
      .select('shoe_id, distance_km')
      .eq('user_id', user.id)
      .not('shoe_id', 'is', null),
  ])

  const totals = new Map<string, number>()
  for (const r of runTotals ?? []) {
    if (r.shoe_id) totals.set(r.shoe_id, (totals.get(r.shoe_id) ?? 0) + r.distance_km)
  }

  const shoes = (shoesData ?? []).map(s => ({
    ...s,
    current_km: s.initial_km + (totals.get(s.id) ?? 0),
  }))

  return NextResponse.json(shoes)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = postSchema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('shoes')
    .insert({
      user_id: user.id,
      name: body.data.name,
      target_km: body.data.target_km,
      initial_km: body.data.initial_km,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })
  return NextResponse.json({ ...data, current_km: data.initial_km }, { status: 201 })
}
