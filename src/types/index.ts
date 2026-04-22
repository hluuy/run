import type { Database } from './database'

export type UserProfile = Database['public']['Tables']['users']['Row']
export type Run = Database['public']['Tables']['runs']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']
export type ApiToken = Database['public']['Tables']['api_tokens']['Row']

export interface DayData {
  localDateKey: string
  runs: Run[]
  totalDistanceKm: number
  avgPaceSecPerKm: number
  intensityScore: number // 0.0–1.0, 클라이언트 계산
}

export interface LeaderboardEntry {
  user_id: string
  nickname: string
  total_km: number
}

export interface RollingAvg {
  avg_distance_km: number
  avg_pace_sec_per_km: number
}
