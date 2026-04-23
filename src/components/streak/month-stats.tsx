'use client'

import type { DayData, RollingAvg } from '@/types'
import { formatPace } from '@/lib/streak'

interface MonthStatsProps {
  dayMap: Map<string, DayData>
  rolling: RollingAvg | null
  loading: boolean
}

export function MonthStats({ dayMap, loading }: MonthStatsProps) {
  const days = Array.from(dayMap.values())
  const totalKm = days.reduce((sum, d) => sum + d.totalDistanceKm, 0)
  const runCount = days.reduce((sum, d) => sum + d.runs.length, 0)
  const avgKm = runCount > 0 ? totalKm / runCount : 0
  const avgPace =
    runCount > 0
      ? days.reduce((sum, d) => sum + d.runs.reduce((s, r) => s + r.avg_pace_sec_per_km, 0), 0) / runCount
      : 0

  const stats = [
    {
      label: '이번 달 총 거리',
      value: loading ? '—' : `${totalKm.toFixed(2)} km`,
      className: 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20',
    },
    {
      label: '회당 평균 거리',
      value: loading ? '—' : runCount > 0 ? `${avgKm.toFixed(2)} km` : '—',
      className: 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent/20',
    },
    {
      label: '평균 페이스',
      value: loading ? '—' : runCount > 0 ? `${formatPace(avgPace)} /km` : '—',
      className: 'bg-card/50 backdrop-blur-sm border-border/50',
    },
  ]

  return (
    <div className="mx-3 mb-3 grid grid-cols-3 gap-2">
      {stats.map(({ label, value, className }) => (
        <div key={label} className={`rounded-2xl border px-3 py-3 ${className}`}>
          <p className="text-[11px] text-muted-foreground leading-tight mb-1">{label}</p>
          <p className="text-sm font-bold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  )
}
