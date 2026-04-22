'use client'

import { useEffect, useRef } from 'react'
import type { GpxPoint } from '@/lib/gpx'

interface RouteMapProps {
  points: GpxPoint[]
}

export function RouteMap({ points }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || points.length === 0 || mapRef.current) return

    // Leaflet은 SSR 불가 — 동적 import
    import('leaflet').then((L) => {
      // 기본 아이콘 경로 수정 (Next.js 빌드 이슈)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const latlngs = points.map((p) => [p.lat, p.lon] as [number, number])

      const map = L.map(containerRef.current!, { zoomControl: true, scrollWheelZoom: false })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      // 경로 폴리라인
      const polyline = L.polyline(latlngs, { color: '#f97316', weight: 4, opacity: 0.85 }).addTo(map)

      // 시작/종료 마커
      L.circleMarker(latlngs[0], { radius: 7, fillColor: '#22c55e', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map)
      L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, fillColor: '#ef4444', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map)

      map.fitBounds(polyline.getBounds(), { padding: [16, 16] })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [points])

  return (
    <>
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} className="h-52 w-full rounded-xl overflow-hidden" />
    </>
  )
}
