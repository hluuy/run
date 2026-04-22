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


interface TokenInfo {
  id: string
  created_at: string
  last_used_at: string | null
}

const STORAGE_KEY = 'rnt_saved_token'

export function ApiTokenSection() {
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [savedToken, setSavedToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    setSavedToken(localStorage.getItem(STORAGE_KEY))
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

    localStorage.setItem(STORAGE_KEY, data.token)
    setSavedToken(data.token)
    setTokens((prev) => [{ id: data.id, created_at: data.created_at, last_used_at: null }, ...prev])
    toast.success('토큰이 생성됐습니다!')
  }

  async function deleteToken(id: string) {
    const res = await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTokens((prev) => prev.filter((t) => t.id !== id))
      if (tokens.length <= 1) {
        localStorage.removeItem(STORAGE_KEY)
        setSavedToken(null)
      }
      toast.success('토큰이 삭제됐습니다.')
    } else {
      toast.error('삭제 실패')
    }
  }

  function copyToken() {
    if (!savedToken) return
    navigator.clipboard.writeText(savedToken)
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

                {/* Nike Run Club 필수 안내 */}
                <div className="rounded-lg bg-blue-500/8 border border-blue-500/20 p-3 space-y-2">
                  <p className="text-xs font-medium text-blue-400">Nike Run Club 필수</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    이 단축어는 Nike Run Club 데이터를 사용합니다. 아이폰 건강 앱과 연결되어 있어야 합니다.
                  </p>
                  <PathRow steps={['설정', '건강', '데이터 접근 및 기기', 'Nike Run Club', '모두 활성화']} />
                </div>

                {/* Step 1 */}
                <StepBlock num="1" icon={<Smartphone className="h-3.5 w-3.5" />} title="단축어 다운로드">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    아래 링크에서 단축어를 다운받아 추가하세요.
                  </p>
                  <a
                    href="https://www.icloud.com/shortcuts/d21752a4df084e9682faf20cfd92e24c"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-orange-400 underline underline-offset-2"
                  >
                    단축어 다운로드 →
                  </a>
                </StepBlock>

                {/* Step 2 */}
                <StepBlock num="2" icon={<Key className="h-3.5 w-3.5" />} title="토큰 발급 및 복사">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    이 화면에서 <Chip>발급</Chip> 버튼을 눌러 토큰을 생성하세요. 토큰은 이 기기에 저장되어 언제든 복사할 수 있습니다.
                  </p>
                </StepBlock>

                {/* Step 3 */}
                <StepBlock num="3" icon={<Zap className="h-3.5 w-3.5" />} title="단축어에 토큰 입력">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                    다운받은 단축어를 열어 헤더 항목을 수정하세요.
                  </p>
                  <div className="rounded-lg border border-border bg-muted/40 text-xs overflow-hidden">
                    <div className="grid grid-cols-[50px_1fr] gap-1 px-3 py-2 text-[11px]">
                      <span className="text-muted-foreground">키</span>
                      <code className="font-mono">Authorization</code>
                      <span className="text-muted-foreground">값</span>
                      <span>Bearer <span className="text-orange-400">(여기에 토큰입력하기)</span></span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    <span className="text-orange-400">(여기에 토큰입력하기)</span> 부분을 괄호까지 지우고 복사한 토큰을 붙여넣으세요.
                  </p>
                </StepBlock>

                {/* Step 4 */}
                <StepBlock num="4" icon={<Zap className="h-3.5 w-3.5" />} title="자동화 트리거 설정">
                  <PathRow steps={['단축어 앱', '자동화 탭', '+']} />
                  <p className="text-xs text-muted-foreground mt-1.5 mb-1.5">
                    <strong className="text-foreground">특정 시간</strong>을 선택한 뒤 시각을 지정하세요.
                  </p>
                  <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 p-2.5">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      💡 추천 시각: <strong className="text-foreground">23:30</strong> — 러닝을 거의 하지 않을 시각으로 설정하면 당일 기록이 확실히 반영됩니다.
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 p-2.5 mt-2">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      ⚠️ 마지막 화면에서 <strong className="text-foreground">즉시 실행</strong> 선택. "실행 전 확인"으로 두면 매번 허용 버튼을 눌러야 합니다.
                    </p>
                  </div>
                </StepBlock>

                {/* 완료 */}
                <div className="flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    설정 완료! 매일 지정한 시각에 자동으로 당일 러닝 기록이 전송됩니다.
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

      {/* 저장된 토큰 — 언제든 복사 가능 */}
      {savedToken && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-orange-500 text-white text-[10px]">API 토큰</Badge>
            <p className="text-xs text-muted-foreground">Shortcuts 연동에 사용하는 토큰입니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs font-mono break-all">
              {savedToken}
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
