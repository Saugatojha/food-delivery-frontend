import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { formatPrice, calcTotal } from '../data/mock'
import EmptyState from '../components/EmptyState'

export default function Cart() {
  const [cart, setCart] = useState([])
  const { showToast } = useToast()

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'))
  }, [])

  const updateQty = (id, delta) => {
    const updated = cart.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const remove = (id) => {
    const updated = cart.filter(c => c.id !== id)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    showToast('Item removed', 'info')
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
          <div>
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.restaurantName}</p>
            <p className="font-medium text-orange-600">{formatPrice(item.price * item.qty)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => updateQty(item.id, -1)} className="border px-2 py-1 rounded hover:bg-gray-100">-</button>
            <span className="w-6 text-center">{item.qty}</span>
            <button onClick={() => updateQty(item.id, 1)} className="border px-2 py-1 rounded hover:bg-gray-100">+</button>
            <button onClick={() => remove(item.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm ml-2">Remove</button>
          </div>
        </div>
      ))}
      <div className="text-xl font-bold mt-4">Total: {formatPrice(total)}</div>
      <Link to="/checkout" className="block text-center bg-orange-500 text-white p-3 rounded mt-4 font-medium">
        Proceed to Checkout
      </Link>
    </div>
  )
}
