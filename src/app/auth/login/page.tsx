'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState<'google' | 'magic' | 'verify' | null>(null)
  const [sent, setSent] = useState(false)
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

  async function sendOtp() {
    if (!email || loading) return
    setLoading('magic')
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(null)
    if (res.status === 429) {
      toast.error('잠시 후 다시 시도해주세요.')
    } else if (!res.ok) {
      toast.error('이메일 전송 실패')
    } else {
      setSent(true)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otp) return
    setLoading('verify')
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) {
      setLoading(null)
      toast.error('코드가 올바르지 않습니다.')
      return
    }
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user!.id)
      .maybeSingle()
    router.push(profile ? '/' : '/onboarding')
  }

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

        {sent ? (
          /* OTP 입력 화면 */
          <div className="space-y-5">
            <button
              onClick={() => { setSent(false); setOtp('') }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> 이메일 다시 입력
            </button>

            <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-1.5">
              <p className="text-sm font-medium text-foreground">이메일을 확인하세요</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-orange-400 font-medium">{email}</span>로<br />6자리 인증 코드를 전송했습니다.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="인증 코드 6자리"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="h-14 text-center text-2xl font-bold tracking-[0.5em] border-border bg-card placeholder:text-muted-foreground/40 placeholder:text-base placeholder:tracking-normal focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50"
              />
              <Button
                type="submit"
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                disabled={loading !== null || otp.length < 6}
              >
                {loading === 'verify' ? <Loader2 className="h-4 w-4 animate-spin" /> : '로그인'}
              </Button>
            </form>
          </div>
        ) : (
          /* 이메일 입력 화면 */
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
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                className="h-12 border-border bg-card focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50"
              />
              <Button
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                onClick={sendOtp}
                disabled={loading !== null || !email}
              >
                {loading === 'magic' ? <Loader2 className="h-4 w-4 animate-spin" /> : '이메일로 코드 받기'}
              </Button>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          소규모 러닝 크루를 위한 프라이빗 트래커
        </p>
      </div>
    </div>
  )
}
