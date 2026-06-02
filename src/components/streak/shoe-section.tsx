'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Settings2 } from 'lucide-react'
import { ShoeManagerSheet } from './shoe-manager-sheet'
import type { ShoeWithMileage } from '@/types'

function ShoeRow({ shoe }: { shoe: ShoeWithMileage }) {
  const pct = Math.min(100, (shoe.current_km / shoe.target_km) * 100)
  const barColor =
    pct >= 100 ? 'bg-red-500' :
    pct >= 80  ? 'bg-amber-500' :
    'bg-gradient-to-r from-primary to-accent'

  return (
    <div className="px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {shoe.is_default && <Star className="h-3 w-3 fill-primary text-primary shrink-0" />}
          <span className="text-sm font-medium truncate">{shoe.name}</span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">
          {shoe.current_km.toFixed(0)} / {shoe.target_km} km
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
          {pct >= 100 ? '초과' : `${Math.round(pct)}%`}
        </span>
      </div>
    </div>
  )
}

export function ShoeSection() {
  const [shoes, setShoes] = useState<ShoeWithMileage[]>([])
  const [loading, setLoading] = useState(true)
  const [managerOpen, setManagerOpen] = useState(false)

  const fetchShoes = useCallback(async () => {
    const res = await fetch('/api/shoes')
    if (res.ok) setShoes(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchShoes() }, [fetchShoes])

  const activeShoes = shoes.filter(s => !s.is_retired)

  if (loading) return null

  return (
    <div className="mx-3 mt-3 mb-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-xs font-medium text-muted-foreground">러닝화 마일리지</p>
        <button
          onClick={() => setManagerOpen(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="h-3 w-3" /> 관리
        </button>
      </div>

      {activeShoes.length > 0 ? (
        <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl divide-y divide-border/50">
          {activeShoes.map(shoe => <ShoeRow key={shoe.id} shoe={shoe} />)}
        </div>
      ) : (
        <button
          onClick={() => setManagerOpen(true)}
          className="w-full rounded-2xl border border-dashed border-border/60 py-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
        >
          러닝화를 추가해 마일리지를 관리해보세요
        </button>
      )}

      <ShoeManagerSheet
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onChanged={fetchShoes}
      />
    </div>
  )
}
