'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<'google' | 'email' | null>(null)
  const supabase = createClient()

  async function handleGoogle() {
    setLoading('google')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      toast.error('Google 로그인 실패: ' + error.message)
      setLoading(null)
    }
  }

  async function handleEmailLogin() {
    if (!email || loading) return
    setLoading('email')

    const res = await fetch('/api/auth/directlogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error('로그인 실패: ' + (data.error ?? ''))
      setLoading(null)
      return
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: 'magiclink',
    })

    if (error) {
      toast.error('로그인 실패: ' + error.message)
      setLoading(null)
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', (await supabase.auth.getUser()).data.user!.id)
      .maybeSingle()

    router.push(profile ? '/' : '/onboarding')
  }

  /* ── OTP 이메일 인증 흐름 (비활성화) ────────────────────────────────
  async function sendOtp() { ... POST /api/auth/otp ... setSent(true) }
  async function handleVerifyOtp() { ... supabase.auth.verifyOtp({ email, token, type: 'email' }) ... }
  {sent ? <OTP입력화면 /> : <이메일입력화면 />}
  ─────────────────────────────────────────────────────────────────── */

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-orange-500/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* 로고 영역 */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-3xl ring-1 ring-orange-500/20">
            🏃
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">런 트래커</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">친구들과 함께하는 러닝 스트릭</p>
        </div>

        <div className="space-y-4">
          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-12 gap-2.5 border-border bg-card hover:bg-muted font-medium"
            onClick={handleGoogle}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Google로 계속하기
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">또는 이메일로</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <Input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
              className="h-12 border-border bg-card focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50"
            />
            <Button
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              onClick={handleEmailLogin}
              disabled={loading !== null || !email}
            >
              {loading === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : '로그인'}
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          소규모 러닝 크루를 위한 프라이빗 트래커
        </p>
      </div>
    </div>
  )
}
