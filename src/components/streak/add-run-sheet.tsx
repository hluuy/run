'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="sm" className="gap-1.5 bg-orange-500 hover:bg-orange-600 text-white" />
        }
      >
        <Plus className="h-4 w-4" />
        러닝 기록
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle>러닝 기록하기</SheetTitle>
        </SheetHeader>
        <RunForm onSuccess={handleSuccess} />
      </SheetContent>
    </Sheet>
  )
}
