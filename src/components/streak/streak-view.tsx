'use client'

import { useState } from 'react'
import { useMonthRuns } from '@/hooks/use-month-runs'
import { StreakCalendar } from './streak-calendar'
import { MonthStats } from './month-stats'
import { AddRunSheet } from './add-run-sheet'

function currentYearMonth() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

export function StreakView() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const { dayMap, rolling, loading, refetch } = useMonthRuns(yearMonth)

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">내 스트릭</h1>
        <AddRunSheet onSuccess={refetch} />
      </div>

      {/* 이번 달 통계 */}
      <MonthStats dayMap={dayMap} rolling={rolling} loading={loading} />

      {/* 캘린더 */}
      <div className="mx-3 rounded-2xl border border-border bg-card overflow-hidden">
        <StreakCalendar
          yearMonth={yearMonth}
          dayMap={dayMap}
          loading={loading}
          onMonthChange={setYearMonth}
          onRunAdded={refetch}
        />
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3 px-4 mt-3 mb-2">
        <p className="text-xs text-muted-foreground">강도:</p>
        {[
          { color: 'hsl(36 90% 68%)', label: '평균 미만' },
          { color: 'hsl(28 90% 55%)', label: '평균 이상' },
          { color: 'hsl(20 90% 42%)', label: '최고' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
