'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Star, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ShoeWithMileage } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onChanged: () => void
}

export function ShoeManagerSheet({ open, onClose, onChanged }: Props) {
  const [shoes, setShoes] = useState<ShoeWithMileage[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addTarget, setAddTarget] = useState('500')
  const [addInitial, setAddInitial] = useState('0')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [saving, setSaving] = useState(false)
  const [showRetired, setShowRetired] = useState(false)
  const [totalRunKm, setTotalRunKm] = useState<number | null>(null)
  const [includeHistory, setIncludeHistory] = useState(false)
  const supabase = createClient()

  async function fetchShoes() {
    const res = await fetch('/api/shoes')
    if (res.ok) setShoes(await res.json())
  }

  useEffect(() => {
    if (open) fetchShoes()
  }, [open])

  async function openAddForm() {
    setAddOpen(true)
    // 신발이 하나도 없는 경우에만 기존 기록 합산 옵션 제공
    if (shoes.length === 0) {
      const { data } = await supabase.from('runs').select('distance_km')
      const total = Math.round((data?.reduce((sum, r) => sum + r.distance_km, 0) ?? 0) * 10) / 10
      setTotalRunKm(total > 0 ? total : null)
    }
  }

  async function addShoe() {
    if (!addName.trim()) return
    setSaving(true)
    const res = await fetch('/api/shoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: addName.trim(),
        target_km: parseFloat(addTarget) || 500,
        initial_km: parseFloat(addInitial) || 0,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('추가 실패'); return }
    setAddOpen(false)
    setAddName(''); setAddTarget('500'); setAddInitial('0')
    setTotalRunKm(null); setIncludeHistory(false)
    await fetchShoes()
    onChanged()
    toast.success('러닝화가 추가됐습니다.')
  }

  async function setDefault(id: string) {
    await fetch(`/api/shoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })
    await fetchShoes()
    onChanged()
  }

  async function clearDefault(id: string) {
    await fetch(`/api/shoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: false }),
    })
    await fetchShoes()
    onChanged()
  }

  function startEdit(shoe: ShoeWithMileage) {
    setEditingId(shoe.id)
    setEditName(shoe.name)
    setEditTarget(String(shoe.target_km))
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return
    setSaving(true)
    const res = await fetch(`/api/shoes/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), target_km: parseFloat(editTarget) || 500 }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('수정 실패'); return }
    setEditingId(null)
    await fetchShoes()
    onChanged()
  }

  async function retire(id: string) {
    await fetch(`/api/shoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_retired: true }),
    })
    await fetchShoes()
    onChanged()
    toast.success('은퇴 처리됐습니다.')
  }

  async function restore(id: string) {
    await fetch(`/api/shoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_retired: false }),
    })
    await fetchShoes()
    onChanged()
  }

  const activeShoes = shoes.filter(s => !s.is_retired)
  const retiredShoes = shoes.filter(s => s.is_retired)

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-sm w-full rounded-2xl max-h-[85vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">러닝화 관리</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {/* Active shoes */}
          {activeShoes.length > 0 && (
            <div className="space-y-2">
              {activeShoes.map(shoe => (
                <div key={shoe.id} className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
                  {editingId === shoe.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        placeholder="신발 이름"
                        className="h-9 text-sm"
                      />
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={editTarget}
                          onChange={e => setEditTarget(e.target.value)}
                          placeholder="목표 km"
                          className="h-9 text-sm flex-1"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">km 목표</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={saveEdit}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : '저장'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => shoe.is_default ? clearDefault(shoe.id) : setDefault(shoe.id)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title={shoe.is_default ? '대표 해제' : '대표로 설정'}
                          >
                            <Star className={`h-3.5 w-3.5 ${shoe.is_default ? 'fill-primary text-primary' : ''}`} />
                          </button>
                          <span className="text-sm font-medium">{shoe.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {shoe.current_km.toFixed(0)} / {shoe.target_km} km
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(shoe)}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => retire(shoe.id)}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          은퇴
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {addOpen ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
              <Label className="text-xs font-medium">새 러닝화</Label>
              <Input
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="신발 이름 (예: Nike Pegasus 40)"
                className="h-9 text-sm"
                onKeyDown={e => e.key === 'Enter' && addShoe()}
              />
              {totalRunKm !== null && (
                <label className="flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/20 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHistory}
                    onChange={e => {
                      setIncludeHistory(e.target.checked)
                      setAddInitial(e.target.checked ? String(totalRunKm) : '0')
                    }}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-xs font-medium">이전 기록 포함하기</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      지금까지 뛴 <span className="font-medium text-foreground">{totalRunKm.toFixed(1)} km</span>를 초기 마일리지로 합산합니다.
                    </p>
                  </div>
                </label>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">목표 km</Label>
                  <Input
                    type="number"
                    value={addTarget}
                    onChange={e => setAddTarget(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">초기 km <span className="text-muted-foreground/60">(이미 신은 경우)</span></Label>
                  <Input
                    type="number"
                    value={addInitial}
                    onChange={e => { setAddInitial(e.target.value); setIncludeHistory(false) }}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  className="flex-1 h-8 text-xs"
                  onClick={() => { setAddOpen(false); setAddName(''); setAddTarget('500'); setAddInitial('0'); setTotalRunKm(null); setIncludeHistory(false) }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-gradient-to-r from-primary to-accent"
                  onClick={addShoe}
                  disabled={saving || !addName.trim()}
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : '추가'}
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={openAddForm}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" /> 신발 추가
            </button>
          )}

          {/* Retired shoes */}
          {retiredShoes.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowRetired(v => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showRetired ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                은퇴한 신발 {retiredShoes.length}켤레
              </button>
              {showRetired && (
                <div className="space-y-1.5">
                  {retiredShoes.map(shoe => (
                    <div key={shoe.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                      <div>
                        <p className="text-sm text-muted-foreground line-through">{shoe.name}</p>
                        <p className="text-xs text-muted-foreground/60">{shoe.current_km.toFixed(0)} km 사용</p>
                      </div>
                      <button
                        onClick={() => restore(shoe.id)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        복귀
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
