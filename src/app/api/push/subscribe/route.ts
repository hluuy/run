import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: body.data.endpoint,
    p256dh: body.data.p256dh,
    auth: body.data.auth,
  }, { onConflict: 'user_id,endpoint' })

  await admin.from('users').update({ notifications_enabled: true }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const admin = createAdminClient()

  if (body.endpoint) {
    await admin.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', body.endpoint)
  }

  await admin.from('users').update({ notifications_enabled: false }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}
