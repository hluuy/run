import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push'
import { nowKST, toDateKey } from '@/lib/period'

export async function GET(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // 어제 KST 날짜
  const now = nowKST()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday)

  // 어제 런 기록이 없는 사용자 중 알림 활성화 + 구독 있는 사람
  const { data: allSubs } = await admin
    .from('push_subscriptions')
    .select('user_id')

  if (!allSubs?.length) return NextResponse.json({ ok: true })

  const subscribedUserIds = [...new Set(allSubs.map((s) => s.user_id))]

  // notifications_enabled 필터
  const { data: enabledUsers } = await admin
    .from('users')
    .select('id')
    .in('id', subscribedUserIds)
    .eq('notifications_enabled', true)

  if (!enabledUsers?.length) return NextResponse.json({ ok: true })

  const enabledIds = enabledUsers.map((u) => u.id)

  // 어제 런 있는 사람
  const { data: rannYesterday } = await admin
    .from('runs')
    .select('user_id')
    .in('user_id', enabledIds)
    .eq('local_date_key', yesterdayKey)

  const rannSet = new Set((rannYesterday ?? []).map((r) => r.user_id))
  const noRunIds = enabledIds.filter((id) => !rannSet.has(id))

  await Promise.all(
    noRunIds.map((userId) =>
      sendPushToUser(userId, {
        title: '어제 달리셨나요?',
        body: '기록이 없어요. 오늘은 함께 달려봐요 🏃',
        url: '/',
      })
    )
  )

  return NextResponse.json({ ok: true, notified: noRunIds.length })
}
