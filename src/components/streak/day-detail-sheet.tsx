'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatPace, formatDuration } from '@/lib/streak'
import { parseGpxFile, type GpxPoint } from '@/lib/gpx'
import { createClient } from '@/lib/supabase/client'
import type { DayData, Run } from '@/types'
import { Heart, Timer, Zap, MapPin, Loader2 } from 'lucide-react'

// Leaflet은 SSR 불가 — 클라이언트에서만 로드
const RouteMap = dynamic(() => import('./route-map').then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="h-52 w-full rounded-xl bg-muted animate-pulse" />,
})

interface DayDetailSheetProps {
  dayData: DayData | null
  open: boolean
  onClose: () => void
  onRunAdded?: () => void
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold text-sm">{value}</span>
    </div>
  )
}

function RunCard({ run }: { run: Run }) {
  const [points, setPoints] = useState<GpxPoint[] | null>(null)
  const [loadingGpx, setLoadingGpx] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!run.gpx_storage_path) return
    setLoadingGpx(true)

    supabase.storage
      .from('gpx-files')
      .download(run.gpx_storage_path)
      .then(async ({ data, error }) => {
        if (error || !data) { setLoadingGpx(false); return }
        try {
          const xml = await data.text()
          const parsed = parseGpxFile(xml)
          setPoints(parsed.points)
        } catch {
          // GPX 파싱 실패 — 지도 미표시
        } finally {
          setLoadingGpx(false)
        }
      })
  }, [run.gpx_storage_path])

  return (
    <div className="rounded-xl border border-border p-4 space-y-1">
      {/* 지도 */}
      {run.gpx_storage_path && (
        <div className="mb-3">
          {loadingGpx ? (
            <div className="flex h-52 items-center justify-center rounded-xl bg-muted">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : points && points.length > 0 ? (
            <RouteMap points={points} />
          ) : (
            <p className="text-xs text-muted-foreground py-2">경로를 불러올 수 없습니다.</p>
          )}
        </div>
      )}

      <StatRow icon={<MapPin className="h-4 w-4" />} label="거리" value={`${run.distance_km.toFixed(2)} km`} />
      <Separator />
      <StatRow icon={<Timer className="h-4 w-4" />} label="소요시간" value={formatDuration(run.duration_sec)} />
      <Separator />
      <StatRow icon={<Zap className="h-4 w-4" />} label="페이스" value={`${formatPace(run.avg_pace_sec_per_km)} /km`} />
      {run.avg_heart_rate_bpm && (
        <>
          <Separator />
          <StatRow icon={<Heart className="h-4 w-4" />} label="평균 심박수" value={`${Math.round(run.avg_heart_rate_bpm)} bpm`} />
        </>
      )}
      {!run.gpx_storage_path && (
        <p className="mt-2 text-xs text-muted-foreground">GPS 경로 없음</p>
      )}
    </div>
  )
}

export function DayDetailSheet({ dayData, open, onClose }: DayDetailSheetProps) {
  if (!dayData) return null

  const [, m, d] = dayData.localDateKey.split('-')
  const dateLabel = `${parseInt(m)}월 ${parseInt(d)}일`
  const totalRuns = dayData.runs.length

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{dateLabel} 러닝</SheetTitle>
            {totalRuns > 1 && <Badge variant="secondary">{totalRuns}회</Badge>}
          </div>
        </SheetHeader>

        {/* 하루 총합 (복수 러닝) */}
        {totalRuns > 1 && (
          <div className="mb-4 rounded-xl bg-muted p-4">
            <p className="text-xs text-muted-foreground mb-2">하루 총합</p>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold">{dayData.totalDistanceKm.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">km</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPace(dayData.avgPaceSecPerKm)}</p>
                <p className="text-xs text-muted-foreground">평균 페이스</p>
              </div>
            </div>
          </div>
        )}

        {/* 개별 러닝 카드 */}
        <div className="space-y-4">
          {dayData.runs.map((run, i) => (
            <div key={run.id}>
              {totalRuns > 1 && (
                <p className="text-xs text-muted-foreground mb-2">{i + 1}번째 러닝</p>
              )}
              <RunCard run={run} />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
