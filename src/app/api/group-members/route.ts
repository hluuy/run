import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  group_id: z.string().uuid(),
  target_user_id: z.string().uuid().optional(),
})

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  const admin = createAdminClient()

  const { data: group } = await admin
    .from('groups')
    .select('created_by')
    .eq('id', body.data.group_id)
    .single()

  // 강퇴: target_user_id 있으면 생성자만 가능
  if (body.data.target_user_id) {
    if (group?.created_by !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    if (body.data.target_user_id === user.id) {
      return NextResponse.json({ error: 'cannot_kick_self' }, { status: 400 })
    }
    const { error } = await admin
      .from('group_members')
      .delete()
      .eq('group_id', body.data.group_id)
      .eq('user_id', body.data.target_user_id)
    if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // 탈퇴: 생성자는 불가
  if (group?.created_by === user.id) {
    return NextResponse.json({ error: 'creator_cannot_leave' }, { status: 403 })
  }

  const { error } = await admin
    .from('group_members')
    .delete()
    .eq('group_id', body.data.group_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
