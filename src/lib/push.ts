import webpush from 'web-push'
import { createAdminClient } from './supabase/admin'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  const expired: string[] = []
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) expired.push(sub.id)
      }
    })
  )

  if (expired.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', expired)
  }
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  await Promise.all(userIds.map((uid) => sendPushToUser(uid, payload)))
}

export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}'${String(s).padStart(2, '0')}"`
}
