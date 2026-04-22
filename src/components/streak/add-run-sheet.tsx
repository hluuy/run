'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RunForm } from './run-form'
import { Plus } from 'lucide-react'

interface AddRunSheetProps {
  onSuccess?: () => void
}

export function AddRunSheet({ onSuccess }: AddRunSheetProps) {
  const [open, setOpen] = useState(false)

  function handleSuccess() {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white" />}>
        <Plus className="h-4 w-4" />
        러닝 기록
      </DialogTrigger>
      <DialogContent className="max-w-sm w-full rounded-2xl max-h-[90vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">러닝 기록하기</DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4">
          <RunForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
