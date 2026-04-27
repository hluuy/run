export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export async function swReady(timeoutMs = 60000): Promise<ServiceWorkerRegistration> {
  let regs = await navigator.serviceWorker.getRegistrations()
  const already = regs.find(r => r.active)
  if (already) return already

  if (regs.length === 0) {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      regs = await navigator.serviceWorker.getRegistrations()
    } catch {
      throw new Error('sw-register-failed')
    }
  }

  const reg = regs[0]
  if (!reg) throw new Error('sw-no-reg')
  if (reg.active) return reg

  const sw = reg.installing ?? reg.waiting
  if (!sw) throw new Error('sw-redundant')

  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`sw-timeout:${sw.state}`)),
      timeoutMs
    )
    sw.addEventListener('statechange', () => {
      if (sw.state === 'activated') {
        clearTimeout(timer)
        resolve(reg)
      } else if (sw.state === 'redundant') {
        clearTimeout(timer)
        reject(new Error('sw-redundant'))
      }
    })
  })
}

export async function subscribePush(reg: ServiceWorkerRegistration): Promise<PushSubscription> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!key) throw new Error('vapid-key-missing')

  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })
}

export async function savePushSubscription(sub: PushSubscription): Promise<boolean> {
  const json = sub.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } }
  if (!json.keys?.p256dh || !json.keys?.auth) return false

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    }),
  })
  return res.ok
}
