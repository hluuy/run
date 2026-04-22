import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(30),
  goal_type: z.enum(['daily', 'weekly', 'monthly']),
  goal_distance_km: z.number().positive().max(10000),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = schema.safeParse(await request.json())
  if (!body.success) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ ...body.data, created_by: user.id })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'internal' }, { status: 500 })

  // 생성자를 멤버로 자동 추가
  await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id })

  return NextResponse.json({ group_id: group.id }, { status: 201 })
}
