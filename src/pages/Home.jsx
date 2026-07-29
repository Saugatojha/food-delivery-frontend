import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { ListSkeleton } from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import MapView from '../components/MapView'

const CUISINES = ['All', 'Italian', 'American', 'Japanese', 'Mexican', 'Indian', 'Chinese']

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('All')
  const [sort, setSort] = useState('')

  useEffect(() => {
    api.get('/restaurants').then(({ data }) => {
      setRestaurants(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const processed = useMemo(() => {
    let list = restaurants

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q))
    }

    if (cuisineFilter !== 'All') {
      list = list.filter(r => r.cuisine === cuisineFilter)
    }

    if (sort === 'rating') {
      list = [...list].sort((a, b) => b.rating - a.rating)
    } else if (sort === 'delivery') {
      list = [...list].sort((a, b) => {
        const aMin = parseInt(a.deliveryTime)
        const bMin = parseInt(b.deliveryTime)
        return aMin - bMin
      })
    } else if (sort === 'open') {
      list = list.filter(r => r.isOpen)
    }

    return list
  }, [restaurants, search, cuisineFilter, sort])

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Restaurants</h1>
      <p className="text-sm text-gray-500 mb-4">Delivering to Kathmandu, Nepal</p>

      {!loading && (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Search by name or cuisine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border p-2 rounded flex-1 text-sm"
            aria-label="Search restaurants"
            />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="border p-2 rounded text-sm sm:w-44"
            >
              <option value="">Sort</option>
              <option value="rating">Top Rated</option>
              <option value="delivery">Fastest Delivery</option>
              <option value="open">Open Now</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {CUISINES.map(c => (
              <button
                key={c}
                onClick={() => setCuisineFilter(c)}
                aria-pressed={cuisineFilter === c}
                aria-label={`Filter by ${c} cuisine`}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${cuisineFilter === c ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400'}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <MapView
              restaurants={restaurants}
              height="320px"
              interactive
            />
          </div>
        </>
      )}

      {loading ? (
        <ListSkeleton count={6} />
      ) : processed.length === 0 ? (
        <EmptyState icon="🍽️" title={search || cuisineFilter !== 'All' ? 'No matching restaurants' : 'No restaurants available'} message="Try a different search or filter" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processed.map(r => (
            <Link
              key={r.id}
              to={r.isOpen ? `/restaurant/${r.id}` : '#'}
              className={`border rounded-lg p-4 hover-lift ${!r.isOpen ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {r.image ? (
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🍽</span>
                )}
              </div>
              <h2 className="text-lg font-semibold">{r.name}</h2>
              <p className="text-sm text-gray-500">{r.cuisine}</p>
              <div className="flex justify-between mt-3 text-sm">
                <span className="text-yellow-600">&#9733; {r.rating}</span>
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