'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { GroupDetail } from '@/components/crew/group-detail'
import { CreateGroupDialog } from '@/components/crew/create-group-dialog'
import { Loader2, Users } from 'lucide-react'
import type { Group } from '@/types'

export default function CrewPage() {
  const supabase = createClient()

  const { data: user } = useSWR(
    'auth-user',
    async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user ?? null
    }
  )

  const { data: groups = [], isLoading, mutate } = useSWR(
    user ? ['groups', user.id] : null,
    async () => {
      const { data } = await supabase
        .from('groups')
        .select('*, group_members!inner(user_id)')
        .eq('group_members.user_id', user!.id)
        .order('created_at', { ascending: false })
      return (data as Group[]) ?? []
    }
  )

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">크루</h1>
          <Users className="h-5 w-5 text-primary" />
        </div>
        <CreateGroupDialog onCreated={() => mutate()} />
      </div>

      <div className="mx-4 space-y-4 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center space-y-2">
            <p className="text-2xl">🏃</p>
            <p className="text-sm font-medium">참여 중인 그룹이 없습니다</p>
            <p className="text-xs text-muted-foreground">그룹을 만들거나 초대 링크로 참여해보세요.</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.id} className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-5 shadow-xl space-y-3">
              <GroupDetail group={g} onUpdated={() => mutate()} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
