'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw, Loader2, Unlink, CheckCircle2, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { StravaConflictDialog, type StravaConflict } from '@/components/strava-conflict-dialog'

interface StravaStatus {
  connected: boolean
  athlete_name?: string | null
  last_synced_at?: string | null
}

interface LastSync {
  id: string
  synced_count: number
  synced_at: string
}

function formatSyncedAt(iso: string | null | undefined): string {
  if (!iso) return '동기화 전'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export function StravaSection() {
  const [status, setStatus] = useState<StravaStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [lastSync, setLastSync] = useState<LastSync | null>(null)
  const [rollbackOpen, setRollbackOpen] = useState(false)
  const [rollingBack, setRollingBack] = useState(false)
  const [conflicts, setConflicts] = useState<StravaConflict[]>([])
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)

  useEffect(() => {
    fetch('/api/auth/strava/status')
      .then(r => r.json())
      .then(setStatus)

    fetch('/api/runs/strava-sync')
      .then(r => r.json())
      .then(data => setLastSync(data ?? null))

    const params = new URLSearchParams(window.location.search)
    const stravaParam = params.get('strava')
    if (stravaParam === 'connected') {
      toast.success('Strava 연동이 완료됐습니다.')
      window.history.replaceState({}, '', '/settings')
    } else if (stravaParam === 'error') {
      toast.error('Strava 연동에 실패했습니다. 다시 시도해 주세요.')
      window.history.replaceState({}, '', '/settings')
    } else if (stravaParam === 'cancelled') {
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  async function sync(options?: { skip_dates?: string[] }) {
    setSyncing(true)
    try {
      const body = options?.skip_dates !== undefined ? { skip_dates: options.skip_dates } : undefined
      const res = await fetch('/api/runs/strava-sync', {
        method: 'POST',
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'rate_limited') toast.error('Strava 요청 한도 초과. 잠시 후 다시 시도해 주세요.')
        else toast.error('동기화 실패. 잠시 후 다시 시도해 주세요.')
        return
      }

      if (data.needs_confirmation) {
        setConflicts(data.conflicts)
        setConflictDialogOpen(true)
        return
      }

      const now = new Date().toISOString()
      setStatus(prev => prev ? { ...prev, last_synced_at: now } : prev)

      if (data.synced === 0) {
        toast.success('새로운 러닝 기록이 없습니다.')
        setLastSync(null)
      } else {
        toast.success(`${data.synced}개의 러닝 기록을 가져왔습니다.`)
        const syncRes = await fetch('/api/runs/strava-sync')
        const syncData = await syncRes.json()
        setLastSync(syncData ?? null)
      }
    } finally {
      setSyncing(false)
    }
  }

  async function rollback() {
    setRollingBack(true)
    try {
      const res = await fetch('/api/runs/strava-sync', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error('되돌리기 실패. 다시 시도해 주세요.')
        return
      }
      toast.success(`${data.rolled_back}개의 기록이 삭제됐습니다.`)
      setLastSync(null)
      setStatus(prev => prev ? { ...prev, last_synced_at: undefined } : prev)
    } finally {
      setRollingBack(false)
      setRollbackOpen(false)
    }
  }

  async function disconnect() {
    setDisconnecting(true)
    const res = await fetch('/api/auth/strava', { method: 'DELETE' })
    setDisconnecting(false)
    setDisconnectOpen(false)
    if (res.ok) {
      setStatus({ connected: false })
      toast.success('Strava 연동이 해제됐습니다.')
    } else {
      toast.error('연동 해제 실패')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Strava 연동</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status?.connected
              ? `${status.athlete_name ?? ''} · 마지막 동기화: ${formatSyncedAt(status.last_synced_at)}`
              : '연결하면 러닝 기록을 자동으로 가져옵니다'}
          </p>
        </div>

        {status === null ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : status.connected ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => sync()} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-1.5">동기화</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setDisconnectOpen(true)}
              aria-label="연동 해제"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="bg-[#FC4C02] hover:bg-[#e04500] text-white"
            onClick={() => { window.location.href = '/api/auth/strava' }}
          >
            연결
          </Button>
        )}
      </div>

      {status?.connected && (
        <div className="flex items-center gap-1.5 text-xs text-green-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>연동됨</span>
        </div>
      )}

      {/* 롤백 섹션 */}
      {status?.connected && lastSync && (
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            마지막 동기화 <span className="font-medium text-foreground">{lastSync.synced_count}개</span> 기록 · {formatSyncedAt(lastSync.synced_at)}
          </p>
          <button
            onClick={() => setRollbackOpen(true)}
            className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            되돌리기
          </button>
        </div>
      )}

      {/* 충돌 확인 */}
      <StravaConflictDialog
        open={conflictDialogOpen}
        conflicts={conflicts}
        onSkip={() => { setConflictDialogOpen(false); sync({ skip_dates: conflicts.map(c => c.date) }) }}
        onAddAll={() => { setConflictDialogOpen(false); sync({ skip_dates: [] }) }}
        onCancel={() => setConflictDialogOpen(false)}
      />

      {/* 연동 해제 확인 */}
      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Strava 연동 해제</DialogTitle>
            <DialogDescription className="text-left pt-1">
              연동을 해제하면 이후 Strava 기록을 자동으로 가져올 수 없습니다.
              기존에 가져온 러닝 기록은 삭제되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDisconnectOpen(false)}>취소</Button>
            <Button variant="destructive" size="sm" onClick={disconnect} disabled={disconnecting}>
              {disconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              해제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 롤백 확인 */}
      <Dialog open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>동기화 되돌리기</DialogTitle>
            <DialogDescription className="text-left pt-1">
              마지막 동기화로 가져온 <span className="font-medium text-foreground">{lastSync?.synced_count}개</span>의 러닝 기록이 모두 삭제됩니다.
              이 작업은 취소할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRollbackOpen(false)} disabled={rollingBack}>
              취소
            </Button>
            <Button variant="destructive" size="sm" onClick={rollback} disabled={rollingBack}>
              {rollingBack ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              되돌리기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
