'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Share2, Loader2, Target, Flame, CheckCircle2, Trash2 } from 'lucide-react'
import type { Group, LeaderboardEntry } from '@/types'

function getPreviousPeriod(goalType: string): { start: string; end: string } {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const toKey = (d: Date) => d.toISOString().slice(0, 10)

  if (goalType === 'daily') {
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const key = toKey(yesterday)
    return { start: key, end: key }
  }
  if (goalType === 'weekly') {
    const day = now.getDay()
    const thisSun = new Date(now); thisSun.setDate(now.getDate() - day)
    const lastSat = new Date(thisSun); lastSat.setDate(thisSun.getDate() - 1)
    const lastSun = new Date(lastSat); lastSun.setDate(lastSat.getDate() - 6)
    return { start: toKey(lastSun), end: toKey(lastSat) }
  }
  // monthly: 저번 달
  const prevFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const py = prevFirst.getFullYear()
  const pm = prevFirst.getMonth() + 1
  const lastDay = new Date(py, pm, 0).getDate()
  return {
    start: `${py}-${String(pm).padStart(2, '0')}-01`,
    end: `${py}-${String(pm).padStart(2, '0')}-${lastDay}`,
  }
}

function getGoalPeriod(goalType: string): { start: string; end: string; label: string } {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const toKey = (d: Date) => d.toISOString().slice(0, 10)

  if (goalType === 'daily') {
    const today = toKey(now)
    return { start: today, end: today, label: '오늘' }
  }
  if (goalType === 'weekly') {
    const day = now.getDay()
    const sun = new Date(now); sun.setDate(now.getDate() - day)
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6)
    return { start: toKey(sun), end: toKey(sat), label: '이번 주' }
  }
  const y = now.getFullYear(), m = now.getMonth() + 1
  const last = new Date(y, m, 0).getDate()
  return {
    start: `${y}-${String(m).padStart(2, '0')}-01`,
    end: `${y}-${String(m).padStart(2, '0')}-${last}`,
    label: '이번 달',
  }
}

const PERIOD_LABEL: Record<string, string> = { daily: '일간', weekly: '주간', monthly: '월간' }

function MemberCard({
  entry, isMe, groupId, onGoalSaved, prevKm, joinedAt, prevStart,
}: {
  entry: LeaderboardEntry
  isMe: boolean
  groupId: string
  onGoalSaved: () => void
  prevKm: number
  joinedAt: string
  prevStart: string
}) {
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(entry.goal_distance_km ?? ''))
  const [saving, setSaving] = useState(false)

  const hasGoal = entry.goal_distance_km !== null
  const pct = hasGoal ? Math.min((entry.total_km / entry.goal_distance_km!) * 100, 100) : 0
  const achieved = hasGoal && entry.total_km >= entry.goal_distance_km!
  // 이전 주기 시작일 이전에 가입한 멤버에게만 배지 표시
  const wasInGroupDuringPrev = !!joinedAt && joinedAt.slice(0, 10) <= prevStart

  async function saveGoal() {
    const km = parseFloat(goalInput)
    if (!km || km <= 0) { toast.error('올바른 거리를 입력해주세요.'); return }
    setSaving(true)
    const res = await fetch('/api/group-members/goal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: groupId, goal_distance_km: km }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('저장 실패'); return }
    toast.success('목표가 설정됐습니다!')
    setEditingGoal(false)
    onGoalSaved()
  }

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-colors ${
      isMe ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
            isMe ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'
          }`}>
            {entry.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">
              {entry.nickname}
              {isMe && <span className="ml-1.5 text-[10px] text-primary font-normal">나</span>}
            </p>
            {hasGoal && (
              <p className="text-xs text-muted-foreground mt-0.5">목표 {entry.goal_distance_km}km</p>
            )}
            {hasGoal && wasInGroupDuringPrev && (
              <p className={`text-[10px] mt-0.5 font-medium ${prevKm >= entry.goal_distance_km! ? 'text-green-500' : 'text-muted-foreground/50'}`}>
                {prevKm >= entry.goal_distance_km! ? '✓ 저번 목표 달성' : '✗ 저번 목표 미달성'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {achieved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {hasGoal && !achieved && entry.total_km > 0 && (
            <Flame className="h-4 w-4 text-primary/80" />
          )}
          {isMe && (
            <button
              onClick={() => setEditingGoal(!editingGoal)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              {hasGoal ? '수정' : '목표 설정'}
            </button>
          )}
        </div>
      </div>

      {isMe && editingGoal && (
        <div className="flex gap-2">
          <Input
            type="text" inputMode="decimal" placeholder="목표 거리 (km)"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
            className="h-8 text-sm" autoFocus
          />
          <Button size="sm" className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0" onClick={saveGoal} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : '저장'}
          </Button>
        </div>
      )}

      {!hasGoal && isMe && !editingGoal && (
        <button
          onClick={() => setEditingGoal(true)}
          className="w-full rounded-xl border border-dashed border-primary/40 py-2.5 text-xs text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
        >
          <Target className="h-3.5 w-3.5" />내 목표 거리를 설정해주세요
        </button>
      )}

      {!hasGoal && !isMe && (
        <p className="text-xs text-muted-foreground text-center py-1">목표 미설정</p>
      )}

      {hasGoal && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className={achieved ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
              {achieved ? '목표 달성! 🎉' : `${entry.total_km.toFixed(1)} / ${entry.goal_distance_km}km`}
            </span>
            <span className={`font-semibold tabular-nums ${achieved ? 'text-green-500' : 'text-foreground'}`}>
              {Math.round(pct)}%
            </span>
          </div>
          {/* 커스텀 진행 바 — 어두운 트랙 + 은은한 오렌지 */}
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${achieved ? 'bg-green-500' : 'bg-primary/70'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function GroupDetail({ group, onUpdated }: { group: Group; onUpdated: () => void }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [prevKmMap, setPrevKmMap] = useState<Map<string, number>>(new Map())
  const [joinedAtMap, setJoinedAtMap] = useState<Map<string, string>>(new Map())
  const [prevStart, setPrevStart] = useState('')
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  async function load() {
    if (!group.goal_type) { setLoading(false); return }
    try {
      const { start, end } = getGoalPeriod(group.goal_type)
      const { start: ps, end: pe } = getPreviousPeriod(group.goal_type)

      const [{ data: currData }, { data: prevData }, { data: memberData }] = await Promise.all([
        supabase.rpc('get_group_leaderboard', { p_group_id: group.id, p_start: start, p_end: end }),
        supabase.rpc('get_group_leaderboard', { p_group_id: group.id, p_start: ps, p_end: pe }),
        supabase.from('group_members').select('user_id, joined_at').eq('group_id', group.id),
      ])

      setLeaderboard((currData as LeaderboardEntry[]) ?? [])

      const pm = new Map<string, number>()
      for (const e of ((prevData as LeaderboardEntry[]) ?? [])) {
        pm.set(e.user_id, e.total_km)
      }
      setPrevKmMap(pm)

      const jm = new Map<string, string>()
      for (const m of (memberData ?? [])) {
        jm.set(m.user_id, m.joined_at)
      }
      setJoinedAtMap(jm)
      setPrevStart(ps)
    } catch {
      toast.error('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setMyId(user?.id ?? null)
      setIsCreator(user?.id === group.created_by)
    })
    load()
  }, [group.id])

  async function shareInvite() {
    setSharing(true)
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: group.id }),
    })
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

  async function deleteGroup() {
    setDeleting(true)
    const res = await fetch(`/api/groups/${group.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success(`${group.name} 그룹이 삭제됐습니다.`)
    onUpdated()
  }

  const { label } = group.goal_type ? getGoalPeriod(group.goal_type) : { label: '' }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold text-base">{group.name}</h2>
          {group.goal_type && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {PERIOD_LABEL[group.goal_type]} · {label} 개인 목표 트래커
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={shareInvite} disabled={sharing} className="gap-1.5 h-8 text-xs">
            {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
            초대
          </Button>
          {isCreator && (
            <Button
              size="sm" variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* 삭제 확인 */}
      {confirmDelete && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <p className="text-xs text-destructive font-medium">정말 삭제하시겠습니까?</p>
          <p className="text-xs text-muted-foreground">그룹이 영구 삭제됩니다. 멤버들의 개인 러닝 기록은 유지됩니다.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setConfirmDelete(false)}>
              취소
            </Button>
            <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={deleteGroup} disabled={deleting}>
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : '삭제'}
            </Button>
          </div>
        </div>
      )}

      {/* 멤버 카드 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : leaderboard.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">아직 멤버가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <MemberCard
              key={entry.user_id}
              entry={entry}
              isMe={entry.user_id === myId}
              groupId={group.id}
              onGoalSaved={() => { setLoading(true); load() }}
              prevKm={prevKmMap.get(entry.user_id) ?? 0}
              joinedAt={joinedAtMap.get(entry.user_id) ?? ''}
              prevStart={prevStart}
            />
          ))}
        </div>
      )}
    </div>
  )
}
