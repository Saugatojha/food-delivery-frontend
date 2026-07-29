import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { ListSkeleton } from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('')

  useEffect(() => {
    api.get('/restaurants').then(({ data }) => {
      setRestaurants(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cuisines = useMemo(() => [...new Set(restaurants.map(r => r.cuisine))].sort(), [restaurants])

  const filtered = useMemo(() => {
    let list = restaurants
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q))
    }
    if (cuisineFilter) list = list.filter(r => r.cuisine === cuisineFilter)
    return list
  }, [restaurants, search, cuisineFilter])

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Restaurants</h1>
      {!loading && (
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            placeholder="Search by name or cuisine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border p-2 rounded flex-1 text-sm"
          />
          <select
            value={cuisineFilter}
            onChange={e => setCuisineFilter(e.target.value)}
            className="border p-2 rounded text-sm sm:w-44"
          >
            <option value="">All cuisines</option>
            {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
      {loading ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🍽️" title={search || cuisineFilter ? 'No matching restaurants' : 'No restaurants available'} message="Try a different search or filter" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <Link
              key={r.id}
              to={r.isOpen ? `/restaurant/${r.id}` : '#'}
              className={`border rounded-lg p-4 transition hover:shadow-md ${!r.isOpen ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="text-3xl mb-2">{r.image || '🍽'}</div>
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
