export function nowKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

export function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function getGoalPeriod(goalType: string): { start: string; end: string; label: string } {
  const now = nowKST()

  if (goalType === 'daily') {
    const today = toDateKey(now)
    return { start: today, end: today, label: '오늘' }
  }
  if (goalType === 'weekly') {
    const day = now.getDay()
    const sun = new Date(now); sun.setDate(now.getDate() - day)
    const sat = new Date(sun); sat.setDate(sun.getDate() + 6)
    return { start: toDateKey(sun), end: toDateKey(sat), label: '이번 주' }
  }
  const y = now.getFullYear(), m = now.getMonth() + 1
  const last = new Date(y, m, 0).getDate()
  return {
    start: `${y}-${String(m).padStart(2, '0')}-01`,
    end: `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`,
    label: '이번 달',
  }
}
