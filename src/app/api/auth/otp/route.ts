import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_email' }, { status: 400 })

  const { email } = body.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
