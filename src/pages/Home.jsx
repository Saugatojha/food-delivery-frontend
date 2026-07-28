import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const MOCK_RESTAURANTS = [
  { id: 1, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.5, deliveryTime: '25-35 min' },
  { id: 2, name: 'Burger Barn', cuisine: 'American', rating: 4.2, deliveryTime: '20-30 min' },
  { id: 3, name: 'Sushi Spot', cuisine: 'Japanese', rating: 4.7, deliveryTime: '30-40 min' },
  { id: 4, name: 'Taco Town', cuisine: 'Mexican', rating: 4.3, deliveryTime: '15-25 min' },
  { id: 5, name: 'Curry House', cuisine: 'Indian', rating: 4.6, deliveryTime: '25-35 min' },
  { id: 6, name: 'Noodle Nest', cuisine: 'Chinese', rating: 4.1, deliveryTime: '20-30 min' },
]

export default function Home() {
  const [restaurants, setRestaurants] = useState(MOCK_RESTAURANTS)

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Restaurants</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map(r => (
          <Link key={r.id} to={`/restaurant/${r.id}`} className="border rounded-lg p-4 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold">{r.name}</h2>
            <p className="text-gray-600">{r.cuisine}</p>
            <div className="flex justify-between mt-2 text-sm">
              <span>⭐ {r.rating}</span>
              <span>{r.deliveryTime}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
