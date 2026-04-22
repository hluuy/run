'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Run, RollingAvg, DayData } from '@/types'
import { groupRunsByDay } from '@/lib/streak'

export function useMonthRuns(yearMonth: string) {
  const [dayMap, setDayMap] = useState<Map<string, DayData>>(new Map())
  const [rolling, setRolling] = useState<RollingAvg | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [y, m] = yearMonth.split('-')
    const start = `${y}-${m}-01`
    const end = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`

    const [{ data: runs }, { data: avg }] = await Promise.all([
      supabase
        .from('runs')
        .select('*')
        .eq('user_id', user.id)
        .gte('local_date_key', start)
        .lte('local_date_key', end)
        .order('date', { ascending: true }),
      supabase.rpc('get_user_rolling_avg', { p_user_id: user.id }),
    ])

    const rollingAvg = avg?.[0] ?? null
    setRolling(rollingAvg)
    setDayMap(groupRunsByDay((runs as Run[]) ?? [], rollingAvg))
    setLoading(false)
  }, [yearMonth])

  useEffect(() => { fetch() }, [fetch])

  return { dayMap, rolling, loading, refetch: fetch }
}
