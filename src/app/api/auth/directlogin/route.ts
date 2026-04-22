import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: Request) {
  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_email' }, { status: 400 })

  const { email } = body.data
  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json({ error: error?.message ?? 'internal' }, { status: 500 })
  }

  return NextResponse.json({ token_hash: data.properties.hashed_token })
}
