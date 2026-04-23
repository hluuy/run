export function nowKST(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000)
}

export function todayKST(): string {
  return nowKST().toISOString().slice(0, 10)
}
