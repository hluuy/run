'use client'

import { useState, useEffect } from 'react'
import { Flame, BarChart2, RefreshCw, Loader2 } from 'lucide-react'
import { useMonthRuns } from '@/hooks/use-month-runs'
import { StreakCalendar } from './streak-calendar'
import { MonthStats } from './month-stats'
import { AddRunSheet } from './add-run-sheet'
import { PersonalStatsDialog } from './personal-stats-dialog'
import { toast } from 'sonner'

function currentYearMonth() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

export function StreakView() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const [statsOpen, setStatsOpen] = useState(false)
  const [statsOpenCount, setStatsOpenCount] = useState(0)
  const { dayMap, rolling, loading, refetch } = useMonthRuns(yearMonth)
  const [stravaConnected, setStravaConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetch('/api/auth/strava/status')
      .then(r => r.json())
      .then(d => setStravaConnected(d.connected))
  }, [])

  async function syncStrava() {
    setSyncing(true)
    try {
      const res = await fetch('/api/runs/strava-sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error('동기화 실패. 잠시 후 다시 시도해 주세요.')
        return
      }
      if (data.synced === 0) toast.success('새로운 러닝 기록이 없습니다.')
      else { toast.success(`${data.synced}개의 기록을 가져왔습니다.`); refetch() }
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">내 스트릭</h1>
          <Flame className="h-5 w-5 text-primary animate-pulse" />
          <button
            onClick={() => { setStatsOpen(true); setStatsOpenCount((c) => c + 1) }}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <BarChart2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {stravaConnected && (
            <button
              onClick={syncStrava}
              disabled={syncing}
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Strava 동기화"
            >
              {syncing
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RefreshCw className="h-4 w-4" />}
            </button>
          )}
          <AddRunSheet onSuccess={refetch} />
        </div>
      </div>

      <PersonalStatsDialog open={statsOpen} onClose={() => setStatsOpen(false)} openCount={statsOpenCount} />

      {/* 이번 달 통계 */}
      <MonthStats dayMap={dayMap} rolling={rolling} loading={loading} yearMonth={yearMonth} />

      {/* 캘린더 */}
      <div className="mx-3 rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
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
