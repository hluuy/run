import { MemberStreakView } from '@/components/crew/member-streak-view'

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ nickname?: string }>
}) {
  const { userId } = await params
  const { nickname } = await searchParams
  return <MemberStreakView userId={userId} nickname={nickname ?? '크루원'} />
}
