import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const putSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  target_km: z.number().positive().max(10000).optional(),
  initial_km: z.number().min(0).max(10000).optional(),
  is_default: z.boolean().optional(),
  is_retired: z.boolean().optional(),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = putSchema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  const admin = createAdminClient()

  if (body.data.is_default === true) {
    await admin
      .from('shoes')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', id)
  }

  const updateData = { ...body.data }
  if (body.data.is_retired === true) {
    updateData.is_default = false
  }

  const { error } = await admin
    .from('shoes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin
    .from('shoes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
