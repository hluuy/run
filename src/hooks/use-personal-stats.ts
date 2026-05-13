'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

export interface MonthlyTotal {
  yearMonth: string  // "2026-05"
  label: string      // "5월"
  totalKm: number
}

export interface PersonalStats {
  totalRuns: number
  totalKm: number
  bestPaceSec: number | null       // 낮을수록 빠름
  maxDistanceKm: number | null
  currentStreak: number
  longestStreak: number
  monthlyTotals: MonthlyTotal[]    // 최근 6개월
}

function calcStreaks(dateKeys: string[]): { current: number; longest: number } {
  if (dateKeys.length === 0) return { current: 0, longest: 0 }

  const sorted = [...new Set(dateKeys)].sort()
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const yesterdayKST = new Date(Date.now() + 9 * 60 * 60 * 1000 - 86400000).toISOString().slice(0, 10)

  let longest = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) { cur++; longest = Math.max(longest, cur) }
    else { cur = 1 }
  }

  // 현재 스트릭: 오늘 또는 어제까지 이어지는 연속 일수
  const last = sorted[sorted.length - 1]
  if (last !== todayKST && last !== yesterdayKST) return { current: 0, longest }

  let current = 1
  for (let i = sorted.length - 2; i >= 0; i--) {
    const prev = new Date(sorted[i])
    const next = new Date(sorted[i + 1])
    if ((next.getTime() - prev.getTime()) / 86400000 === 1) current++
    else break
  }

  return { current, longest }
}

export function usePersonalStats(enabled: boolean, openCount: number) {
  const supabase = createClient()

  const { data: user } = useSWR('auth-user', async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user ?? null
  })

  const { data, isLoading } = useSWR(
    user && enabled ? ['personal-stats', user.id, openCount] : null,
    async (): Promise<PersonalStats> => {
      const { data: runs } = await supabase
        .from('runs')
        .select('local_date_key, distance_km, avg_pace_sec_per_km, date')
        .eq('user_id', user!.id)
        .order('date', { ascending: true })

      if (!runs || runs.length === 0) {
        return { totalRuns: 0, totalKm: 0, bestPaceSec: null, maxDistanceKm: null, currentStreak: 0, longestStreak: 0, monthlyTotals: [] }
      }

      const totalRuns = runs.length
      const totalKm = runs.reduce((s, r) => s + r.distance_km, 0)
      const bestPaceSec = Math.min(...runs.map((r) => r.avg_pace_sec_per_km))
      const maxDistanceKm = Math.max(...runs.map((r) => r.distance_km))

      const { current, longest } = calcStreaks(runs.map((r) => r.local_date_key))

      // 최근 6개월 월별 합계
      const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
      const months: MonthlyTotal[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(nowKST.getFullYear(), nowKST.getMonth() - i, 1)
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const label = `${d.getMonth() + 1}월`
        const totalKmMonth = runs
          .filter((r) => r.local_date_key.startsWith(ym))
          .reduce((s, r) => s + r.distance_km, 0)
        months.push({ yearMonth: ym, label, totalKm: totalKmMonth })
      }

      return { totalRuns, totalKm, bestPaceSec, maxDistanceKm, currentStreak: current, longestStreak: longest, monthlyTotals: months }
    }
  )

  return { stats: data ?? null, loading: isLoading }
}
