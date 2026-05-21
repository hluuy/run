import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings?strava=cancelled`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('strava_oauth_state')?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/settings?strava=error`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/auth/login`)

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/settings?strava=error`)
  }

  const { access_token, refresh_token, expires_at, athlete } = await tokenRes.json()

  const admin = createAdminClient()
  await admin.from('strava_connections').upsert({
    user_id: user.id,
    strava_athlete_id: athlete.id,
    strava_athlete_name: `${athlete.firstname} ${athlete.lastname}`.trim(),
    access_token,
    refresh_token,
    expires_at: new Date(expires_at * 1000).toISOString(),
  })

  const response = NextResponse.redirect(`${origin}/settings?strava=connected`)
  response.cookies.delete('strava_oauth_state')
  return response
}
