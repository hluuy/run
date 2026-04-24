'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getDaysInMonth, getFirstDayOfWeek, intensityToStyle } from '@/lib/streak'
import { DayDetailSheet } from './day-detail-sheet'
import type { DayData } from '@/types'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface StreakCalendarProps {
  yearMonth: string
  dayMap: Map<string, DayData>
  loading: boolean
  onMonthChange: (ym: string) => void
  onRunAdded: () => void
}

export function StreakCalendar({ yearMonth, dayMap, loading, onMonthChange, onRunAdded }: StreakCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  const days = getDaysInMonth(yearMonth)
  const firstDow = getFirstDayOfWeek(yearMonth)
  const todayKey = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const currentYM = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7)

  const [y, m] = yearMonth.split('-')
  const displayLabel = `${y}년 ${parseInt(m)}월`

  function prevMonth() {
    const d = new Date(`${yearMonth}-01`)
    d.setMonth(d.getMonth() - 1)
    onMonthChange(d.toISOString().slice(0, 7))
  }

  function nextMonth() {
    const d = new Date(`${yearMonth}-01`)
    d.setMonth(d.getMonth() + 1)
    const next = d.toISOString().slice(0, 7)
    if (next <= currentYM) onMonthChange(next)
  }

  return (
    <>
      <div className="select-none">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{displayLabel}</span>
          <Button variant="ghost" size="icon" onClick={nextMonth} disabled={yearMonth >= currentYM}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 px-2 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
            불러오는 중…
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 px-2 pb-2">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((dateKey) => {
              const dayData = dayMap.get(dateKey)
              const isToday = dateKey === todayKey
              const hasRun = !!dayData
              const dayNum = parseInt(dateKey.split('-')[2])

              return (
                <button
                  key={dateKey}
                  onClick={() => hasRun && setSelectedDay(dayData)}
                  aria-label={hasRun
                    ? `${dateKey} 러닝 기록 보기 (${dayData.totalDistanceKm.toFixed(1)}km)`
                    : `${dateKey}${isToday ? ' (오늘)' : ''}`
                  }
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-medium transition-transform active:scale-95',
                    hasRun ? 'cursor-pointer' : 'cursor-default',
                    isToday && !hasRun && 'ring-1 ring-primary/60'
                  )}
                  style={hasRun ? intensityToStyle(dayData.intensityScore) : undefined}
                >
                  <span className={cn(hasRun ? 'text-foreground' : 'text-muted-foreground')}>{dayNum}</span>
                  {hasRun && (
                    <span className="text-[9px] text-primary/60 leading-none mt-0.5">
                      {dayData.totalDistanceKm.toFixed(1)}k
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <DayDetailSheet
        dayData={selectedDay}
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        onRunAdded={onRunAdded}
      />
    </>
  )
}
