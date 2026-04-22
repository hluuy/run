'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nickname.trim()
    if (!trimmed || trimmed.length < 2) {
      toast.error('닉네임은 2자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { error } = await supabase.from('users').insert({
      id: user.id,
      nickname: trimmed,
    })

    setLoading(false)

    if (error) {
      if (error.code === '23505') {
        // 이미 프로필 존재 — 메인으로
        router.push('/')
      } else {
        toast.error('저장 실패: ' + error.message)
      }
      return
    }

    router.push('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="text-4xl">👋</div>
          <h1 className="text-2xl font-bold">반갑습니다!</h1>
          <p className="text-sm text-muted-foreground">
            크루에서 표시될 닉네임을 설정해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              placeholder="예: 달리기왕"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-right">
              {nickname.length}/20
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || nickname.trim().length < 2}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            시작하기
          </Button>
        </form>
      </div>
    </div>
  )
}
