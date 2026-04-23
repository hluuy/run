'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, '그룹 이름을 입력해주세요.').max(30),
  goal_type: z.enum(['daily', 'weekly', 'monthly']),
})
type FormValues = z.infer<typeof schema>

const GOAL_OPTIONS = [
  { value: 'daily', label: '일간' },
  { value: 'weekly', label: '주간' },
  { value: 'monthly', label: '월간' },
] as const

export function CreateGroupDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { goal_type: 'weekly' },
  })
  const selectedType = watch('goal_type')

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setLoading(false)
    if (!res.ok) { toast.error('그룹 생성 실패'); return }
    toast.success('그룹이 생성됐습니다!')
    reset()
    setOpen(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 transition-all duration-300" />}>
        <Plus className="h-4 w-4" /> 그룹 만들기
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>새 그룹 만들기</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          <div className="space-y-1.5">
            <Label>그룹 이름</Label>
            <Input placeholder="예: 새벽 러너즈" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>목표 주기</Label>
            <p className="text-xs text-muted-foreground">그룹원들이 각자의 목표를 이 주기 단위로 채워요.</p>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('goal_type', opt.value)}
                  className={`rounded-xl border p-3 text-center transition-colors ${
                    selectedType === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <p className="font-semibold text-sm text-center">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}만들기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
