import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { ListSkeleton } from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import MapView from '../components/MapView'

const CUISINES = ['All', 'Italian', 'American', 'Japanese', 'Mexican', 'Indian', 'Chinese']

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('All')
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: 12 }
    if (search.trim()) params.search = search.trim()
    if (cuisineFilter !== 'All') params.cuisine = cuisineFilter
    if (sort === 'rating') params.sort = 'rating'
    if (sort === 'delivery') params.sort = 'delivery'
    if (sort === 'open') params.open = 'true'

    api.get('/restaurants', { params }).then(({ data }) => {
      setRestaurants(data.restaurants)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [search, cuisineFilter, sort, page])

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">Restaurants</h1>
      <p className="text-sm text-gray-500 mb-4" aria-label="Delivery location">Delivering to Kathmandu, Nepal</p>

      {!loading && (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Search by name or cuisine..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border p-2 rounded flex-1 text-sm"
              aria-label="Search restaurants"
            />
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
              className="border p-2 rounded text-sm sm:w-44"
              aria-label="Sort restaurants"
            >
              <option value="">Sort</option>
              <option value="rating">Top Rated</option>
              <option value="delivery">Fastest Delivery</option>
              <option value="open">Open Now</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Cuisine filter">
            {CUISINES.map(c => (
              <button
                key={c}
                onClick={() => { setCuisineFilter(c); setPage(1) }}
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
      ) : restaurants.length === 0 ? (
        <EmptyState icon="🍽️" title={search || cuisineFilter !== 'All' ? 'No matching restaurants' : 'No restaurants available'} message="Try a different search or filter" />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3" role="status">{total} restaurant{total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map(r => (
              <Link
                key={r.id}
                to={r.isOpen ? `/restaurant/${r.id}` : '#'}
                className={`border rounded-lg p-4 hover-lift ${!r.isOpen ? 'opacity-50 pointer-events-none' : ''}`}
                aria-disabled={!r.isOpen}
              >
                <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {r.image ? (
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl" role="img" aria-label="Restaurant placeholder">🍽</span>
                  )}
                </div>
                <h2 className="text-lg font-semibold">{r.name}</h2>
                <p className="text-sm text-gray-500">{r.cuisine}</p>
                <div className="flex justify-between mt-3 text-sm">
                  <span className="text-yellow-600" aria-label={`Rating ${r.rating} out of 5`}>&#9733; {r.rating}</span>
                  <span className="text-gray-500">{r.deliveryTime}</span>
                </div>
                {!r.isOpen && <span className="text-xs text-red-500 font-medium mt-1 block">Currently closed</span>}
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="flex justify-center items-center gap-2 mt-6" aria-label="Pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="border px-3 py-1 rounded text-sm disabled:opacity-40" aria-label="Previous page">Prev</button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="border px-3 py-1 rounded text-sm disabled:opacity-40" aria-label="Next page">Next</button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}