import { NextResponse } from 'next/server'

// One-time endpoint to register the Strava webhook subscription.
// Protected by ADMIN_SECRET header.
// After calling this once and getting a subscription_id, you can delete this file.
export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { origin } = new URL(request.url)
  const callbackUrl = `${origin}/api/webhooks/strava`

  const body = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    client_secret: process.env.STRAVA_CLIENT_SECRET!,
    callback_url: callbackUrl,
    verify_token: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN!,
  })

  const res = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
    method: 'POST',
    body,
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })

  return NextResponse.json(data)
}

// Check existing webhook subscriptions
export async function GET(request: Request) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const url = new URL('https://www.strava.com/api/v3/push_subscriptions')
  url.searchParams.set('client_id', process.env.STRAVA_CLIENT_ID!)
  url.searchParams.set('client_secret', process.env.STRAVA_CLIENT_SECRET!)

  const res = await fetch(url.toString())
  const data = await res.json()
  return NextResponse.json(data)
}
