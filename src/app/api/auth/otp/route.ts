import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_email' }, { status: 400 })

  const { email } = body.data

  // IP 기반: 분당 5회
  const { allowed: ipOk } = rateLimit(`otp:ip:${ip}`, 5, 60_000)
  if (!ipOk) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })


  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
