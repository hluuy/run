'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatPace } from '@/lib/streak'
import { usePersonalStats } from '@/hooks/use-personal-stats'
import { Zap, MapPin, Flame, Trophy } from 'lucide-react'

interface PersonalStatsDialogProps {
  open: boolean
  onClose: () => void
  openCount: number
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/50 px-4 py-3 flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

export function PersonalStatsDialog({ open, onClose, openCount }: PersonalStatsDialogProps) {
  const { stats, loading } = usePersonalStats(open, openCount)

  const nowYM = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm w-full rounded-2xl max-h-[85vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold">내 통계</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-5">
          {/* 누적 통계 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">누적</p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<MapPin className="h-4 w-4" />}
                label="총 거리"
                value={loading ? '—' : `${(stats?.totalKm ?? 0).toFixed(1)} km`}
              />
              <StatCard
                icon={<Flame className="h-4 w-4" />}
                label="총 러닝"
                value={loading ? '—' : `${stats?.totalRuns ?? 0}회`}
              />
            </div>
          </div>

          {/* 개인 기록 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">개인 기록</p>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<Zap className="h-4 w-4" />}
                label="최고 페이스"
                value={loading ? '—' : stats?.bestPaceSec ? `${formatPace(stats.bestPaceSec)} /km` : '—'}
              />
              <StatCard
                icon={<MapPin className="h-4 w-4" />}
                label="최장 거리"
                value={loading ? '—' : stats?.maxDistanceKm ? `${stats.maxDistanceKm.toFixed(2)} km` : '—'}
              />
              <StatCard
                icon={<Flame className="h-4 w-4 text-primary" />}
                label="현재 스트릭"
                value={loading ? '—' : `${stats?.currentStreak ?? 0}일`}
              />
              <StatCard
                icon={<Trophy className="h-4 w-4 text-yellow-500" />}
                label="최장 스트릭"
                value={loading ? '—' : `${stats?.longestStreak ?? 0}일`}
              />
            </div>
          </div>

          {/* 월별 거리 차트 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3">월별 거리</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats?.monthlyTotals ?? []} barSize={28}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)} km`, '거리']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="totalKm" radius={[4, 4, 0, 0]}>
                  {(stats?.monthlyTotals ?? []).map((entry) => (
                    <Cell
                      key={entry.yearMonth}
                      fill={entry.yearMonth === nowYM ? 'oklch(0.72 0.18 45)' : 'oklch(0.55 0 0)'}
                      opacity={entry.yearMonth === nowYM ? 1 : 0.35}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
