import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

// 초대 링크 생성
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { group_id } = z.object({ group_id: z.string().uuid() }).parse(await request.json())

  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('invites')
    .insert({ group_id, created_by: user.id, expires_at })
    .select('token')
    .single()

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })
  return NextResponse.json({ token: data.token }, { status: 201 })
}

// 초대 토큰으로 그룹 정보 조회 (로그인 불필요)
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'missing token' }, { status: 400 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('invites')
    .select('group_id, expires_at, use_count, max_uses, revoked, groups(name, goal_type, goal_distance_km)')
    .eq('token', token)
    .maybeSingle()

  if (!data || data.revoked || new Date(data.expires_at) < new Date() || data.use_count >= data.max_uses)
    return NextResponse.json({ error: 'invalid_invite' }, { status: 404 })

  return NextResponse.json({ group: data.groups, group_id: data.group_id })
}

// 초대 수락 → group_members 삽입
export async function PUT(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { allowed } = rateLimit(`invite:${ip}`, 5, 10 * 60_000)
  if (!allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { token } = z.object({ token: z.string().uuid() }).parse(await request.json())

  const admin = createAdminClient()
  const { data: invite } = await admin
    .from('invites')
    .select('id, group_id, expires_at, use_count, max_uses, revoked')
    .eq('token', token)
    .maybeSingle()

  if (!invite || invite.revoked || new Date(invite.expires_at) < new Date() || invite.use_count >= invite.max_uses)
    return NextResponse.json({ error: 'invalid_invite' }, { status: 404 })

  // 이미 멤버인지 확인
  const { data: existing } = await admin
    .from('group_members')
    .select('user_id')
    .eq('group_id', invite.group_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    await supabase.from('group_members').insert({ group_id: invite.group_id, user_id: user.id })
    await admin.from('invites').update({ use_count: invite.use_count + 1 }).eq('id', invite.id)
  }

  return NextResponse.json({ group_id: invite.group_id })
}
