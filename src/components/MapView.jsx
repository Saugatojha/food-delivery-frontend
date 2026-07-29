import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet'
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

let tileErrorShown = false

function TileErrorFallback() {
  const map = useMap()
  useEffect(() => {
    if (typeof map.getContainer !== 'function') return
    const container = map.getContainer()
    const onError = () => {
      if (tileErrorShown) return
      tileErrorShown = true
      const el = document.createElement('div')
      el.className = 'absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm p-4 text-center z-[2000]'
      el.innerText = 'Map tiles unavailable. Check your internet connection and try again.'
      container.parentElement?.appendChild(el)
    }
    map.on('tileerror', onError)
    return () => { map.off('tileerror', onError) }
  }, [map])
  return null
}

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
  center = [27.7000, 85.3500],
  zoom = 13,
  restaurant,
  restaurants,
  delivery,
  rider,
  onClick,
  height = '300px',
  interactive = true,
  showRouteNote = false,
}) {
  const restaurantPos = restaurant ? [restaurant.latitude, restaurant.longitude] : null
  const deliveryPos = delivery ? [delivery.latitude, delivery.longitude] : null
  const riderPos = rider ? [rider.latitude, rider.longitude] : null

  const routePoints = [restaurantPos, deliveryPos].filter(Boolean)
  const restaurantBounds = restaurants ? restaurants.map(r => [r.latitude, r.longitude]) : []
  const bounds = [...restaurantBounds, restaurantPos, deliveryPos, riderPos].filter(Boolean)

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border relative">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} dragging={interactive} scrollWheelZoom={interactive} doubleClickZoom={interactive}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <TileErrorFallback />
        <FitBounds bounds={bounds} />
        {onClick && <ClickHandler onClick={onClick} />}
        {restaurants
          ? restaurants.map(r => (
              <Marker key={r.id} position={[r.latitude, r.longitude]} icon={restaurantIcon}>
                <Popup><b>{r.name}</b><br/>{r.cuisine}</Popup>
              </Marker>
            ))
          : restaurantPos && <Marker position={restaurantPos} icon={restaurantIcon} />}
        {deliveryPos && <Marker position={deliveryPos} icon={deliveryIcon} />}
        {riderPos && <Marker position={riderPos} icon={riderIcon} />}
        {routePoints.length === 2 && (
          <Polyline positions={routePoints} pathOptions={{ color: '#f97316', weight: 2, dashArray: '8, 6' }} />
        )}
      </MapContainer>
      {showRouteNote && routePoints.length === 2 && (
        <div className="absolute bottom-1 left-1 bg-white/80 text-[10px] text-gray-500 px-1.5 py-0.5 rounded z-[1000]">
          Route line is approximate (straight-line)
        </div>
      )}
    </div>
  )
}
