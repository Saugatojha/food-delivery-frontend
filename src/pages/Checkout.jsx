import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Checkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [placing, setPlacing] = useState(false)

  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0)

  const placeOrder = () => {
    if (!address) return alert('Enter delivery address')
    setPlacing(true)
    setTimeout(() => {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]')
      const order = {
        id: Date.now(),
        items: cart,
        total,
        address,
        paymentMethod,
        status: 'Preparing',
        deliveryEta: '30-40 min',
        date: new Date().toISOString(),
      }
      orders.push(order)
      localStorage.setItem('orders', JSON.stringify(orders))
      localStorage.setItem('cart', '[]')
      alert('Order placed! (Mock payment processed)')
      navigate('/orders')
    }, 1500)
  }

  if (cart.length === 0) {
    navigate('/')
    return null
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Delivery Address</h2>
        <textarea className="border p-2 rounded w-full" rows="3" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your address" />
      </div>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Payment Method</h2>
        <select className="border p-2 rounded" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="card">Credit Card (Mock)</option>
          <option value="cash">Cash on Delivery</option>
        </select>
      </div>
      <div className="border rounded-lg p-4 mb-4">
        <h2 className="font-semibold mb-2">Order Summary</h2>
        {cart.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.name} x{item.qty}</span>
            <span>Rs. {(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="font-bold text-lg mt-2 border-t pt-2">Total: Rs. {total.toFixed(2)}</div>
      </div>
      <button onClick={placeOrder} disabled={placing} className="bg-orange-500 text-white p-3 rounded w-full">
        {placing ? 'Placing Order...' : 'Place Order'}
      </button>
    </div>
  )
}
