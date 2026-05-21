import { createAdminClient } from './supabase/admin'

interface StravaConnection {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
}

export async function ensureFreshToken(connection: StravaConnection): Promise<string | null> {
  if (new Date(connection.expires_at).getTime() > Date.now() + 60_000) {
    return connection.access_token
  }

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) return null

  const data = await res.json()
  const admin = createAdminClient()
  await admin
    .from('strava_connections')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at * 1000).toISOString(),
    })
    .eq('user_id', connection.user_id)

  return data.access_token
}
