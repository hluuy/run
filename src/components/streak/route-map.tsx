'use client'

import { useEffect, useRef } from 'react'
import type { GpxPoint } from '@/lib/gpx'

interface RouteMapProps {
  points?: GpxPoint[]
  encodedPolyline?: string
}

export function RouteMap({ points, encodedPolyline }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const hasPoints = points && points.length > 0
    const hasPolyline = !!encodedPolyline

    if (!hasPoints && !hasPolyline) return

    import('leaflet').then(async (L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      let latlngs: [number, number][]

      if (hasPoints) {
        latlngs = points!.map((p) => [p.lat, p.lon])
      } else {
        const polylineLib = await import('@mapbox/polyline')
        latlngs = polylineLib.decode(encodedPolyline!) as [number, number][]
      }

      if (latlngs.length === 0) return

      const map = L.map(containerRef.current!, { zoomControl: true, scrollWheelZoom: false })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      const poly = L.polyline(latlngs, { color: '#f97316', weight: 4, opacity: 0.85 }).addTo(map)

      L.circleMarker(latlngs[0], { radius: 7, fillColor: '#22c55e', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map)
      L.circleMarker(latlngs[latlngs.length - 1], { radius: 7, fillColor: '#ef4444', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map)

      map.fitBounds(poly.getBounds(), { padding: [16, 16] })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [points, encodedPolyline])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} className="h-52 w-full rounded-xl overflow-hidden" />
    </>
  )
}
