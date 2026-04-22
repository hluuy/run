'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface GroupInfo {
  name: string
  goal_type: string
  goal_distance_km: number
}

const GOAL_LABEL: Record<string, string> = { daily: '일간', weekly: '주간', monthly: '월간' }

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetch(`/api/invites?token=${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(({ group }) => setGroup(group))
      .catch(() => setInvalid(true))
  }, [token])

  async function join() {
    setJoining(true)
    const res = await fetch('/api/invites', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
    setJoining(false)
    if (res.status === 401) { router.push(`/auth/login?next=/invite/${token}`); return }
    if (!res.ok) { toast.error('참여 실패. 링크가 만료됐을 수 있습니다.'); return }
    toast.success(`${group?.name}에 참여했습니다!`)
    router.push('/crew')
  }

  if (invalid) return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center space-y-2">
      <div>
        <p className="text-2xl mb-2">😕</p>
        <p className="font-medium">유효하지 않은 초대 링크입니다</p>
        <p className="text-sm text-muted-foreground mt-1">만료됐거나 사용 횟수가 초과됐습니다.</p>
      </div>
    </div>
  )

  if (!group) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-4xl">🏃</div>
        <div>
          <p className="text-muted-foreground text-sm mb-1">그룹 초대</p>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {GOAL_LABEL[group.goal_type]} 목표 {group.goal_distance_km}km
          </p>
        </div>
        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={join} disabled={joining}>
          {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          참여하기
        </Button>
      </div>
    </div>
  )
}
