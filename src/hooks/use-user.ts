'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types'

interface UseUserResult {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

export function useUser(): UseUserResult {
  const supabase = createClient()

  const { data: user, isLoading: userLoading } = useSWR(
    'auth-user',
    async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user ?? null
    }
  )

  const { data: profile, isLoading: profileLoading } = useSWR(
    user ? ['user-profile', user.id] : null,
    async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()
      return data as UserProfile | null
    }
  )

  return {
    user: user ?? null,
    profile: profile ?? null,
    loading: userLoading || (!!user && profileLoading),
  }
}
