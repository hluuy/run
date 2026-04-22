export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string
          created_at: string
        }
        Insert: {
          id: string
          nickname: string
          created_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          created_at?: string
        }
        Relationships: []
      }
      runs: {
        Row: {
          id: string
          user_id: string
          workout_source_id: string | null
          date: string
          local_date_key: string
          distance_km: number
          duration_sec: number
          avg_pace_sec_per_km: number
          avg_heart_rate_bpm: number | null
          gpx_storage_path: string | null
          source: 'manual' | 'shortcut' | 'gpx'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_source_id?: string | null
          date: string
          local_date_key: string
          distance_km: number
          duration_sec: number
          avg_pace_sec_per_km: number
          avg_heart_rate_bpm?: number | null
          gpx_storage_path?: string | null
          source?: 'manual' | 'shortcut' | 'gpx'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_source_id?: string | null
          date?: string
          local_date_key?: string
          distance_km?: number
          duration_sec?: number
          avg_pace_sec_per_km?: number
          avg_heart_rate_bpm?: number | null
          gpx_storage_path?: string | null
          source?: 'manual' | 'shortcut' | 'gpx'
          created_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          goal_type: 'daily' | 'weekly' | 'monthly' | null
          goal_distance_km: number | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          goal_type?: 'daily' | 'weekly' | 'monthly' | null
          goal_distance_km?: number | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          goal_type?: 'daily' | 'weekly' | 'monthly' | null
          goal_distance_km?: number | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          joined_at: string
          goal_distance_km: number | null
        }
        Insert: {
          group_id: string
          user_id: string
          joined_at?: string
          goal_distance_km?: number | null
        }
        Update: {
          group_id?: string
          user_id?: string
          joined_at?: string
          goal_distance_km?: number | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          id: string
          token: string
          group_id: string
          created_by: string
          expires_at: string
          max_uses: number
          use_count: number
          revoked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          token?: string
          group_id: string
          created_by: string
          expires_at: string
          max_uses?: number
          use_count?: number
          revoked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          group_id?: string
          created_by?: string
          expires_at?: string
          max_uses?: number
          use_count?: number
          revoked?: boolean
          created_at?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          id: string
          user_id: string
          token_hash: string
          created_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token_hash: string
          created_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          token_hash?: string
          created_at?: string
          last_used_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      get_user_rolling_avg: {
        Args: { p_user_id: string }
        Returns: { avg_distance_km: number; avg_pace_sec_per_km: number }[]
      }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      get_group_leaderboard: {
        Args: { p_group_id: string; p_start: string; p_end: string }
        Returns: { user_id: string; nickname: string; total_km: number; goal_distance_km: number | null }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
