'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

export const ITEM_H = 32
export const VISIBLE = 3
export const WHEEL_PAD = ((VISIBLE - 1) / 2) * ITEM_H  // 32px

interface WheelPickerProps {
  items: string[]
  selectedIndex: number
  onChange: (index: number) => void
  className?: string
}

export function WheelPicker({ items, selectedIndex, onChange, className }: WheelPickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const programmatic = useRef(false)
  const [liveIndex, setLiveIndex] = useState(selectedIndex)

  // 초기 스크롤 위치
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = selectedIndex * ITEM_H
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 외부 값 변경 시 스크롤
  useEffect(() => {
    const el = ref.current
    if (!el || programmatic.current) return
    const target = selectedIndex * ITEM_H
    if (Math.abs(el.scrollTop - target) > 2) {
      programmatic.current = true
      el.scrollTo({ top: target, behavior: 'smooth' })
      setLiveIndex(selectedIndex)
      setTimeout(() => { programmatic.current = false }, 400)
    }
  }, [selectedIndex])

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const approx = Math.round(el.scrollTop / ITEM_H)
    setLiveIndex(Math.max(0, Math.min(items.length - 1, approx)))

    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const clamped = Math.max(0, Math.min(items.length - 1, approx))
      programmatic.current = true
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
      onChange(clamped)
      setTimeout(() => { programmatic.current = false }, 400)
    }, 120)
  }, [items.length, onChange])

  return (
    <div className={cn('relative flex-1', className)} style={{ height: ITEM_H * VISIBLE }}>
      {/* 선택 항목 하이라이트 */}
      <div
        className="pointer-events-none absolute inset-x-0 rounded-xl bg-secondary/80"
        style={{ top: WHEEL_PAD, height: ITEM_H }}
      />
      {/* 스크롤 가능한 항목 목록 */}
      <div
        ref={ref}
        className="absolute inset-0 overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: 'y mandatory', touchAction: 'pan-y' }}
        onScroll={onScroll}
      >
        <div style={{ paddingTop: WHEEL_PAD, paddingBottom: WHEEL_PAD }}>
          {items.map((item, i) => {
            const d = Math.abs(i - liveIndex)
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-center select-none transition-all duration-100',
                  d === 0 && 'text-foreground text-base font-bold',
                  d === 1 && 'text-muted-foreground/70 text-sm font-normal',
                  d === 2 && 'text-muted-foreground/35 text-xs',
                  d >= 3  && 'text-muted-foreground/15 text-xs',
                )}
                style={{ height: ITEM_H, scrollSnapAlign: 'center' }}
              >
                {item}
              </div>
            )
          })}
        </div>
      </div>
      {/* 위 페이드 */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 z-10 bg-gradient-to-b from-popover to-transparent"
        style={{ height: WHEEL_PAD }}
      />
      {/* 아래 페이드 */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-popover to-transparent"
        style={{ height: WHEEL_PAD }}
      />
    </div>
  )
}
