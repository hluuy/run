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
})
type FormValues = z.infer<typeof schema>

export function CreateGroupDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    const res = await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    setLoading(false)
    if (!res.ok) { toast.error('그룹 생성 실패'); return }
    toast.success('그룹이 생성됐습니다!')
    reset()
    setOpen(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white" />}>
        <Plus className="h-4 w-4" /> 그룹 만들기
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>새 그룹 만들기</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>그룹 이름</Label>
            <Input placeholder="예: 새벽 러너즈" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}만들기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
