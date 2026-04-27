'use client'

import { useEffect } from 'react'
import { swReady, subscribePush, savePushSubscription } from '@/lib/push-client'

const AUTO_KEY = 'rnt_notif_auto'

export function SWRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
    autoEnableNotifications()
  }, [])
  return null
}

async function autoEnableNotifications() {
  if (!('PushManager' in window) || !('Notification' in window)) return
  if (Notification.permission === 'denied') return
  if (localStorage.getItem(AUTO_KEY)) return

  try {
    const permission = await Notification.requestPermission()
    // 'default'는 iOS가 다이얼로그를 억제한 경우 — 키를 저장하지 않아 다음 실행에 재시도
    if (permission === 'denied') {
      localStorage.setItem(AUTO_KEY, '1')
      return
    }
    if (permission !== 'granted') return

    localStorage.setItem(AUTO_KEY, '1')
    const reg = await swReady(60000)
    const sub = await subscribePush(reg)
    await savePushSubscription(sub)
  } catch {}
}
