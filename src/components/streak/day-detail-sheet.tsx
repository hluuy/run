'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPace, formatDuration } from '@/lib/streak'
import { parseGpxFile, type GpxPoint } from '@/lib/gpx'
import { createClient } from '@/lib/supabase/client'
import { RunForm } from './run-form'
import type { DayData, Run } from '@/types'
import { Heart, Timer, Zap, MapPin, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const RouteMap = dynamic(() => import('./route-map').then((m) => m.RouteMap), {
  ssr: false,
  loading: () => <div className="h-48 w-full rounded-xl bg-muted animate-pulse" />,
})

interface DayDetailSheetProps {
  dayData: DayData | null
  open: boolean
  onClose: () => void
  onRunAdded?: () => void
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

function RunCard({ run, index, total, onEdit, onDeleted }: {
  run: Run; index: number; total: number
  onEdit: (run: Run) => void
  onDeleted: () => void
}) {
  const [points, setPoints] = useState<GpxPoint[] | null>(null)
  const [loadingGpx, setLoadingGpx] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

  async function deleteRun() {
    setDeleting(true)
    const res = await fetch(`/api/runs/${run.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success('기록이 삭제됐습니다.')
    onDeleted()
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        {total > 1
          ? <p className="text-xs font-medium text-orange-500">{index + 1}번째 러닝</p>
          : <span />
        }
        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(run)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3 w-3" />수정
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3 w-3" />삭제
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2 mb-2">
          <p className="text-xs text-destructive font-medium">이 기록을 삭제할까요?</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setConfirmDelete(false)}>
              취소
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={deleteRun} disabled={deleting}>
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : '삭제'}
            </Button>
          </div>
        </div>
      )}

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

export function DayDetailSheet({ dayData, open, onClose, onRunAdded }: DayDetailSheetProps) {
  const [editingRun, setEditingRun] = useState<Run | null>(null)

  if (!dayData) return null

  const [, m, d] = dayData.localDateKey.split('-')
  const dateLabel = `${parseInt(m)}월 ${parseInt(d)}일`
  const total = dayData.runs.length

  function handleEditSuccess() {
    setEditingRun(null)
    onRunAdded?.()
  }

  return (
    <>
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
              <RunCard
                key={run.id} run={run} index={i} total={total}
                onEdit={setEditingRun}
                onDeleted={() => { onRunAdded?.(); onClose() }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={!!editingRun} onOpenChange={(o) => !o && setEditingRun(null)}>
        <DialogContent className="max-w-sm w-full rounded-2xl max-h-[90vh] overflow-y-auto gap-0 p-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
            <DialogTitle className="text-base font-bold">러닝 기록 수정</DialogTitle>
          </DialogHeader>
          <div className="px-5 py-4">
            {editingRun && <RunForm editRun={editingRun} onSuccess={handleEditSuccess} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
