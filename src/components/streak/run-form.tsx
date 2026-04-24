'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { runSchema, type RunFormValues } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WheelPicker } from '@/components/ui/wheel-picker'
import { DatePickerSheet } from '@/components/ui/date-picker-sheet'
import { toast } from 'sonner'
import { Loader2, Paperclip, X, Minus, Plus } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { parseGpxFile, validateGpxFile } from '@/lib/gpx'
import type { Run } from '@/types'

interface RunFormProps {
  onSuccess?: () => void
  editRun?: Run
}

function todayKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// 거리: 0~99 정수, .00~.99 소수
const INT_ITEMS  = Array.from({ length: 100 }, (_, i) => String(i))
const DEC_ITEMS  = Array.from({ length: 100 }, (_, i) => `.${String(i).padStart(2, '0')}`)

// 시간: 시/분/초 (단위는 피커 밖에 표시)
const HOUR_ITEMS = Array.from({ length: 24 }, (_, i) => String(i))
const MIN_ITEMS  = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const SEC_ITEMS  = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

export function RunForm({ onSuccess, editRun }: RunFormProps) {
  const [loading, setLoading] = useState(false)
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [gpxAutoFilled, setGpxAutoFilled] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const isEdit = !!editRun

  // 거리 피커 상태
  const initKm = editRun?.distance_km ?? 5.00
  const [distInt, setDistInt] = useState(Math.floor(initKm))
  const [distDec, setDistDec] = useState(Math.round((initKm % 1) * 100))

  // 시간 피커 상태
  const [pickHours,   setPickHours]   = useState(editRun ? Math.floor(editRun.duration_sec / 3600) : 0)
  const [pickMinutes, setPickMinutes] = useState(editRun ? Math.floor((editRun.duration_sec % 3600) / 60) : 0)
  const [pickSeconds, setPickSeconds] = useState(editRun ? editRun.duration_sec % 60 : 0)

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
    watch,
    formState: { errors },
  } = useForm<RunFormValues>({
    resolver: zodResolver(runSchema),
    defaultValues,
  })

  const dateValue = watch('date')
  const heartRate = watch('avg_heart_rate_bpm')

  const adjustHR = useCallback((delta: number) => {
    const curr = heartRate ?? (delta > 0 ? 149 : null)  // + 첫 클릭 → 150 bpm
    if (curr === null) return
    const next = Math.min(250, Math.max(40, curr + delta))
    setValue('avg_heart_rate_bpm', next, { shouldValidate: true })
  }, [heartRate, setValue])

  // 피커 값 → 폼 동기화
  useEffect(() => {
    setValue('distance_km', distInt + distDec / 100)
  }, [distInt, distDec, setValue])

  useEffect(() => {
    setValue('hours',   pickHours)
    setValue('minutes', pickMinutes)
    setValue('seconds', pickSeconds)
  }, [pickHours, pickMinutes, pickSeconds, setValue])

  async function handleGpxSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateGpxFile(file)
    if (err) { toast.error(err); return }
    setGpxFile(file)
    try {
      const xml = await file.text()
      const parsed = parseGpxFile(xml)
      const km = Math.round(parsed.distanceKm * 100) / 100
      setDistInt(Math.floor(km))
      setDistDec(Math.round((km % 1) * 100))
      setValue('distance_km', km)
      if (parsed.durationSec) {
        const h = Math.floor(parsed.durationSec / 3600)
        const m = Math.floor((parsed.durationSec % 3600) / 60)
        const s = parsed.durationSec % 60
        setPickHours(h); setPickMinutes(m); setPickSeconds(s)
        setValue('hours', h); setValue('minutes', m); setValue('seconds', s)
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
    if (!navigator.onLine) {
      toast.error('오프라인 상태입니다. 네트워크 연결 후 다시 시도해주세요.')
      return
    }
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
    setDistInt(5); setDistDec(0)
    setPickHours(0); setPickMinutes(0); setPickSeconds(0)
    setGpxFile(null); setGpxAutoFilled(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-4">
      {/* 날짜 */}
      <div className="space-y-1.5">
        <Label>날짜</Label>
        <DatePickerSheet
          value={dateValue}
          onChange={(v) => setValue('date', v, { shouldValidate: true })}
          max={todayKST()}
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>

      {/* GPX */}
      {isEdit && editRun?.gpx_storage_path && (
        <p className="text-xs text-muted-foreground rounded-lg border border-border bg-secondary/40 px-3 py-2">
          GPX 파일은 수정할 수 없습니다. 변경이 필요하면 기록을 삭제 후 다시 추가해주세요.
        </p>
      )}
      {!isEdit && (
        <div className="space-y-1.5">
          <Label>GPX 파일 <span className="text-muted-foreground">(선택 — 자동으로 스탯 입력)</span></Label>
          {gpxFile ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">{gpxFile.name}</span>
              {gpxAutoFilled && <span className="text-xs text-primary shrink-0">자동 입력됨</span>}
              <button type="button" onClick={removeGpx}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Paperclip className="h-4 w-4" />GPX 파일 첨부
            </button>
          )}
          <input ref={fileRef} type="file" accept=".gpx" className="hidden" onChange={handleGpxSelect} />
        </div>
      )}

      {/* 거리 피커 */}
      <div className="space-y-2">
        <Label>거리</Label>
        <div className="flex items-center gap-1 rounded-2xl border border-border overflow-hidden bg-secondary/30">
          <WheelPicker items={INT_ITEMS} selectedIndex={distInt} onChange={setDistInt} />
          <WheelPicker items={DEC_ITEMS} selectedIndex={distDec} onChange={setDistDec} />
          <div className="flex-none flex items-center justify-center w-14 text-sm font-semibold text-muted-foreground">
            km
          </div>
        </div>
        {errors.distance_km && <p className="text-xs text-destructive">{errors.distance_km.message}</p>}
      </div>

      {/* 소요시간 피커 */}
      <div className="space-y-2">
        <Label>소요시간</Label>
        <div className="flex items-center rounded-2xl border border-border overflow-hidden bg-secondary/30">
          <WheelPicker items={HOUR_ITEMS} selectedIndex={pickHours}   onChange={setPickHours} />
          <span className="flex-none text-xs font-medium text-muted-foreground">h</span>
          <WheelPicker items={MIN_ITEMS}  selectedIndex={pickMinutes} onChange={setPickMinutes} />
          <span className="flex-none text-xs font-medium text-muted-foreground">m</span>
          <WheelPicker items={SEC_ITEMS}  selectedIndex={pickSeconds} onChange={setPickSeconds} />
          <span className="flex-none text-xs font-medium text-muted-foreground pr-3">s</span>
        </div>
        {errors.minutes && <p className="text-xs text-destructive">{errors.minutes.message}</p>}
      </div>

      {/* 평균 심박수 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>평균 심박수 <span className="text-muted-foreground">(선택)</span></Label>
          {heartRate != null && (
            <button
              type="button"
              onClick={() => setValue('avg_heart_rate_bpm', null, { shouldValidate: true })}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              초기화
            </button>
          )}
        </div>
        <div className="flex items-center rounded-2xl border border-border overflow-hidden bg-secondary/30">
          <button
            type="button"
            onClick={() => adjustHR(-1)}
            disabled={heartRate == null || heartRate <= 40}
            className="flex h-12 w-12 items-center justify-center text-muted-foreground hover:text-foreground active:bg-secondary disabled:opacity-30 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex-1 flex items-center justify-center">
            {heartRate != null
              ? <span className="text-xl font-semibold tabular-nums">{heartRate}</span>
              : <span className="text-sm text-muted-foreground">— bpm</span>
            }
          </div>
          <button
            type="button"
            onClick={() => adjustHR(1)}
            disabled={heartRate != null && heartRate !== undefined && heartRate >= 250}
            className="flex h-12 w-12 items-center justify-center text-muted-foreground hover:text-foreground active:bg-secondary disabled:opacity-30 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
          {heartRate != null && (
            <span className="pr-4 text-sm font-medium text-muted-foreground">bpm</span>
          )}
        </div>
        {errors.avg_heart_rate_bpm && <p className="text-xs text-destructive">{errors.avg_heart_rate_bpm.message}</p>}
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? '수정 저장' : '기록 저장'}
      </Button>
    </form>
  )
}
