import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 동일 토큰 기준 1분 10회
export const syncRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:sync',
})

// 동일 IP 기준 10분 5회
export const inviteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'rl:invite',
})

export function formatRetryAfter(resetAtMs: number): string {
  const totalSec = Math.ceil((resetAtMs - Date.now()) / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min > 0) return `${min}분 ${sec}초 후에 다시 시도해주세요`
  return `${sec}초 후에 다시 시도해주세요`
}
