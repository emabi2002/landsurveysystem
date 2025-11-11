'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface ControlPoint {
  id: string
  code: string
  lat: number
  lng: number
  elevation?: number
  datum: string
  status: string
  accuracy_class?: string
  monument_type?: string
  description?: string
}

interface ControlPointsMapProps {
  points: ControlPoint[]
  center?: [number, number]
  zoom?: number
  onPointClick?: (point: ControlPoint) => void
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

  return null
}

export function ControlPointsMap({
  points,
  center = [-6.314993, 143.95555], // Papua New Guinea center
  zoom = 8,
  onPointClick
}: ControlPointsMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-[600px] bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            eventHandlers={{
              click: () => onPointClick?.(point),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{point.code}</p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="capitalize">{point.status}</span>
                </p>
                <p className="text-xs">
                  Lat: {point.lat.toFixed(6)}, Lng: {point.lng.toFixed(6)}
                </p>
                {point.elevation && (
                  <p className="text-xs">Elevation: {point.elevation}m</p>
                )}
                {point.datum && (
                  <p className="text-xs">Datum: {point.datum}</p>
                )}
                {point.monument_type && (
                  <p className="text-xs">Monument: {point.monument_type}</p>
                )}
                {point.description && (
                  <p className="text-xs mt-2">{point.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
