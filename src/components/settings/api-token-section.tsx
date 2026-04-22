'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Copy, Plus, Trash2, Loader2 } from 'lucide-react'

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
        <div>
          <p className="font-medium text-sm">Shortcuts API 토큰</p>
          <p className="text-xs text-muted-foreground mt-0.5">iOS 단축어 자동화에 사용</p>
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
