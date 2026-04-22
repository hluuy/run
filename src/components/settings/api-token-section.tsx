'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Copy, Plus, Trash2, Loader2, HelpCircle, Smartphone, Zap, Key, CheckCircle } from 'lucide-react'

interface TokenInfo {
  id: string
  created_at: string
  last_used_at: string | null
}

export function ApiTokenSection() {
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [newToken, setNewToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/tokens')
      .then((r) => r.json())
      .then(({ tokens }) => setTokens(tokens ?? []))
      .finally(() => setFetching(false))
  }, [])

  async function generateToken() {
    setLoading(true)
    const res = await fetch('/api/tokens', { method: 'POST' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { toast.error('토큰 생성 실패'); return }

    setNewToken(data.token)
    setTokens((prev) => [{ id: data.id, created_at: data.created_at, last_used_at: null }, ...prev])
    toast.success('토큰이 생성됐습니다. 지금 복사해두세요!')
  }

  async function deleteToken(id: string) {
    const res = await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTokens((prev) => prev.filter((t) => t.id !== id))
      toast.success('토큰이 삭제됐습니다.')
    } else {
      toast.error('삭제 실패')
    }
  }

  function copyToken() {
    if (!newToken) return
    navigator.clipboard.writeText(newToken)
    toast.success('클립보드에 복사됐습니다.')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-sm">Shortcuts API 토큰</p>
            <p className="text-xs text-muted-foreground mt-0.5">iOS 단축어 자동화에 사용</p>
          </div>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  aria-label="Shortcuts 사용법"
                />
              }
            >
              <HelpCircle className="h-4 w-4" />
            </DialogTrigger>
            <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-orange-500" />
                  iOS Shortcuts 연동 방법
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                {/* 개요 */}
                <p className="text-muted-foreground text-xs leading-relaxed">
                  iPhone 단축어 앱으로 러닝이 끝나면 자동으로 기록을 전송할 수 있어요.
                  한 번 설정하면 이후엔 신경 쓸 필요가 없습니다.
                </p>

                {/* Step 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold shrink-0">1</span>
                    <span className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5" /> 토큰 발급</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-7 leading-relaxed">
                    이 화면에서 <strong className="text-foreground">발급</strong> 버튼을 눌러 토큰을 생성하세요.
                    토큰은 발급 직후 1회만 표시되니 반드시 복사해두세요.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold shrink-0">2</span>
                    <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> 단축어 앱 열기</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-7 leading-relaxed">
                    iPhone에서 <strong className="text-foreground">단축어(Shortcuts)</strong> 앱을 열고
                    하단 <strong className="text-foreground">자동화</strong> 탭으로 이동하세요.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold shrink-0">3</span>
                    <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> 자동화 만들기</span>
                  </div>
                  <ol className="text-xs text-muted-foreground ml-7 space-y-1 leading-relaxed list-decimal list-inside">
                    <li><strong className="text-foreground">+</strong> 버튼 → <strong className="text-foreground">새로운 자동화</strong></li>
                    <li><strong className="text-foreground">운동</strong> 선택 → <strong className="text-foreground">종료됨</strong> 체크</li>
                    <li>운동 유형: <strong className="text-foreground">달리기</strong> 선택</li>
                    <li><strong className="text-foreground">다음</strong> → 액션 추가</li>
                  </ol>
                </div>

                {/* Step 4 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold shrink-0">4</span>
                    <span>액션 구성</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-7 leading-relaxed mb-1">
                    아래 액션들을 순서대로 추가하세요:
                  </p>
                  <div className="ml-7 rounded-lg bg-muted/60 border border-border p-3 space-y-1.5 text-xs font-mono">
                    <p className="text-muted-foreground">// 1. URL 설정</p>
                    <p className="break-all text-foreground">https://runstreak-nine.vercel.app/api/runs/sync</p>
                    <p className="text-muted-foreground mt-2">// 2. URL 내용 가져오기 (POST)</p>
                    <p className="text-foreground">방법: POST</p>
                    <p className="text-foreground">헤더: Authorization</p>
                    <p className="text-foreground break-all">값: Bearer <span className="text-orange-400">{"<발급받은 토큰>"}</span></p>
                    <p className="text-foreground">본문 유형: JSON</p>
                  </div>
                </div>

                {/* Step 5 - JSON body */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold shrink-0">5</span>
                    <span>JSON 본문 입력</span>
                  </div>
                  <div className="ml-7 rounded-lg bg-muted/60 border border-border p-3 text-xs font-mono space-y-0.5">
                    <p className="text-muted-foreground">{"{"}</p>
                    <p className="pl-3"><span className="text-blue-400">"workout_source_id"</span>: <span className="text-orange-400">운동 식별자</span>,</p>
                    <p className="pl-3"><span className="text-blue-400">"date"</span>: <span className="text-orange-400">운동 시작 날짜</span>,</p>
                    <p className="pl-3"><span className="text-blue-400">"distance_km"</span>: <span className="text-orange-400">거리(km)</span>,</p>
                    <p className="pl-3"><span className="text-blue-400">"duration_sec"</span>: <span className="text-orange-400">소요시간(초)</span>,</p>
                    <p className="pl-3"><span className="text-blue-400">"avg_heart_rate_bpm"</span>: <span className="text-orange-400">평균 심박수</span>,</p>
                    <p className="pl-3"><span className="text-blue-400">"local_date_key"</span>: <span className="text-green-400">"YYYY-MM-DD"</span></p>
                    <p className="text-muted-foreground">{"}"}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground ml-7">
                    단축어 변수(Magic Variables)로 각 필드를 Health 앱 데이터와 연결하세요.
                  </p>
                </div>

                {/* 완료 */}
                <div className="flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    설정 완료! 이제 러닝이 끝날 때마다 자동으로 기록이 전송됩니다.
                    중복된 운동은 자동으로 걸러져 이중 등록되지 않아요.
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Button size="sm" variant="outline" onClick={generateToken} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1.5">발급</span>
        </Button>
      </div>

      {/* 새로 발급된 토큰 — 1회만 노출 */}
      {newToken && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-500 text-white text-[10px]">새 토큰</Badge>
            <p className="text-xs text-muted-foreground">지금 복사하세요 — 다시 볼 수 없습니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs font-mono break-all">
              {newToken}
            </code>
            <Button size="icon" variant="ghost" onClick={copyToken} className="shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Separator />

      {/* 토큰 목록 */}
      {fetching ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">발급된 토큰이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-xs font-mono text-muted-foreground">
                  {token.id.slice(0, 8)}…
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  발급: {new Date(token.created_at).toLocaleDateString('ko-KR')}
                  {token.last_used_at && (
                    <> · 최근 사용: {new Date(token.last_used_at).toLocaleDateString('ko-KR')}</>
                  )}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteToken(token.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
