import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Cart() {
  const [cart, setCart] = useState([])

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
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0)

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Cart is empty</h1>
        <Link to="/" className="text-orange-500">Browse restaurants</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {cart.map(item => (
        <div key={item.id} className="border rounded-lg p-4 mb-3 flex justify-between items-center">
          <div>
            <h2 className="font-semibold">{item.name}</h2>
            <p className="text-sm text-gray-500">{item.restaurantName}</p>
            <p>Rs. {(item.price * item.qty).toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => updateQty(item.id, -1)} className="bg-gray-200 px-2 rounded">-</button>
            <span>{item.qty}</span>
            <button onClick={() => updateQty(item.id, 1)} className="bg-gray-200 px-2 rounded">+</button>
            <button onClick={() => remove(item.id)} className="bg-red-500 text-white px-3 py-1 rounded ml-2">Remove</button>
          </div>
        </div>
      ))}
      <div className="text-xl font-bold mt-4">Total: Rs. {total.toFixed(2)}</div>
      <Link to="/checkout" className="block text-center bg-orange-500 text-white p-3 rounded mt-4">Proceed to Checkout</Link>
    </div>
  )
}
