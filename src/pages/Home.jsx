import { useState } from 'react'
import { Link } from 'react-router-dom'
import { mockGetRestaurants } from '../data/mock'
import { ListSkeleton } from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'

export default function Home() {
  const [restaurants] = useState(mockGetRestaurants)
  const [loading] = useState(false)

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Restaurants</h1>
      {loading ? (
        <ListSkeleton count={6} />
      ) : restaurants.length === 0 ? (
        <EmptyState icon="🍽️" title="No restaurants available" message="Check back later" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map(r => (
            <Link
              key={r.id}
              to={r.isOpen ? `/restaurant/${r.id}` : '#'}
              className={`border rounded-lg p-4 transition hover:shadow-md ${!r.isOpen ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="text-3xl mb-2">{r.image}</div>
              <h2 className="text-lg font-semibold">{r.name}</h2>
              <p className="text-sm text-gray-500">{r.cuisine}</p>
              <div className="flex justify-between mt-3 text-sm">
                <span className="text-yellow-600">⭐ {r.rating}</span>
                <span className="text-gray-500">{r.deliveryTime}</span>
              </div>
              {!r.isOpen && <span className="text-xs text-red-500 font-medium mt-1 block">Currently closed</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
