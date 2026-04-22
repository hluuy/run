import { BottomNav } from '@/components/layout/bottom-nav'
import { OfflineBanner } from '@/components/layout/offline-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <OfflineBanner />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  )
}
