'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ApiTokenSection } from './api-token-section'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function SettingsView() {
  const { user, profile } = useUser()
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // profile이 로드되면 닉네임 초기화
  if (profile && !nickname) setNickname(profile.nickname)

  async function saveNickname() {
    if (!user || nickname.trim().length < 2) return
    setSaving(true)
    const { error } = await supabase.from('users').update({ nickname: nickname.trim() }).eq('id', user.id)
    setSaving(false)
    error ? toast.error('저장 실패') : toast.success('닉네임이 변경됐습니다.')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function deleteAccount() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (!res.ok) { toast.error('계정 삭제 실패'); setDeleting(false); return }
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">설정</h1>
      </div>

      <div className="mx-4 space-y-4 pb-8">
        {/* 닉네임 */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="font-medium text-sm">프로필</p>
          <div className="space-y-1.5">
            <Label htmlFor="nickname">닉네임</Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="닉네임 입력"
              />
              <Button onClick={saveNickname} disabled={saving || nickname.trim().length < 2} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
              </Button>
            </div>
          </div>
        </div>

        {/* API 토큰 */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <ApiTokenSection />
        </div>

        {/* 로그아웃 / 계정 삭제 */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Button variant="outline" className="w-full" onClick={signOut}>로그아웃</Button>
          <Separator />
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-xs text-destructive text-center">정말 삭제하시겠습니까? 복구 불가합니다.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>취소</Button>
                <Button variant="destructive" className="flex-1" onClick={deleteAccount} disabled={deleting}>
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : '삭제 확인'}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={deleteAccount}>
              계정 삭제
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
