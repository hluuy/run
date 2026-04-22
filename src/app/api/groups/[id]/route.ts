import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  goal_type: z.enum(['daily', 'weekly', 'monthly']),
  goal_distance_km: z.number().positive().max(10000),
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
    .from('groups')
    .update(body.data)
    .eq('id', id)
    .eq('created_by', user.id)

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
