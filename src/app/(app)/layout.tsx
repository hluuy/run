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
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 max-w-md mx-auto overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-24 left-0 w-80 h-80 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl" />
      </div>
      <AuthGuard />
      <OfflineBanner />
      <main className="relative z-10 flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  )
}
