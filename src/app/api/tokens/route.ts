import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateRawToken, hashToken } from '@/lib/api-token'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('api_tokens')
    .select('id, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ tokens: data ?? [] })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const raw = generateRawToken()
  const hash = await hashToken(raw)

  const admin = createAdminClient()

  // 기존 토큰 삭제 후 새 토큰으로 대체 (1인 1토큰)
  await admin.from('api_tokens').delete().eq('user_id', user.id)

  const { data, error } = await admin
    .from('api_tokens')
    .insert({ user_id: user.id, token_hash: hash })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })

  return NextResponse.json({ id: data.id, token: raw, created_at: data.created_at }, { status: 201 })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin.from('api_tokens').delete().eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
