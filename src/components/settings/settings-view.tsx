'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ApiTokenSection } from './api-token-section'
import { toast } from 'sonner'
import { Loader2, TriangleAlert } from 'lucide-react'

const STORAGE_KEY = 'rnt_saved_token'

export function SettingsView() {
  const { user, profile } = useUser()
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
    setDeleting(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (!res.ok) {
      toast.error('계정 삭제 실패. 잠시 후 다시 시도해주세요.')
      setDeleting(false)
      return
    }
    localStorage.removeItem(STORAGE_KEY)
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
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            계정 삭제
          </Button>
        </div>
      </div>

      {/* 계정 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-5 w-5" />
              계정 삭제
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>계정을 삭제하면 다음 데이터가 <strong className="text-foreground">즉시 영구 삭제</strong>됩니다.</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>모든 러닝 기록 및 GPX 파일</li>
              <li>참여 중인 크루 멤버십</li>
              <li>API 토큰</li>
              <li>계정 정보</li>
            </ul>
            <p className="text-destructive text-xs font-medium">이 작업은 취소하거나 복구할 수 없습니다.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              취소
            </Button>
            <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : '영구 삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
