import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { formatPrice, calcTotal, MOCK_RESTAURANTS } from '../data/mock'
import { getCart, saveCart, submitOrder } from '../services/orders'
import MapView from '../components/MapView'

const PAYMENT_STEPS = ['Processing payment', 'Verifying card', 'Confirming order']

export default function Checkout() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [placing, setPlacing] = useState(false)
  const [deliveryPos, setDeliveryPos] = useState(null)
  const [locating, setLocating] = useState(false)
  const [errors, setErrors] = useState({})
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' })
  const [cardErrors, setCardErrors] = useState({})
  const [paymentStep, setPaymentStep] = useState(-1)

  const cart = getCart()
  const total = calcTotal(cart)
  const restaurantId = cart[0]?.restaurantId
  const restaurant = MOCK_RESTAURANTS.find(r => r.id === restaurantId)

  if (cart.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const handleMapClick = (latlng) => {
    setDeliveryPos(latlng)
    setErrors(p => ({ ...p, location: '' }))
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return showToast('Geolocation not supported', 'error')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        setErrors(p => ({ ...p, location: '' }))
        showToast('Location detected', 'success')
      },
      () => {
        setLocating(false)
        showToast('Could not detect location', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const validate = () => {
    const e = {}
    if (!address.trim()) e.address = 'Delivery address is required'
    if (!phone.trim()) e.phone = 'Phone number is required'
    else if (!/^[\d\s+\-()]{7,15}$/.test(phone.trim())) e.phone = 'Enter a valid phone number (7-15 digits)'
    if (!restaurant?.isOpen) e.restaurant = 'Restaurant is currently closed'
    if (!deliveryPos) e.location = 'Please select a delivery location on the map'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateCard = () => {
    const e = {}
    if (!/^\d{16}$/.test(card.number.replace(/\s/g, ''))) e.number = 'Enter a valid 16-digit card number'
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = 'Use MM/YY format'
    if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = 'Enter a valid CVV'
    setCardErrors(e)
    return Object.keys(e).length === 0
  }

  const placeOrder = async () => {
    if (placing) return
    if (!validate()) return
    if (paymentMethod === 'card' && !validateCard()) return
    setPlacing(true)

    if (paymentMethod === 'card') {
      for (let i = 0; i < PAYMENT_STEPS.length; i++) {
        setPaymentStep(i)
        await new Promise(r => setTimeout(r, 600))
      }
    }

    try {
      await submitOrder({
        items: cart,
        total,
        address: address.trim(),
        phone: phone.trim(),
        paymentMethod,
        deliveryLatitude: deliveryPos.lat,
        deliveryLongitude: deliveryPos.lng,
      })
      saveCart([])
      showToast('Order placed successfully!', 'success')
      navigate('/orders')
    } catch {
      showToast('Failed to place order', 'error')
    } finally {
      setPlacing(false)
      setPaymentStep(-1)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {errors.restaurant && (
        <p className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4 border border-red-200">{errors.restaurant}</p>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
        <textarea className={`border p-2 rounded w-full ${errors.address ? 'border-red-400' : ''}`} rows="3" value={address} onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })) }} placeholder="Enter your full address" />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input className={`border p-2 rounded w-full sm:w-80 ${errors.phone ? 'border-red-400' : ''}`} type="tel" placeholder="e.g. 9841XXXXXX" value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }} />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Choose delivery location on map</label>
          <button onClick={useCurrentLocation} disabled={locating} className="text-xs bg-gray-100 hover:bg-gray-200 border px-2 py-1 rounded disabled:opacity-50" aria-label="Use current location">
            {locating ? 'Detecting...' : 'Use current location'}
          </button>
        </div>
        <div className={`rounded-lg overflow-hidden border ${errors.location ? 'border-red-400' : ''}`}>
          <MapView
            center={[restaurant.latitude, restaurant.longitude]}
            zoom={14}
            restaurant={restaurant}
            delivery={deliveryPos ? { latitude: deliveryPos.lat, longitude: deliveryPos.lng } : null}
            onClick={handleMapClick}
            height="280px"
            showRouteNote
          />
        </div>
        {deliveryPos ? (
          <p className="text-xs text-green-600 font-medium mt-1">Delivery location set: {deliveryPos.lat.toFixed(4)}, {deliveryPos.lng.toFixed(4)}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Click on the map to set delivery location (or use current location)</p>
        )}
        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
        <div className="flex gap-3 mb-3">
          <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer flex-1 ${paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
            <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={e => setPaymentMethod(e.target.value)} className="accent-orange-500" />
            <span className="text-sm font-medium">Credit Card</span>
          </label>
          <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer flex-1 ${paymentMethod === 'cash' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
            <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={e => setPaymentMethod(e.target.value)} className="accent-orange-500" />
            <span className="text-sm font-medium">Cash on Delivery</span>
          </label>
        </div>
        {paymentMethod === 'card' && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <div>
              <label className="text-xs text-gray-600">Card Number</label>
              <input className={`border p-2 rounded w-full text-sm ${cardErrors.number ? 'border-red-400' : ''}`} placeholder="1234 5678 9012 3456" maxLength={19} value={card.number} onChange={e => setCard(p => ({ ...p, number: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim() }))} />
              {cardErrors.number && <p className="text-red-500 text-xs mt-1">{cardErrors.number}</p>}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-600">Expiry</label>
                <input className={`border p-2 rounded w-full text-sm ${cardErrors.expiry ? 'border-red-400' : ''}`} placeholder="MM/YY" maxLength={5} value={card.expiry} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setCard(p => ({ ...p, expiry: v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v })) }} />
                {cardErrors.expiry && <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>}
              </div>
              <div className="w-24">
                <label className="text-xs text-gray-600">CVV</label>
                <input className={`border p-2 rounded w-full text-sm ${cardErrors.cvv ? 'border-red-400' : ''}`} placeholder="123" maxLength={4} value={card.cvv} onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))} />
                {cardErrors.cvv && <p className="text-red-500 text-xs mt-1">{cardErrors.cvv}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400 italic">Mock payment — no real charge will be made</p>
          </div>
        )}
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

      {placing && paymentMethod === 'card' && paymentStep >= 0 && (
        <div className="mb-4 border rounded-lg p-4 bg-gray-50 text-sm" role="status" aria-live="polite">
          <div className="flex items-center gap-3 mb-2">
            <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            <span className="font-medium text-gray-700">{PAYMENT_STEPS[paymentStep]}...</span>
          </div>
          <div className="flex gap-1">
            {PAYMENT_STEPS.map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded ${i <= paymentStep ? 'bg-orange-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      )}

      <button onClick={placeOrder} disabled={placing} className="bg-orange-500 text-white p-3 rounded w-full font-medium disabled:opacity-50" aria-label="Place order">
        {placing ? (paymentMethod === 'card' ? 'Processing Payment...' : 'Placing Order...') : 'Place Order'}
      </button>
    </div>
  )
}