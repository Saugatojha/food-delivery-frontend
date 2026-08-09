export const AREAS = [
  { name: 'Thamel', city: 'Kathmandu', lat: 27.7159, lng: 85.3124 },
  { name: 'Durbar Marg', city: 'Kathmandu', lat: 27.7136, lng: 85.3162 },
  { name: 'New Road', city: 'Kathmandu', lat: 27.7011, lng: 85.3146 },
  { name: 'Asan', city: 'Kathmandu', lat: 27.7036, lng: 85.3095 },
  { name: 'Baneshwor', city: 'Kathmandu', lat: 27.6931, lng: 85.3393 },
  { name: 'Lazimpat', city: 'Kathmandu', lat: 27.7200, lng: 85.3190 },
  { name: 'Putalisadak', city: 'Kathmandu', lat: 27.7071, lng: 85.3211 },
  { name: 'Dillibazar', city: 'Kathmandu', lat: 27.7046, lng: 85.3250 },
  { name: 'Kamaladi', city: 'Kathmandu', lat: 27.7080, lng: 85.3180 },
  { name: 'Kalimati', city: 'Kathmandu', lat: 27.6970, lng: 85.3040 },
  { name: 'Baluwatar', city: 'Kathmandu', lat: 27.7170, lng: 85.3160 },
  { name: 'Gaushala', city: 'Kathmandu', lat: 27.7100, lng: 85.3350 },
  { name: 'Chabahil', city: 'Kathmandu', lat: 27.7210, lng: 85.3420 },
  { name: 'Balaju', city: 'Kathmandu', lat: 27.7300, lng: 85.2900 },
  { name: 'Koteshwor', city: 'Kathmandu', lat: 27.6780, lng: 85.3500 },
  { name: 'Swoyambhu', city: 'Kathmandu', lat: 27.7150, lng: 85.2900 },
  { name: 'Kirtipur', city: 'Kathmandu', lat: 27.6780, lng: 85.2770 },
  { name: 'Bouddhanath', city: 'Kathmandu', lat: 27.7210, lng: 85.3620 },
  { name: 'Jawalakhel', city: 'Lalitpur', lat: 27.6670, lng: 85.3100 },
  { name: 'Pulchowk', city: 'Lalitpur', lat: 27.6800, lng: 85.3170 },
  { name: 'Patan', city: 'Lalitpur', lat: 27.6710, lng: 85.3260 },
  { name: 'Bhaktapur', city: 'Bhaktapur', lat: 27.6720, lng: 85.4280 },
]

function toRad(deg) {
  return (deg * Math.PI) / 180
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function reverseGeocode(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  let best = null
  let bestDist = Infinity
  for (const area of AREAS) {
    const d = haversineKm(lat, lng, area.lat, area.lng)
    if (d < bestDist) {
      bestDist = d
      best = area
    }
  }
  return best ? { area: best.name, city: best.city, distanceKm: Math.round(bestDist * 10) / 10 } : null
}

export function formatDeliveryAddress({ house = '', street = '', area = '', city = '', landmark = '' } = {}) {
  const parts = []
  const streetPart = [house, street].filter(Boolean).join(', ')
  if (streetPart) parts.push(streetPart)
  if (landmark) parts.push(`near ${landmark}`)
  if (area) parts.push(area)
  if (city) parts.push(city)
  return parts.join(', ')
}

export function emptyAddressDetails() {
  return { house: '', street: '', area: '', city: '', landmark: '' }
}
