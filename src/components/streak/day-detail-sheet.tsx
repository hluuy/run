'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatPace, formatDuration } from '@/lib/streak'
import { parseGpxFile, type GpxPoint } from '@/lib/gpx'
import { createClient } from '@/lib/supabase/client'
import type { DayData, Run } from '@/types'
import { Heart, Timer, Zap, MapPin, Loader2 } from 'lucide-react'

const RouteMap = dynamic(() => import('./route-map').then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="h-48 w-full rounded-xl bg-muted animate-pulse" />,
})

interface DayDetailSheetProps {
  dayData: DayData | null
  open: boolean
  onClose: () => void
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold text-sm tabular-nums">{value}</span>
    </div>
  )
}

function RunCard({ run, index, total }: { run: Run; index: number; total: number }) {
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
          setPoints(parseGpxFile(xml).points)
        } catch {
          // GPX 파싱 실패
        } finally {
          setLoadingGpx(false)
        }
      })
  }, [run.gpx_storage_path])

  return (
    <div className="space-y-1">
      {total > 1 && (
        <p className="text-xs font-medium text-orange-500 mb-2">{index + 1}번째 러닝</p>
      )}

      {/* 지도 */}
      {run.gpx_storage_path && (
        <div className="mb-3 overflow-hidden rounded-xl">
          {loadingGpx ? (
            <div className="flex h-48 items-center justify-center rounded-xl bg-muted">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : points && points.length > 0 ? (
            <RouteMap points={points} />
          ) : (
            <p className="text-xs text-muted-foreground py-2">경로를 불러올 수 없습니다.</p>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-muted/50 border border-border/50 px-4 divide-y divide-border/50">
        <StatRow icon={<MapPin className="h-4 w-4" />} label="거리" value={`${run.distance_km.toFixed(2)} km`} />
        <StatRow icon={<Timer className="h-4 w-4" />} label="소요시간" value={formatDuration(run.duration_sec)} />
        <StatRow icon={<Zap className="h-4 w-4" />} label="페이스" value={`${formatPace(run.avg_pace_sec_per_km)} /km`} />
        {run.avg_heart_rate_bpm && (
          <StatRow icon={<Heart className="h-4 w-4 text-red-400" />} label="평균 심박수" value={`${Math.round(run.avg_heart_rate_bpm)} bpm`} />
        )}
      </div>

      {!run.gpx_storage_path && (
        <p className="text-xs text-muted-foreground px-1 pt-1">GPS 경로 없음</p>
      )}
    </div>
  )
}

export function DayDetailSheet({ dayData, open, onClose }: DayDetailSheetProps) {
  if (!dayData) return null

  const [, m, d] = dayData.localDateKey.split('-')
  const dateLabel = `${parseInt(m)}월 ${parseInt(d)}일`
  const total = dayData.runs.length

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm w-full rounded-2xl max-h-[85vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold">{dateLabel} 러닝</DialogTitle>
            {total > 1 && <Badge variant="secondary">{total}회</Badge>}
          </div>
          {total > 1 && (
            <div className="mt-3 rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 flex gap-6">
              <div>
                <p className="text-xl font-bold text-orange-500">{dayData.totalDistanceKm.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">총 거리 (km)</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-500">{formatPace(dayData.avgPaceSecPerKm)}</p>
                <p className="text-xs text-muted-foreground">평균 페이스</p>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="px-5 py-4 space-y-5">
          {dayData.runs.map((run, i) => (
            <RunCard key={run.id} run={run} index={i} total={total} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
