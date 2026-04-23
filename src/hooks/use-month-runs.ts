'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Run, RollingAvg, DayData } from '@/types'
import { groupRunsByDay } from '@/lib/streak'

export function useMonthRuns(yearMonth: string) {
  const supabase = createClient()

  const { data: user } = useSWR(
    'auth-user',
    async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user ?? null
    }
  )

  const { data, isLoading, mutate } = useSWR(
    user ? ['month-runs', yearMonth, user.id] : null,
    async () => {
      const [y, m] = yearMonth.split('-')
      const start = `${y}-${m}-01`
      const end = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`

      const [{ data: runs }, { data: avg }] = await Promise.all([
        supabase
          .from('runs')
          .select('*')
          .eq('user_id', user!.id)
          .gte('local_date_key', start)
          .lte('local_date_key', end)
          .order('date', { ascending: true }),
        supabase.rpc('get_user_rolling_avg', { p_user_id: user!.id }),
      ])

      const rollingAvg = (avg?.[0] as RollingAvg) ?? null
      return {
        dayMap: groupRunsByDay((runs as Run[]) ?? [], rollingAvg),
        rolling: rollingAvg,
      }
    }
  )

  return {
    dayMap: data?.dayMap ?? new Map<string, DayData>(),
    rolling: data?.rolling ?? null,
    loading: isLoading,
    refetch: mutate,
  }
}
