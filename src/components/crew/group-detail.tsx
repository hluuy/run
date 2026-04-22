'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Share2, Loader2, Trophy } from 'lucide-react'
import type { Group, LeaderboardEntry } from '@/types'

function getGoalPeriod(goalType: string): { start: string; end: string } {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const toKey = (d: Date) => d.toISOString().slice(0, 10)

  if (goalType === 'daily') {
    const today = toKey(now)
    return { start: today, end: today }
  }
  if (goalType === 'weekly') {
    const day = now.getDay()
    const sun = new Date(now); sun.setDate(now.getDate() - day)
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6)
    return { start: toKey(sun), end: toKey(sat) }
  }
  // monthly
  const y = now.getFullYear(), m = now.getMonth() + 1
  const last = new Date(y, m, 0).getDate()
  return { start: `${y}-${String(m).padStart(2,'0')}-01`, end: `${y}-${String(m).padStart(2,'0')}-${last}` }
}

const GOAL_LABEL = { daily: '일간', weekly: '주간', monthly: '월간' }

export function GroupDetail({ group }: { group: Group }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const { start, end } = getGoalPeriod(group.goal_type)
    supabase.rpc('get_group_leaderboard', { p_group_id: group.id, p_start: start, p_end: end })
      .then(({ data }) => { setLeaderboard((data as LeaderboardEntry[]) ?? []); setLoading(false) })
  }, [group.id])

  const totalKm = leaderboard.reduce((s, e) => s + e.total_km, 0)
  const progress = Math.min((totalKm / group.goal_distance_km) * 100, 100)

  async function shareInvite() {
    setSharing(true)
    const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_id: group.id }) })
    setSharing(false)
    if (!res.ok) { toast.error('초대 링크 생성 실패'); return }
    const { token } = await res.json()
    const url = `${location.origin}/invite/${token}`
    if (navigator.share) {
      navigator.share({ title: `${group.name} 초대`, url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('초대 링크가 복사됐습니다!')
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold">{group.name}</h2>
          <Badge variant="secondary" className="mt-1 text-[11px]">
            {GOAL_LABEL[group.goal_type]} {group.goal_distance_km}km
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={shareInvite} disabled={sharing} className="gap-1.5">
          {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
          친구 초대
        </Button>
      </div>

      {/* 진행률 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>그룹 진행률</span>
          <span>{totalKm.toFixed(1)} / {group.goal_distance_km} km</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* 리더보드 */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5" /> 리더보드
        </p>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">아직 기록이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.user_id} className="flex items-center gap-3">
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-medium">{entry.nickname}</span>
                    <span className="text-sm font-bold tabular-nums">{entry.total_km.toFixed(2)} km</span>
                  </div>
                  <Progress value={(entry.total_km / group.goal_distance_km) * 100} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
