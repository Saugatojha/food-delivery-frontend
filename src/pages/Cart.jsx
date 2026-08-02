import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { formatPrice, calcTotal } from '../data/mock'
import { getCart, saveCart, saveDeliveryLocation } from '../services/orders'
import EmptyState from '../components/EmptyState'
import MapView from '../components/MapView'

export default function Cart() {
  const [cart, setCart] = useState(getCart())
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [deliveryPos, setDeliveryPos] = useState(null)
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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return showToast('Geolocation not supported', 'error')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
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

  const proceedToCheckout = () => {
    if (!deliveryPos) {
      showToast('Please set your delivery location first', 'error')
      return
    }
    saveDeliveryLocation({ lat: deliveryPos.lat, lng: deliveryPos.lng, updatedAt: Date.now() })
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
          <label className="block text-sm font-medium text-gray-700">1. Choose your delivery location</label>
          <button onClick={useCurrentLocation} disabled={locating} className="text-xs bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded disabled:opacity-50" aria-label="Use current location">
            {locating ? 'Detecting...' : 'Use current location'}
          </button>
        </div>
        <div className="rounded-lg overflow-hidden border">
          <MapView
            center={[27.7000, 85.3500]}
            zoom={12}
            delivery={deliveryPos ? { latitude: deliveryPos.lat, longitude: deliveryPos.lng } : null}
            onClick={(latlng) => setDeliveryPos(latlng)}
            height="260px"
          />
        </div>
        {deliveryPos ? (
          <p className="text-xs text-green-600 font-medium mt-2">Delivery location set: {deliveryPos.lat.toFixed(4)}, {deliveryPos.lng.toFixed(4)}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-2">Click on the map to set your delivery location (or use current location)</p>
        )}
      </div>

      <div className="text-xl font-bold mt-4">Total: {formatPrice(total)}</div>
      <button onClick={proceedToCheckout} className="block text-center w-full bg-orange-500 text-white p-3 rounded mt-4 font-medium">
        2. Proceed to Checkout
      </button>
    </div>
  )
}
