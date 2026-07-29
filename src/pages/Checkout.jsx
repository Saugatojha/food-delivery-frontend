import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { formatPrice, calcTotal, MOCK_RESTAURANTS } from '../data/mock'
import { getCart, saveCart, submitOrder } from '../services/orders'
import MapView from '../components/MapView'

export default function Checkout() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [placing, setPlacing] = useState(false)
  const [deliveryPos, setDeliveryPos] = useState(null)
  const [locating, setLocating] = useState(false)

  const cart = getCart()
  const total = calcTotal(cart)
  const restaurantId = cart[0]?.restaurantId
  const restaurant = MOCK_RESTAURANTS.find(r => r.id === restaurantId)

  if (cart.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const handleMapClick = (latlng) => { setDeliveryPos(latlng) }

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

  const placeOrder = async () => {
    if (!address.trim()) return showToast('Enter a delivery address', 'error')
    if (placing) return
    setPlacing(true)
    try {
      const pos = deliveryPos || { lat: restaurant.latitude + 0.008, lng: restaurant.longitude + 0.005 }
      await submitOrder({
        items: cart,
        total,
        address: address.trim(),
        paymentMethod,
        deliveryLatitude: pos.lat,
        deliveryLongitude: pos.lng,
      })
      saveCart([])
      showToast('Order placed successfully!', 'success')
      navigate('/orders')
    } catch {
      showToast('Failed to place order', 'error')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
        <textarea className="border p-2 rounded w-full" rows="3" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your full address" />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Choose delivery location on map</label>
          <button onClick={useCurrentLocation} disabled={locating} className="text-xs bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded disabled:opacity-50">
            {locating ? 'Detecting...' : 'Use current location'}
          </button>
        </div>
        <MapView
          center={[restaurant.latitude, restaurant.longitude]}
          zoom={14}
          restaurant={restaurant}
          delivery={deliveryPos ? { latitude: deliveryPos.lat, longitude: deliveryPos.lng } : null}
          onClick={handleMapClick}
          height="280px"
          showRouteNote
        />
        {deliveryPos ? (
          <p className="text-xs text-green-600 font-medium mt-1">Delivery location set: {deliveryPos.lat.toFixed(4)}, {deliveryPos.lng.toFixed(4)}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Click on the map to set delivery location (or use current location)</p>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <select className="border p-2 rounded w-full sm:w-64" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="card">Credit Card (Mock)</option>
          <option value="cash">Cash on Delivery</option>
        </select>
      </div>

      <div className="border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">Order Summary</h2>
        {cart.map(item => (
          <div key={item.id} className="flex justify-between text-sm py-1">
            <span>{item.name} x{item.qty}</span>
            <span>{formatPrice(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="font-bold text-lg mt-3 border-t pt-3 flex justify-between">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <button onClick={placeOrder} disabled={placing} className="bg-orange-500 text-white p-3 rounded w-full font-medium disabled:opacity-50">
        {placing ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  )
}
