import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

const BASE = 'background:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;font-family:sans-serif;border:3px solid;box-shadow:0 2px 6px rgba(0,0,0,0.3)'

const restaurantIcon = L.divIcon({
  html: `<div style="${BASE};border-color:#f97316;color:#f97316">R</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const deliveryIcon = L.divIcon({
  html: `<div style="${BASE};border-color:#22c55e;color:#22c55e">D</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const riderIcon = L.divIcon({
  html: `<div style="${BASE};border-color:#3b82f6;color:#3b82f6">B</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng)
    },
  })
  return null
}

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const group = L.featureGroup(bounds.map(([lat, lng]) => L.marker([lat, lng])))
      map.fitBounds(group.getBounds().pad(0.15))
    }
  }, [map, bounds])
  return null
}

export default function MapView({
  center = [12.9716, 77.5946],
  zoom = 13,
  restaurant,
  delivery,
  rider,
  onClick,
  height = '300px',
  interactive = true,
}) {
  const restaurantPos = restaurant ? [restaurant.latitude, restaurant.longitude] : null
  const deliveryPos = delivery ? [delivery.latitude, delivery.longitude] : null
  const riderPos = rider ? [rider.latitude, rider.longitude] : null

  const routePoints = [restaurantPos, deliveryPos].filter(Boolean)
  const bounds = [restaurantPos, deliveryPos, riderPos].filter(Boolean)

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} dragging={interactive} scrollWheelZoom={interactive} doubleClickZoom={interactive}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds bounds={bounds} />
        {onClick && <ClickHandler onClick={onClick} />}
        {restaurantPos && <Marker position={restaurantPos} icon={restaurantIcon} />}
        {deliveryPos && <Marker position={deliveryPos} icon={deliveryIcon} />}
        {riderPos && <Marker position={riderPos} icon={riderIcon} />}
        {routePoints.length === 2 && (
          <Polyline positions={routePoints} pathOptions={{ color: '#f97316', weight: 2, dashArray: '8, 6' }} />
        )}
      </MapContainer>
    </div>
  )
}
