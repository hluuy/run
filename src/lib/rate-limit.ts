// 메모리 기반 rate limiter (단일 서버리스 인스턴스용, 소규모 앱)
// Vercel Serverless는 인스턴스가 분리될 수 있어 완벽하지 않지만
// 신뢰 그룹 앱에서는 충분한 수준의 방어

const store = new Map<string, { count: number; resetAt: number }>()

interface RateLimitResult {
  allowed: boolean
  remaining: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}
