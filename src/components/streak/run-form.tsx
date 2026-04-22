'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { runSchema, type RunFormValues } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Paperclip, X } from 'lucide-react'
import { useState, useRef } from 'react'
import { parseGpxFile, validateGpxFile } from '@/lib/gpx'
import type { Run } from '@/types'

interface RunFormProps {
  onSuccess?: () => void
  editRun?: Run
}

function todayKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function RunForm({ onSuccess, editRun }: RunFormProps) {
  const [loading, setLoading] = useState(false)
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [gpxAutoFilled, setGpxAutoFilled] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const isEdit = !!editRun

  const defaultValues: Partial<RunFormValues> = isEdit
    ? {
        date: editRun.local_date_key,
        distance_km: editRun.distance_km,
        hours: Math.floor(editRun.duration_sec / 3600),
        minutes: Math.floor((editRun.duration_sec % 3600) / 60),
        seconds: editRun.duration_sec % 60,
        avg_heart_rate_bpm: editRun.avg_heart_rate_bpm ?? null,
      }
    : { date: todayKST(), hours: 0, minutes: 0, seconds: 0, avg_heart_rate_bpm: null }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RunFormValues>({
    resolver: zodResolver(runSchema),
    defaultValues,
  })

  async function handleGpxSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateGpxFile(file)
    if (err) { toast.error(err); return }
    setGpxFile(file)
    try {
      const xml = await file.text()
      const parsed = parseGpxFile(xml)
      setValue('distance_km', Math.round(parsed.distanceKm * 100) / 100)
      if (parsed.durationSec) {
        setValue('hours', Math.floor(parsed.durationSec / 3600))
        setValue('minutes', Math.floor((parsed.durationSec % 3600) / 60))
        setValue('seconds', parsed.durationSec % 60)
      }
      if (parsed.avgHeartRate) setValue('avg_heart_rate_bpm', parsed.avgHeartRate)
      setGpxAutoFilled(true)
      toast.success('GPX에서 데이터를 자동 입력했습니다.')
    } catch {
      toast.error('GPX 파싱 실패. 수동으로 입력해주세요.')
    }
  }

  function removeGpx() {
    setGpxFile(null)
    setGpxAutoFilled(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onSubmit(values: RunFormValues) {
    setLoading(true)
    const duration_sec = values.hours * 3600 + values.minutes * 60 + values.seconds
    const avg_pace_sec_per_km = duration_sec / values.distance_km

    if (isEdit) {
      const res = await fetch(`/api/runs/${editRun.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: values.date,
          distance_km: values.distance_km,
          duration_sec,
          avg_pace_sec_per_km,
          avg_heart_rate_bpm: values.avg_heart_rate_bpm ?? null,
        }),
      })
      setLoading(false)
      if (!res.ok) { toast.error('수정 실패'); return }
      toast.success('러닝 기록이 수정됐습니다!')
      onSuccess?.()
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const local_date_key = values.date
    const date = new Date(`${values.date}T00:00:00+09:00`).toISOString()

    const { data: run, error: runError } = await supabase.from('runs').insert({
      user_id: user.id,
      date,
      local_date_key,
      distance_km: values.distance_km,
      duration_sec,
      avg_pace_sec_per_km,
      avg_heart_rate_bpm: values.avg_heart_rate_bpm ?? null,
      source: gpxFile ? 'gpx' : 'manual',
    }).select('id').single()

    if (runError || !run) {
      toast.error('저장 실패: ' + runError?.message)
      setLoading(false)
      return
    }

    if (gpxFile) {
      const path = `${user.id}/${run.id}.gpx`
      const recheck = validateGpxFile(gpxFile)
      if (recheck) { toast.warning(recheck); setLoading(false); return }
      const { error: uploadError } = await supabase.storage
        .from('gpx-files')
        .upload(path, gpxFile, { contentType: 'application/gpx+xml' })
      if (uploadError) {
        toast.warning('러닝은 저장됐지만 GPX 업로드에 실패했습니다.')
      } else {
        await supabase.from('runs').update({ gpx_storage_path: path }).eq('id', run.id)
      }
    }

    setLoading(false)
    toast.success('러닝이 기록됐습니다! 🏃')
    reset({ date: todayKST(), hours: 0, minutes: 0, seconds: 0, avg_heart_rate_bpm: null })
    setGpxFile(null)
    setGpxAutoFilled(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
      <div className="space-y-1.5">
        <Label htmlFor="date">날짜</Label>
        <Input id="date" type="date" {...register('date')} max={todayKST()} />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      {!isEdit && (
        <div className="space-y-1.5">
          <Label>GPX 파일 <span className="text-muted-foreground">(선택 — 자동으로 스탯 입력)</span></Label>
          {gpxFile ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">{gpxFile.name}</span>
              {gpxAutoFilled && <span className="text-xs text-orange-500 shrink-0">자동 입력됨</span>}
              <button type="button" onClick={removeGpx}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:border-orange-400 hover:text-foreground transition-colors"
            >
              <Paperclip className="h-4 w-4" />GPX 파일 첨부
            </button>
          )}
          <input ref={fileRef} type="file" accept=".gpx" className="hidden" onChange={handleGpxSelect} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="distance">거리 (km)</Label>
        <Input id="distance" type="number" step="0.01" placeholder="5.00"
          {...register('distance_km', { valueAsNumber: true })} />
        {errors.distance_km && <p className="text-xs text-destructive">{errors.distance_km.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>소요시간</Label>
        <div className="flex items-center gap-2">
          {[
            { field: 'hours' as const, max: 23, placeholder: '0', label: '시' },
            { field: 'minutes' as const, max: 59, placeholder: '30', label: '분' },
            { field: 'seconds' as const, max: 59, placeholder: '00', label: '초' },
          ].map(({ field, max, placeholder, label }) => (
            <div key={field} className="flex-1">
              <Input type="number" min={0} max={max} placeholder={placeholder}
                {...register(field, { valueAsNumber: true })} />
              <p className="mt-1 text-center text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        {errors.minutes && <p className="text-xs text-destructive">{errors.minutes.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hr">평균 심박수 <span className="text-muted-foreground">(선택)</span></Label>
        <Input id="hr" type="number" placeholder="148"
          {...register('avg_heart_rate_bpm', { setValueAs: (v) => v === '' || v === undefined || v === null ? null : parseInt(v, 10) })} />
        {errors.avg_heart_rate_bpm && <p className="text-xs text-destructive">{errors.avg_heart_rate_bpm.message}</p>}
      </div>

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? '수정 저장' : '기록 저장'}
      </Button>
    </form>
  )
}
