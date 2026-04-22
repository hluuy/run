import type { Run, RollingAvg, DayData } from '@/types'

// 페이스 포맷: 초/km → "M'SS""
export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}'${String(s).padStart(2, '0')}"`
}

// 소요시간 포맷: 초 → "H시간 MM분" 또는 "MM분 SS초"
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분 ${s}초`
}

// 강도 점수 계산 (0.0 ~ 1.0)
export function calcIntensityScore(
  totalDistKm: number,
  avgPaceSec: number,
  rolling: RollingAvg | null
): number {
  if (!rolling || !rolling.avg_distance_km) return 0.3

  const distAbove = totalDistKm > rolling.avg_distance_km
  const paceAbove = avgPaceSec < rolling.avg_pace_sec_per_km // 낮을수록 빠름

  if (distAbove && paceAbove) return 1.0
  if (distAbove || paceAbove) return 0.65
  return 0.3
}

// 강도 점수 → 오렌지 색상 (Tailwind 인라인 스타일)
export function intensityToColor(score: number): string {
  if (score >= 1.0) return 'hsl(20 90% 42%)'   // 진한 오렌지
  if (score >= 0.65) return 'hsl(28 90% 55%)'  // 중간 오렌지
  return 'hsl(36 90% 68%)'                      // 연한 오렌지
}

// runs 배열 → local_date_key 기준 DayData 맵
export function groupRunsByDay(runs: Run[], rolling: RollingAvg | null): Map<string, DayData> {
  const map = new Map<string, DayData>()

  for (const run of runs) {
    const key = run.local_date_key
    if (!map.has(key)) {
      map.set(key, { localDateKey: key, runs: [], totalDistanceKm: 0, avgPaceSecPerKm: 0, intensityScore: 0 })
    }
    const day = map.get(key)!
    day.runs.push(run)
    day.totalDistanceKm += run.distance_km
  }

  for (const day of map.values()) {
    const avgPace =
      day.runs.reduce((sum, r) => sum + r.avg_pace_sec_per_km, 0) / day.runs.length
    day.avgPaceSecPerKm = avgPace
    day.intensityScore = calcIntensityScore(day.totalDistanceKm, avgPace, rolling)
  }

  return map
}

// "YYYY-MM" 기준 해당 월의 모든 날짜 배열
export function getDaysInMonth(yearMonth: string): string[] {
  const [y, m] = yearMonth.split('-').map(Number)
  const days: string[] = []
  const total = new Date(y, m, 0).getDate()
  for (let d = 1; d <= total; d++) {
    days.push(`${yearMonth}-${String(d).padStart(2, '0')}`)
  }
  return days
}

// 해당 월 1일의 요일 (0=일, 1=월, ... 6=토)
export function getFirstDayOfWeek(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m - 1, 1).getDay()
}
