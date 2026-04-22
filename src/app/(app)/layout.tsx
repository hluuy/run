import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OfflineBanner } from '@/components/layout/offline-banner'
import { AuthGuard } from '@/components/layout/auth-guard'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <AuthGuard />
      <OfflineBanner />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  )
}
