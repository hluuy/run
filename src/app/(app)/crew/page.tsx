'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GroupDetail } from '@/components/crew/group-detail'
import { CreateGroupDialog } from '@/components/crew/create-group-dialog'
import { Loader2 } from 'lucide-react'
import type { Group } from '@/types'

export default function CrewPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchGroups = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('groups')
      .select('*, group_members!inner(user_id)')
      .eq('group_members.user_id', user.id)
      .order('created_at', { ascending: false })
    setGroups((data as Group[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">크루</h1>
        <CreateGroupDialog onCreated={fetchGroups} />
      </div>

      <div className="mx-4 space-y-6 pb-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
            <p className="text-2xl">🏃</p>
            <p className="text-sm font-medium">참여 중인 그룹이 없습니다</p>
            <p className="text-xs text-muted-foreground">그룹을 만들거나 초대 링크로 참여해보세요.</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.id} className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
              <GroupDetail group={g} onUpdated={fetchGroups} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
