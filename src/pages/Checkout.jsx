import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { formatPrice, calcTotal } from '../data/mock'

export default function Checkout() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [placing, setPlacing] = useState(false)

  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  const total = calcTotal(cart)

  const placeOrder = () => {
    if (!address.trim()) return showToast('Enter a delivery address', 'error')
    setPlacing(true)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      const order = {
        id: Date.now(),
        items: [...cart],
        total,
        address: address.trim(),
        paymentMethod,
        status: 'Pending',
        deliveryEta: '30-40 min',
        date: new Date().toISOString(),
      }
      orders.push(order)
      localStorage.setItem('orders', JSON.stringify(orders))
      localStorage.setItem('cart', '[]')
      showToast('Order placed successfully!', 'success')
      navigate('/orders')
    }, 1500)
  }

  if (cart.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
        <textarea className="border p-2 rounded w-full" rows="3" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your full address" />
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
