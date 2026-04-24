import { z } from 'zod'

export const runSchema = z.object({
  date: z.string().min(1, '날짜를 선택해주세요.'),
  distance_km: z
    .number({ message: '거리를 입력해주세요.' })
    .positive('0보다 커야 합니다.')
    .max(200, '너무 큰 값입니다.'),
  hours: z.number().int().min(0).max(23),
  minutes: z.number().int().min(0).max(59),
  seconds: z.number().int().min(0).max(59),
  avg_heart_rate_bpm: z
    .number({ message: '숫자를 입력해주세요.' })
    .int('정수를 입력해주세요.')
    .min(40, '40~250 사이의 값을 입력해주세요.')
    .max(250, '40~250 사이의 값을 입력해주세요.')
    .optional()
    .nullable(),
}).refine(
  (d) => d.hours * 3600 + d.minutes * 60 + d.seconds > 0,
  { message: '소요시간을 입력해주세요.', path: ['minutes'] }
)

export type RunFormValues = z.infer<typeof runSchema>
