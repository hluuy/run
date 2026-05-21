import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes } from 'crypto'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))

  const { origin } = new URL(request.url)
  const state = randomBytes(16).toString('hex')

  const url = new URL('https://www.strava.com/oauth/authorize')
  url.searchParams.set('client_id', process.env.STRAVA_CLIENT_ID!)
  url.searchParams.set('redirect_uri', `${origin}/api/auth/strava/callback`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'activity:read_all')
  url.searchParams.set('approval_prompt', 'auto')
  url.searchParams.set('state', state)

  const response = NextResponse.redirect(url.toString())
  response.cookies.set('strava_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return response
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  await admin.from('strava_connections').delete().eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
