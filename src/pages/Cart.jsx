import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { formatPrice, calcTotal } from '../data/mock'
import { getCart, saveCart, getDeliveryLocation, saveDeliveryLocation } from '../services/orders'
import { reverseGeocode, formatDeliveryAddress, emptyAddressDetails } from '../utils/location'
import EmptyState from '../components/EmptyState'
import MapView from '../components/MapView'

const EMPTY_DETAILS = emptyAddressDetails()

export default function Cart() {
  const [cart, setCart] = useState(getCart())
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [saved] = useState(() => getDeliveryLocation())
  const [deliveryPos, setDeliveryPos] = useState(saved && typeof saved.lat === 'number' ? { lat: saved.lat, lng: saved.lng } : null)
  const [details, setDetails] = useState(saved && typeof saved.lat === 'number' ? { ...EMPTY_DETAILS, ...saved } : { ...EMPTY_DETAILS })
  const [locating, setLocating] = useState(false)

  const updateQty = (id, delta) => {
    const updated = cart.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)
    setCart(updated)
    saveCart(updated)
  }

  const remove = (id) => {
    const updated = cart.filter(c => c.id !== id)
    setCart(updated)
    saveCart(updated)
    showToast('Item removed', 'info')
  }

  const applyPin = (lat, lng) => {
    setDeliveryPos({ lat, lng })
    const place = reverseGeocode(lat, lng)
    setDetails(d => ({ ...d, area: place ? place.area : d.area, city: place ? place.city : d.city }))
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return showToast('Geolocation not supported', 'error')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPin(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
        showToast('Location detected', 'success')
      },
      () => {
        setLocating(false)
        showToast('Could not detect location', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const setDetail = (key, value) => {
    setDetails(d => ({ ...d, [key]: value }))
  }

  const formattedAddress = formatDeliveryAddress(details)

  const proceedToCheckout = () => {
    if (!deliveryPos) {
      showToast('Please set your delivery location on the map first', 'error')
      return
    }
    if (!formattedAddress) {
      showToast('Please add your house/street or area to complete the address', 'error')
      return
    }
    saveDeliveryLocation({
      lat: deliveryPos.lat,
      lng: deliveryPos.lng,
      ...details,
      address: formattedAddress,
      updatedAt: Date.now(),
    })
    navigate('/checkout')
  }

  if (cart.length === 0) {
    return <EmptyState icon="🛒" title="Your cart is empty" message="Add items from a restaurant to get started" action={<Link to="/" className="bg-orange-500 text-white px-4 py-2 rounded inline-block">Browse restaurants</Link>} />
  }

  const total = calcTotal(cart)

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {cart.map(item => (
        <div key={item.id} className="border rounded-lg p-4 mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />}
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.restaurantName}</p>
              <p className="font-medium text-orange-600">{formatPrice(item.price * item.qty)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => updateQty(item.id, -1)} className="border px-2 py-1 rounded hover:bg-gray-100">-</button>
            <span className="w-6 text-center">{item.qty}</span>
            <button onClick={() => updateQty(item.id, 1)} className="border px-2 py-1 rounded hover:bg-gray-100">+</button>
            <button onClick={() => remove(item.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm ml-2">Remove</button>
          </div>
        </div>
      ))}

      <div className="mb-6 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">1. Set your delivery location</label>
          <button onClick={useCurrentLocation} disabled={locating} className="text-xs bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded disabled:opacity-50" aria-label="Use current location">
            {locating ? 'Detecting...' : 'Use current location'}
          </button>
        </div>
        <div className="rounded-lg overflow-hidden border">
          <MapView
            center={[27.7000, 85.3500]}
            zoom={12}
            delivery={deliveryPos ? { latitude: deliveryPos.lat, longitude: deliveryPos.lng } : null}
            onClick={(latlng) => applyPin(latlng.lat, latlng.lng)}
            height="260px"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Drop a pin on the map (or use current location) — your area and city fill in automatically.</p>

        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600">House / Apartment</label>
            <input className="border p-2 rounded w-full text-sm" placeholder="House 12, flat 3B" value={details.house} onChange={e => setDetail('house', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Street / Road</label>
            <input className="border p-2 rounded w-full text-sm" placeholder="e.g. Pipal Bot Marg" value={details.street} onChange={e => setDetail('street', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Area / Locality</label>
            <input className="border p-2 rounded w-full text-sm" placeholder="e.g. Thamel" value={details.area} onChange={e => setDetail('area', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">City</label>
            <input className="border p-2 rounded w-full text-sm" placeholder="e.g. Kathmandu" value={details.city} onChange={e => setDetail('city', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-600">Nearby landmark (optional)</label>
            <input className="border p-2 rounded w-full text-sm" placeholder="e.g. near Jamal, opposite Bhatbhateni" value={details.landmark} onChange={e => setDetail('landmark', e.target.value)} />
          </div>
        </div>

        {deliveryPos && (
          <div className="mt-3 border-t pt-3">
            <p className="text-sm text-green-600 font-medium">📍 {formattedAddress || 'Thamel, Kathmandu'}</p>
            <p className="text-xs text-gray-400">Coordinates: {deliveryPos.lat.toFixed(5)}, {deliveryPos.lng.toFixed(5)}</p>
            {!formattedAddress && <p className="text-xs text-gray-500">Add your house/street or area to complete the address.</p>}
          </div>
        )}
      </div>

      <div className="text-xl font-bold mt-4">Total: {formatPrice(total)}</div>
      <button onClick={proceedToCheckout} className="block text-center w-full bg-orange-500 text-white p-3 rounded mt-4 font-medium">
        2. Proceed to Checkout
      </button>
    </div>
  )
}
