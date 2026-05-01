'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Run, RollingAvg, DayData } from '@/types'
import { groupRunsByDay } from '@/lib/streak'

export function useMemberMonthRuns(targetUserId: string, yearMonth: string) {
  const supabase = createClient()

  const { data, isLoading } = useSWR(
    ['member-month-runs', targetUserId, yearMonth],
    async () => {
      const [y, m] = yearMonth.split('-')
      const start = `${y}-${m}-01`
      const end = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`

      const [{ data: runs }, { data: avg }] = await Promise.all([
        supabase.rpc('get_member_month_runs', {
          p_target_user_id: targetUserId,
          p_start: start,
          p_end: end,
        }),
        supabase.rpc('get_member_rolling_avg', { p_target_user_id: targetUserId }),
      ])

      const rollingAvg = (avg?.[0] as RollingAvg) ?? null
      return {
        dayMap: groupRunsByDay((runs as unknown as Run[]) ?? [], rollingAvg),
        rolling: rollingAvg,
      }
    }
  )

  return {
    dayMap: data?.dayMap ?? new Map<string, DayData>(),
    rolling: data?.rolling ?? null,
    loading: isLoading,
  }
}
