import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateRawToken, hashToken } from '@/lib/api-token'

// 현재 토큰 목록 조회
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('api_tokens')
    .select('id, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ tokens: data ?? [] })
}

// 새 토큰 발급 (원문은 응답에 1회만 포함)
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const raw = generateRawToken()
  const hash = await hashToken(raw)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('api_tokens')
    .insert({ user_id: user.id, token_hash: hash })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })

  return NextResponse.json({ id: data.id, token: raw, created_at: data.created_at }, { status: 201 })
}

// 토큰 삭제
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await supabase.from('api_tokens').delete().eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
