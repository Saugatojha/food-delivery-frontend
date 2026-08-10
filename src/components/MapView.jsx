import { useEffect, useState, useRef } from 'react'
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

function RoadRoute({ from, to, onStart, onSuccess, onFailure }) {
  useMap()
  const [coords, setCoords] = useState(null)
  const callbacksRef = useRef({ onStart, onSuccess, onFailure })
  const fromKey = from ? `${from[0]},${from[1]}` : null
  const toKey = to ? `${to[0]},${to[1]}` : null

  useEffect(() => {
    callbacksRef.current = { onStart, onSuccess, onFailure }
  })

  useEffect(() => {
    if (!fromKey || !toKey) return
    let cancelled = false
    const [lat1, lng1] = fromKey.split(',')
    const [lat2, lng2] = toKey.split(',')
    callbacksRef.current.onStart?.()
    setCoords(null)
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        const route = data.routes?.[0]?.geometry?.coordinates
        if (route && route.length) {
          setCoords(route.map(c => [c[1], c[0]]))
          callbacksRef.current.onSuccess?.()
        } else {
          callbacksRef.current.onFailure?.()
        }
      })
      .catch(() => {
        if (!cancelled) callbacksRef.current.onFailure?.()
      })
    return () => { cancelled = true }
  }, [fromKey, toKey])

  return coords ? <Polyline positions={coords} pathOptions={{ color: '#f97316', weight: 3 }} /> : null
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

  const [routeFailed, setRouteFailed] = useState(false)

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
          <RoadRoute
            from={routePoints[0]}
            to={routePoints[1]}
            onStart={() => setRouteFailed(false)}
            onSuccess={() => setRouteFailed(false)}
            onFailure={() => setRouteFailed(true)}
          />
        )}
      </MapContainer>
      {showRouteNote && routePoints.length === 2 && (
        <div className="absolute bottom-1 left-1 bg-white/80 text-[10px] text-gray-500 px-1.5 py-0.5 rounded z-[1000]" role="status">
          {routeFailed ? 'Route unavailable' : 'Route via OSRM (road network)'}
        </div>
      )}
    </div>
  )
}
