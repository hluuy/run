import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // GPX 파일 삭제
  const { data: runs } = await supabase.from('runs').select('gpx_storage_path').eq('user_id', user.id)
  const paths = (runs ?? []).map((r) => r.gpx_storage_path).filter(Boolean) as string[]
  if (paths.length > 0) await admin.storage.from('gpx-files').remove(paths)

  // runs, group_members, api_tokens, invites → CASCADE로 자동 삭제
  // users 레코드 삭제
  await admin.from('users').delete().eq('id', user.id)

  // Auth 계정 삭제
  await admin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ ok: true })
}
