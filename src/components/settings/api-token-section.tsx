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
import { Copy, Plus, Trash2, Loader2, HelpCircle, Smartphone, Zap, Key, CheckCircle, ChevronRight } from 'lucide-react'

function StepBlock({ num, icon, title, children }: {
  num: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-medium text-sm">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-orange-500 text-[10px] font-bold shrink-0">{num}</span>
        <span className="flex items-center gap-1.5">{icon}{title}</span>
      </div>
      <div className="ml-7 space-y-2">{children}</div>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono font-medium text-foreground">
      {children}
    </span>
  )
}

function PathRow({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {steps.map((s, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
          <strong className="text-foreground">{s}</strong>
        </span>
      ))}
    </div>
  )
}

function ActionRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-2 px-3 py-2 items-start">
      <span className="text-muted-foreground text-[11px] pt-px">{label}</span>
      <span className={`text-[11px] leading-relaxed ${highlight ? 'text-orange-400' : 'text-foreground'}`}>{value}</span>
    </div>
  )
}

function JsonRow({ k, v, note, highlight }: { k: string; v: string; note?: string; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-2 px-3 py-2 items-start">
      <span className="font-mono text-[11px] text-blue-400 break-all">{k}</span>
      <div>
        <span className={`text-[11px] leading-relaxed ${highlight ? 'text-orange-400' : 'text-foreground'}`}>{v}</span>
        {note && <p className="text-[10px] text-muted-foreground mt-0.5">{note}</p>}
      </div>
    </div>
  )
}

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

              <div className="space-y-5 text-sm">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  러닝이 끝나면 자동으로 기록을 전송하는 자동화를 설정합니다.
                  한 번만 설정하면 이후엔 신경 쓸 필요 없습니다.
                </p>

                <div className="rounded-lg bg-blue-500/8 border border-blue-500/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-blue-400">💡 변수 선택이란?</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    값 입력 칸을 탭하면 키보드 위에 <strong className="text-foreground">변수 선택</strong> 버튼이 나타납니다. 숫자를 직접 타이핑하는 게 아니라 목록에서 고르는 방식입니다.
                  </p>
                </div>

                {/* Step 1 */}
                <StepBlock num="1" icon={<Key className="h-3.5 w-3.5" />} title="토큰 발급 및 복사">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    이 화면에서 <Chip>발급</Chip> 버튼을 눌러 토큰을 생성하고 즉시 복사하세요. 토큰은 1회만 표시됩니다.
                  </p>
                </StepBlock>

                {/* Step 2 */}
                <StepBlock num="2" icon={<Smartphone className="h-3.5 w-3.5" />} title="자동화 트리거 설정">
                  <PathRow steps={['단축어 앱', '자동화 탭', '+']} />
                  <PathRow steps={['운동', '달리기 체크', '종료됨 체크', '다음']} />
                  <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 p-2.5 mt-1">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      ⚠️ 마지막 화면에서 <strong className="text-foreground">즉시 실행</strong> 선택. "실행 전 확인"으로 두면 매번 허용 버튼을 눌러야 합니다.
                    </p>
                  </div>
                </StepBlock>

                {/* Step 3 */}
                <StepBlock num="3" icon={<Zap className="h-3.5 w-3.5" />} title="운동 데이터 가져오기">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                    동작 검색 → <Chip>운동 찾기</Chip> 추가
                  </p>
                  <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border text-xs overflow-hidden">
                    <ActionRow label="종류" value="달리기" />
                    <ActionRow label="정렬" value="시작일 · 최신 항목순" />
                    <ActionRow label="제한" value="켜고 1개" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    그 다음 <Chip>목록에서 항목 가져오기</Chip> 추가 → 첫 번째 항목
                  </p>
                </StepBlock>

                {/* Step 4 */}
                <StepBlock num="4" icon={<Zap className="h-3.5 w-3.5" />} title="날짜 포맷 지정">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                    동작 검색 → <Chip>날짜 포맷 지정</Chip> 추가
                  </p>
                  <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border text-xs overflow-hidden">
                    <ActionRow label="날짜" value="위 결과 → 시작일" highlight />
                    <ActionRow label="형식" value="사용자화" />
                    <div className="px-3 py-2">
                      <code className="text-[11px] font-mono text-orange-400 bg-muted rounded px-1.5 py-0.5">{"yyyy-MM-dd'T'HH:mm:ssZ"}</code>
                    </div>
                  </div>
                </StepBlock>

                {/* Step 5 */}
                <StepBlock num="5" icon={<Zap className="h-3.5 w-3.5" />} title="운동 시간(초) 계산">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                    동작 검색 → <Chip>날짜 간의 시간 측정</Chip> 추가
                  </p>
                  <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border text-xs overflow-hidden">
                    <ActionRow label="시작" value="운동 결과 → 시작일" highlight />
                    <ActionRow label="종료" value="운동 결과 → 종료일" highlight />
                    <ActionRow label="단위" value="초" />
                  </div>
                </StepBlock>

                {/* Step 6 */}
                <StepBlock num="6" icon={<Zap className="h-3.5 w-3.5" />} title="URL 콘텐츠 가져오기">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                    동작 검색 → <Chip>URL 콘텐츠 가져오기</Chip> 추가
                  </p>
                  <div className="rounded-lg bg-red-500/8 border border-red-500/20 p-2.5 mb-2">
                    <p className="text-[11px] text-muted-foreground">
                      ⚠️ <strong className="text-foreground">URL 구성요소 가져오기</strong>는 다른 액션입니다.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 text-xs overflow-hidden mb-2">
                    <div className="px-3 py-1.5 bg-muted/60 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">URL</div>
                    <div className="px-3 py-2 font-mono text-[11px] break-all text-foreground">
                      https://runstreak-nine.vercel.app/api/runs/sync
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border text-xs overflow-hidden mb-2">
                    <ActionRow label="방법" value="POST" />
                    <div className="px-3 py-2 space-y-1">
                      <p className="text-[11px] text-muted-foreground">헤더 추가:</p>
                      <div className="grid grid-cols-[50px_1fr] gap-1 text-[11px]">
                        <span className="text-muted-foreground">키</span>
                        <code className="font-mono">Authorization</code>
                        <span className="text-muted-foreground">값</span>
                        <span className="text-orange-400">Bearer 발급받은토큰</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">본문 → JSON · 항목 3개 추가</p>
                    <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border text-xs overflow-hidden">
                      <div className="grid grid-cols-[1fr_1fr] px-3 py-1.5 bg-muted/60">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">키</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">값 (변수 선택)</span>
                      </div>
                      <JsonRow k="date" v="STEP 4 결과" note="텍스트" />
                      <JsonRow k="distance_km" v="운동 → 운동 값(km)" note="숫자 · km 단위 확인" highlight />
                      <JsonRow k="duration_sec" v="STEP 5 결과" note="숫자" />
                    </div>
                  </div>
                </StepBlock>

                {/* 완료 */}
                <div className="flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    설정 완료! 달리기가 끝날 때마다 자동으로 전송됩니다.
                    중복 전송돼도 자동으로 걸러집니다.
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
