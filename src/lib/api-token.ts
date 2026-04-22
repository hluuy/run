import { createAdminClient } from '@/lib/supabase/admin'

// 원문 토큰 → SHA-256 hex
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// crypto.randomUUID 기반 원문 토큰 생성
export function generateRawToken(): string {
  return `rnt_${crypto.randomUUID().replace(/-/g, '')}`
}

// Bearer 토큰으로 user_id 조회 (API Route에서 사용)
export async function verifyApiToken(rawToken: string): Promise<string | null> {
  const hash = await hashToken(rawToken)
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('api_tokens')
    .select('user_id, id')
    .eq('token_hash', hash)
    .maybeSingle()

  if (error || !data) return null

  // last_used_at 업데이트 (에러 무시)
  await supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return data.user_id
}
