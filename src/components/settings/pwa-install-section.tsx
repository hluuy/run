'use client'

import { useState, useEffect } from 'react'
import { Share } from 'lucide-react'

export function PwaInstallSection() {
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)
  }, [])

  if (isStandalone !== false) return null

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <p className="font-medium text-sm">앱으로 설치하기</p>
      <p className="text-xs text-muted-foreground">
        홈 화면에 추가하면 더 빠르고, 알림도 받을 수 있어요.
      </p>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
        <span>Safari</span>
        <span>→</span>
        <Share className="h-3.5 w-3.5 shrink-0" />
        <span>→</span>
        <span>홈 화면에 추가</span>
      </div>
    </div>
  )
}
