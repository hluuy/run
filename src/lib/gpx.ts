import GpxParser from 'gpxparser'

// XXE, SSRF, script injection 방지
export function sanitizeGpxXml(xml: string): string {
  return xml
    .replace(/<!DOCTYPE[^>]*>/gi, '')   // DOCTYPE 제거 (XXE)
    .replace(/<!ENTITY[^>]*>/gi, '')    // ENTITY 제거
    .replace(/<\?xml-stylesheet[^>]*\?>/gi, '') // XSL injection
    .replace(/<script[\s\S]*?<\/script>/gi, '') // script 태그
}

export interface GpxPoint {
  lat: number
  lon: number
  ele?: number
  time?: Date
}

export interface ParsedGpx {
  points: GpxPoint[]
  distanceKm: number
  durationSec: number | null
  avgPaceSecPerKm: number | null
  avgHeartRate: number | null
}

export function parseGpxFile(xmlString: string): ParsedGpx {
  const gpx = new GpxParser()
  gpx.parse(sanitizeGpxXml(xmlString))

  const track = gpx.tracks[0]
  if (!track || !track.points?.length) {
    throw new Error('GPX 파일에 트랙 데이터가 없습니다.')
  }

  const points: GpxPoint[] = track.points.map((p: any) => ({
    lat: p.lat,
    lon: p.lon,
    ele: p.ele,
    time: p.time ? new Date(p.time) : undefined,
  }))

  const distanceKm = (track.distance?.total ?? 0) / 1000

  // 시작/종료 시간으로 소요시간 계산
  const firstTime = points[0]?.time
  const lastTime = points[points.length - 1]?.time
  const durationSec =
    firstTime && lastTime
      ? Math.round((lastTime.getTime() - firstTime.getTime()) / 1000)
      : null

  const avgPaceSecPerKm =
    durationSec && distanceKm > 0 ? durationSec / distanceKm : null

  // Garmin 확장 심박수 파싱
  const hrValues: number[] = track.points
    .map((p: any) => p.extensions?.hr ?? p.extensions?.['gpxtpx:hr'])
    .filter((v: any) => typeof v === 'number' && v > 0)
  const avgHeartRate =
    hrValues.length > 0
      ? Math.round(hrValues.reduce((s: number, v: number) => s + v, 0) / hrValues.length)
      : null

  return { points, distanceKm, durationSec, avgPaceSecPerKm, avgHeartRate }
}

export function validateGpxFile(file: File): string | null {
  if (file.size > 10 * 1024 * 1024) return '파일 크기는 10MB 이하여야 합니다.'
  if (!file.name.toLowerCase().endsWith('.gpx')) return '.gpx 파일만 업로드 가능합니다.'
  return null
}
