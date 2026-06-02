'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export interface StravaConflict {
  date: string
  strava_distance_km: number
  existing_distance_km: number
}

interface Props {
  open: boolean
  conflicts: StravaConflict[]
  onSkip: () => void
  onAddAll: () => void
  onCancel: () => void
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}

export function StravaConflictDialog({ open, conflicts, onSkip, onAddAll, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>이미 기록된 날짜가 있습니다</DialogTitle>
          <DialogDescription className="text-left pt-1">
            Strava에서 가져올 기록 중 이미 같은 날짜에 기록이 존재합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="grid grid-cols-3 px-3 py-2 bg-muted/50 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground">날짜</span>
            <span className="text-xs font-medium text-muted-foreground text-center">기존</span>
            <span className="text-xs font-medium text-muted-foreground text-right">Strava</span>
          </div>
          {conflicts.map(c => (
            <div key={c.date} className="grid grid-cols-3 px-3 py-2.5 border-b border-border/30 last:border-0">
              <span className="text-sm font-medium">{formatDate(c.date)}</span>
              <span className="text-sm text-muted-foreground text-center">{c.existing_distance_km.toFixed(1)} km</span>
              <span className="text-sm text-right">{c.strava_distance_km.toFixed(1)} km</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
            onClick={onSkip}
          >
            중복 건너뛰고 동기화
          </Button>
          <Button variant="outline" className="w-full" onClick={onAddAll}>
            모두 추가
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
