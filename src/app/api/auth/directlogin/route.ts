import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  redirectTo: z.string().optional(),
})

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_email' }, { status: 400 })

  const { email, redirectTo } = body.data
  const admin = createAdminClient()

  // 기존 사용자 여부 확인 (소규모 앱 — 최대 1000명까지 스캔)
  const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const isExisting = listData?.users?.some((u) => u.email === email) ?? false

  if (isExisting) {
    // 기존 사용자 → 즉시 로그인 토큰 생성 (이메일 미발송)
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (error || !data?.properties?.hashed_token) {
      return NextResponse.json({ error: error?.message ?? 'internal' }, { status: 500 })
    }
    return NextResponse.json({ token_hash: data.properties.hashed_token })
  }

  // 신규 사용자 → 실제 이메일 인증 링크 발송
  const publicClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { error: otpError } = await publicClient.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
    },
  })
  if (otpError) {
    return NextResponse.json({ error: otpError.message }, { status: 500 })
  }

  return NextResponse.json({ email_sent: true })
}
