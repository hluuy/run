'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { swReady, subscribePush, savePushSubscription } from '@/lib/push-client'

export function NotificationSection() {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setSupported(false)
      setLoading(false)
      return
    }

    setSupported(true)

    swReady(5000)
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setEnabled(!!sub && Notification.permission === 'granted')
      })
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(on: boolean) {
    setLoading(true)
    try {
      if (on) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          toast.error('브라우저에서 알림을 허용해주세요.')
          return
        }

        let reg: ServiceWorkerRegistration
        try {
          reg = await swReady()
        } catch (e) {
          const state = e instanceof Error ? e.message : String(e)
          toast.error(`서비스 워커 준비 실패 (${state}). 앱을 다시 열어주세요.`)
          return
        }

        let sub: PushSubscription
        try {
          sub = await subscribePush(reg)
        } catch (e) {
          toast.error(`구독 실패: ${e instanceof Error ? e.message : String(e)}`)
          return
        }

        const ok = await savePushSubscription(sub)
        if (!ok) {
          toast.error('서버 저장 실패. 다시 시도해주세요.')
          return
        }

        setEnabled(true)
        toast.success('알림이 켜졌습니다.')
      } else {
        const res = await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (!res.ok) throw new Error('unsubscribe API failed')

        setEnabled(false)
        toast.success('알림이 꺼졌습니다.')
      }
    } catch (e) {
      toast.error(`알림 설정 실패: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  if (supported !== true) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="font-medium text-sm">알림</p>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="notif-toggle" className="text-sm">크루 알림 받기</Label>
          <p className="text-xs text-muted-foreground">멤버 러닝 기록 및 목표 달성 시 알림</p>
        </div>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            id="notif-toggle"
            checked={enabled}
            onCheckedChange={toggle}
          />
        )}
      </div>
    </div>
  )
}
