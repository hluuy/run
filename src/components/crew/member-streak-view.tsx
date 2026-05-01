'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useMemberMonthRuns } from '@/hooks/use-member-month-runs'
import { StreakCalendar } from '@/components/streak/streak-calendar'
import { MonthStats } from '@/components/streak/month-stats'

function currentYearMonth() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

export function MemberStreakView({ userId, nickname }: { userId: string; nickname: string }) {
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const { dayMap, rolling, loading } = useMemberMonthRuns(userId, yearMonth)
  const router = useRouter()

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold truncate">{nickname}의 스트릭</h1>
      </div>

      <MonthStats dayMap={dayMap} rolling={rolling} loading={loading} />

      <div className="mx-3 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
        <StreakCalendar
          yearMonth={yearMonth}
          dayMap={dayMap}
          loading={loading}
          onMonthChange={setYearMonth}
          onRunAdded={() => {}}
          readOnly
        />
      </div>

      <div className="flex items-center gap-3 px-4 mt-3 mb-2">
        <p className="text-xs text-muted-foreground">강도:</p>
        {[
          { color: 'oklch(0.72 0.10 45)', label: '평균 미만' },
          { color: 'oklch(0.72 0.18 45)', label: '평균 이상' },
          { color: 'oklch(0.62 0.21 25)', label: '최고' },
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
