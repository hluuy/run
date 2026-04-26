'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

function swReady(timeoutMs = 5000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('sw-timeout')), timeoutMs)
    ),
  ])
}

export function NotificationSection() {
  // null = not yet determined (show nothing), false/true = known support state
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
      .catch(() => {
        // SW not ready or timed out — treat as disabled
        setEnabled(false)
      })
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

        const reg = await swReady(5000)
        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          if (!key) throw new Error('VAPID key missing')
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
          })
        }

        const json = sub.toJSON() as {
          endpoint: string
          keys?: { p256dh: string; auth: string }
        }
        if (!json.keys?.p256dh || !json.keys?.auth) {
          throw new Error('subscription keys missing')
        }

        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          }),
        })
        if (!res.ok) throw new Error('subscribe API failed')

        setEnabled(true)
        toast.success('알림이 켜졌습니다.')
      } else {
        // Server side handles unsubscribing from pushManager — don't call sub.unsubscribe() here
        const res = await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (!res.ok) throw new Error('unsubscribe API failed')

        setEnabled(false)
        toast.success('알림이 꺼졌습니다.')
      }
    } catch {
      toast.error('알림 설정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Don't render until we know whether push is supported
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
