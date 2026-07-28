import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MENUS = {
  1: [{ id: 101, name: 'Margherita Pizza', price: 169 }, { id: 102, name: 'Pepperoni Pizza', price: 195 }, { id: 103, name: 'Garlic Bread', price: 78 }],
  2: [{ id: 201, name: 'Classic Burger', price: 130 }, { id: 202, name: 'Cheese Burger', price: 143 }, { id: 203, name: 'Fries', price: 52 }],
  3: [{ id: 301, name: 'California Roll', price: 117 }, { id: 302, name: 'Salmon Roll', price: 143 }, { id: 303, name: 'Edamame', price: 65 }],
  4: [{ id: 401, name: 'Beef Taco', price: 52 }, { id: 402, name: 'Chicken Quesadilla', price: 104 }, { id: 403, name: 'Guacamole', price: 65 }],
  5: [{ id: 501, name: 'Butter Chicken', price: 182 }, { id: 502, name: 'Naan Bread', price: 39 }, { id: 503, name: 'Biryani', price: 156 }],
  6: [{ id: 601, name: 'Lo Mein', price: 117 }, { id: 602, name: 'Fried Rice', price: 104 }, { id: 603, name: 'Spring Rolls', price: 65 }],
}

const RESTAURANTS = {
  1: 'Pizza Palace', 2: 'Burger Barn', 3: 'Sushi Spot',
  4: 'Taco Town', 5: 'Curry House', 6: 'Noodle Nest',
}

export default function Restaurant() {
  const { id } = useParams()
  const { user } = useAuth()
  const items = MENUS[id] || []
  const name = RESTAURANTS[id] || 'Restaurant'

  const addToCart = (item) => {
    if (!user) return alert('Please login first')
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(c => c.id === item.id && c.restaurantId === Number(id))
    if (existing) {
      existing.qty += 1
    } else {
      cart.push({ ...item, restaurantId: Number(id), restaurantName: name, qty: 1 })
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    alert(`${item.name} added to cart`)
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{name}</h1>
      <div className="grid gap-4">
        {items.map(item => (
          <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">{item.name}</h2>
              <p className="text-gray-600">Rs. {item.price.toFixed(2)}</p>
            </div>
            <button onClick={() => addToCart(item)} className="bg-orange-500 text-white px-4 py-2 rounded">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
