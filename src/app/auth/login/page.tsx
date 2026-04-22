'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading('magic')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(null)
    if (error) {
      toast.error('이메일 전송 실패: ' + error.message)
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <div className="text-4xl">🏃</div>
          <h1 className="text-2xl font-bold tracking-tight">런 트래커</h1>
          <p className="text-sm text-muted-foreground">친구들과 함께하는 러닝 스트릭</p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
              <p className="font-medium">이메일을 확인하세요</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{email}</span>으로 6자리 코드를 전송했습니다.
              </p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="otp">인증 코드</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading !== null || otp.length < 6}>
                {loading === 'verify' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                확인
              </Button>
            </form>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => { setSent(false); setOtp('') }}>
              다른 이메일로 시도
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogle}
              disabled={loading !== null}
            >
              {loading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Google로 계속하기
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">또는</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading !== null}>
                {loading === 'magic' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                이메일로 코드 받기
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
