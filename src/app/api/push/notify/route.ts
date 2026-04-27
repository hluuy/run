import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUsers, formatPace } from '@/lib/push'
import { getGoalPeriod } from '@/lib/period'
import { z } from 'zod'

const schema = z.object({
  distance_km: z.number().positive(),
  avg_pace_sec_per_km: z.number().positive(),
  local_date_key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ ok: true }) // 알림 실패가 러닝 기록 저장에 영향 안 미치게

  const { distance_km, avg_pace_sec_per_km, local_date_key } = body.data
  const admin = createAdminClient()

  // 유저 닉네임 조회
  const { data: userData } = await admin.from('users').select('nickname').eq('id', user.id).single()
  const nickname = userData?.nickname ?? '멤버'

  // 유저가 속한 그룹 목록
  const { data: myGroups } = await admin
    .from('group_members')
    .select('group_id, groups!inner(id, name, goal_type, goal_distance_km)')
    .eq('user_id', user.id)

  if (!myGroups?.length) {
    console.log('[notify] no groups for user', user.id)
    return NextResponse.json({ ok: true })
  }

  const groupIds = myGroups.map((m) => m.group_id)

  // 같은 그룹에 있는 다른 멤버 중 알림 켜진 사람
  const { data: otherMembers } = await admin
    .from('group_members')
    .select('user_id')
    .in('group_id', groupIds)
    .neq('user_id', user.id)

  const otherUserIds = [...new Set((otherMembers ?? []).map((m) => m.user_id))]
  console.log('[notify] otherUserIds', otherUserIds)

  if (otherUserIds.length > 0) {
    // notifications_enabled 필터
    const { data: enabledUsers, error: enabledErr } = await admin
      .from('users')
      .select('id')
      .in('id', otherUserIds)
      .eq('notifications_enabled', true)

    console.log('[notify] enabledUsers', enabledUsers, 'error', enabledErr)
    const recipientIds = (enabledUsers ?? []).map((u) => u.id)

    if (recipientIds.length > 0) {
      // 러닝 기록 알림
      await sendPushToUsers(recipientIds, {
        title: `${nickname}이 달렸어요`,
        body: `${distance_km.toFixed(1)}km · ${formatPace(avg_pace_sec_per_km)}/km`,
        url: '/',
      })

      // 목표 달성 여부 체크 (그룹별)
      for (const membership of myGroups) {
        const group = membership.groups as unknown as { id: string; name: string; goal_type: string; goal_distance_km: number }
        if (!group.goal_distance_km) continue
        const { start, end, label } = getGoalPeriod(group.goal_type)

        const { data: periodRuns } = await admin
          .from('runs')
          .select('distance_km')
          .eq('user_id', user.id)
          .gte('local_date_key', start)
          .lte('local_date_key', end)

        const total = (periodRuns ?? []).reduce((sum, r) => sum + r.distance_km, 0)
        const prevTotal = total - distance_km

        if (total >= group.goal_distance_km && prevTotal < group.goal_distance_km) {
          await sendPushToUsers(recipientIds, {
            title: `${nickname}이 목표를 달성했어요 🎉`,
            body: `${group.name} ${label} ${Math.round(group.goal_distance_km)}km 목표 완료!`,
            url: '/crew',
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}
