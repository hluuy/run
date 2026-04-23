'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDaysInMonth, getFirstDayOfWeek } from '@/lib/streak'
import { todayKST } from '@/lib/kst'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface DatePickerSheetProps {
  value: string       // "YYYY-MM-DD"
  onChange: (date: string) => void
  max?: string        // "YYYY-MM-DD", 기본값: 오늘 KST
}

export function DatePickerSheet({ value, onChange, max }: DatePickerSheetProps) {
  const [open, setOpen] = useState(false)
  const todayKey = todayKST()
  const safeValue = value || todayKey
  const [yearMonth, setYearMonth] = useState(safeValue.slice(0, 7))

  const maxKey = max ?? todayKey
  const currentYM = todayKey.slice(0, 7)

  const days = getDaysInMonth(yearMonth)
  const firstDow = getFirstDayOfWeek(yearMonth)
  const [y, m] = yearMonth.split('-')

  function prevMonth() {
    const d = new Date(`${yearMonth}-01`)
    d.setMonth(d.getMonth() - 1)
    setYearMonth(d.toISOString().slice(0, 7))
  }

  function nextMonth() {
    const d = new Date(`${yearMonth}-01`)
    d.setMonth(d.getMonth() + 1)
    const next = d.toISOString().slice(0, 7)
    if (next <= currentYM) setYearMonth(next)
  }

  function handleOpen() {
    setYearMonth(safeValue.slice(0, 7))
    setOpen(true)
  }

  function selectDate(dateKey: string) {
    onChange(dateKey)
    setOpen(false)
  }

  const [vy, vm, vd] = safeValue.split('-')
  const displayValue = `${vy}년 ${parseInt(vm)}월 ${parseInt(vd)}일`

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full items-center gap-2 rounded-xl border border-input bg-input px-3 py-2 text-sm text-foreground hover:border-primary/50 transition-colors text-left"
      >
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
        {displayValue}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">날짜 선택</DialogTitle>

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">{y}년 {parseInt(m)}월</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth} disabled={yearMonth >= currentYM}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-5">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((dateKey) => {
              const dayNum = parseInt(dateKey.split('-')[2])
              const isSelected = dateKey === safeValue
              const isToday = dateKey === todayKey
              const isFuture = dateKey > maxKey

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => !isFuture && selectDate(dateKey)}
                  disabled={isFuture}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-xl text-xs font-medium transition-all select-none',
                    isSelected && 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30',
                    !isSelected && isToday && 'ring-1 ring-primary/60 text-primary',
                    !isSelected && !isToday && !isFuture && 'text-foreground hover:bg-secondary active:scale-95',
                    isFuture && 'text-muted-foreground/25 cursor-not-allowed',
                  )}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
