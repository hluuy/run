'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Target } from 'lucide-react'

interface GroupInfo {
  name: string
  goal_type: string | null
}

const PERIOD_LABEL: Record<string, string> = { daily: '일간', weekly: '주간', monthly: '월간' }

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [step, setStep] = useState<'preview' | 'goal'>('preview')
  const [joining, setJoining] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  useEffect(() => {
    fetch(`/api/invites?token=${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ group, group_id }) => { setGroup(group); setGroupId(group_id) })
      .catch(() => setInvalid(true))
  }, [token])

  async function join() {
    setJoining(true)
    const res = await fetch('/api/invites', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    setJoining(false)
    if (res.status === 401) { router.push(`/auth/login?next=/invite/${token}`); return }
    if (res.status === 429) {
      const data = await res.json()
      toast.error(data.message ?? '잠시 후 다시 시도해주세요.')
      return
    }
    if (!res.ok) { toast.error('참여 실패. 링크가 만료됐을 수 있습니다.'); return }
    setStep('goal')
  }

  async function saveGoalAndFinish() {
    const km = parseFloat(goalInput)
    if (km && km > 0 && groupId) {
      setSavingGoal(true)
      await fetch('/api/group-members/goal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, goal_distance_km: km }),
      })
      setSavingGoal(false)
    }
    toast.success(`${group?.name}에 참여했습니다!`)
    router.push('/crew')
  }

  if (invalid) return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center space-y-2">
        <p className="text-3xl">😕</p>
        <p className="font-medium">유효하지 않은 초대 링크입니다</p>
        <p className="text-sm text-muted-foreground">만료됐거나 사용 횟수가 초과됐습니다.</p>
      </div>
    </div>
  )

  if (!group) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (step === 'goal') return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-2xl">
            🎯
          </div>
          <h1 className="text-xl font-bold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {group.goal_type ? `${PERIOD_LABEL[group.goal_type]} 목표` : '목표'} 거리를 설정해주세요.<br />
            나중에 크루 페이지에서 언제든 바꿀 수 있어요.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              내 {group.goal_type ? PERIOD_LABEL[group.goal_type] : ''} 목표 거리
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="예: 30"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveGoalAndFinish()}
                className="pr-10 h-12 text-lg"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">km</span>
            </div>
          </div>

          <Button
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            onClick={saveGoalAndFinish}
            disabled={savingGoal}
          >
            {savingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : '시작하기'}
          </Button>
        </div>

        <button
          onClick={() => { toast.success(`${group?.name}에 참여했습니다!`); router.push('/crew') }}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          나중에 설정할게요
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-2xl">
            🏃
          </div>
          <p className="text-sm text-muted-foreground">그룹 초대</p>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.goal_type && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              {PERIOD_LABEL[group.goal_type]} 목표 트래커
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">✅ 그룹원과 함께 달리기 기록을 공유해요</p>
          <p className="flex items-center gap-2">✅ 각자의 {group.goal_type ? PERIOD_LABEL[group.goal_type] : ''} 목표를 설정하고 달성해요</p>
          <p className="flex items-center gap-2">✅ 서로 동기부여가 돼요</p>
        </div>

        <Button
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          onClick={join}
          disabled={joining}
        >
          {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '참여하기'}
        </Button>
      </div>
    </div>
  )
}
