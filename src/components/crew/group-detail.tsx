'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Share2, Loader2, Trophy, Pencil } from 'lucide-react'
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
  const y = now.getFullYear(), m = now.getMonth() + 1
  const last = new Date(y, m, 0).getDate()
  return { start: `${y}-${String(m).padStart(2,'0')}-01`, end: `${y}-${String(m).padStart(2,'0')}-${last}` }
}

const GOAL_LABEL: Record<string, string> = { daily: '일간', weekly: '주간', monthly: '월간' }

export function GroupDetail({ group: initialGroup, onUpdated }: { group: Group; onUpdated: () => void }) {
  const [group, setGroup] = useState(initialGroup)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalType, setGoalType] = useState<'daily' | 'weekly' | 'monthly'>(group.goal_type ?? 'weekly')
  const [goalKm, setGoalKm] = useState(String(group.goal_distance_km ?? 50))
  const [savingGoal, setSavingGoal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsCreator(user?.id === group.created_by)
    })
  }, [group.created_by])

  useEffect(() => {
    if (!group.goal_type) { setLoading(false); return }
    const { start, end } = getGoalPeriod(group.goal_type)
    supabase.rpc('get_group_leaderboard', { p_group_id: group.id, p_start: start, p_end: end })
      .then(({ data }) => { setLeaderboard((data as LeaderboardEntry[]) ?? []); setLoading(false) })
  }, [group.id, group.goal_type])

  async function saveGoal() {
    const km = parseFloat(goalKm)
    if (!km || km <= 0) { toast.error('올바른 거리를 입력해주세요.'); return }
    setSavingGoal(true)
    const res = await fetch(`/api/groups/${group.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal_type: goalType, goal_distance_km: km }),
    })
    setSavingGoal(false)
    if (!res.ok) { toast.error('목표 저장 실패'); return }
    const updated = { ...group, goal_type: goalType, goal_distance_km: km }
    setGroup(updated)
    setEditingGoal(false)
    setLoading(true)
    const { start, end } = getGoalPeriod(goalType)
    supabase.rpc('get_group_leaderboard', { p_group_id: group.id, p_start: start, p_end: end })
      .then(({ data }) => { setLeaderboard((data as LeaderboardEntry[]) ?? []); setLoading(false) })
    onUpdated()
  }

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

  const totalKm = leaderboard.reduce((s, e) => s + e.total_km, 0)
  const hasGoal = group.goal_type !== null && group.goal_distance_km !== null

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold">{group.name}</h2>
          {hasGoal && !editingGoal && (
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[11px]">
                {GOAL_LABEL[group.goal_type!]} {group.goal_distance_km}km
              </Badge>
              {isCreator && (
                <button onClick={() => setEditingGoal(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={shareInvite} disabled={sharing} className="gap-1.5">
          {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
          친구 초대
        </Button>
      </div>

      {/* 목표 설정/수정 폼 */}
      {isCreator && (!hasGoal || editingGoal) && (
        <div className="rounded-xl border border-dashed border-border p-3 space-y-3">
          <p className="text-sm font-medium">{hasGoal ? '목표 수정' : '목표 설정'}</p>
          <div className="flex gap-2">
            <Select value={goalType} onValueChange={(v) => setGoalType(v as 'daily' | 'weekly' | 'monthly')}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">일간</SelectItem>
                <SelectItem value="weekly">주간</SelectItem>
                <SelectItem value="monthly">월간</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="목표 거리 (km)"
              value={goalKm}
              onChange={(e) => setGoalKm(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={saveGoal} disabled={savingGoal}>
              {savingGoal && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}저장
            </Button>
            {hasGoal && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingGoal(false)}>
                취소
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 목표 미설정 — 비창설자에게 안내 */}
      {!hasGoal && !isCreator && (
        <p className="text-sm text-muted-foreground text-center py-2">그룹장이 목표를 아직 설정하지 않았습니다.</p>
      )}

      {/* 진행률 */}
      {hasGoal && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>그룹 진행률</span>
            <span>{totalKm.toFixed(1)} / {group.goal_distance_km} km</span>
          </div>
          <Progress value={Math.min((totalKm / group.goal_distance_km!) * 100, 100)} className="h-2" />
        </div>
      )}

      {/* 리더보드 */}
      {hasGoal && (
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
                    <Progress value={(entry.total_km / group.goal_distance_km!) * 100} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
