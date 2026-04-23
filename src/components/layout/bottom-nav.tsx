'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: Activity, label: '내 스트릭' },
  { href: '/crew', icon: Users, label: '크루' },
  { href: '/settings', icon: Settings, label: '설정' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-t border-border/50" />
      <div className="relative mx-auto flex h-16 max-w-md items-center px-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs rounded-2xl transition-all duration-300',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5 transition-transform duration-300', isActive && 'scale-110')} />
                {isActive && (
                  <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg animate-pulse" />
                )}
              </div>
              <span className={cn('transition-all duration-300', isActive && 'text-primary font-medium')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
