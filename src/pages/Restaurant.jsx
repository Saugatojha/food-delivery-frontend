import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatPrice } from '../data/mock'
import { getCart, saveCart } from '../services/orders'
import api from '../api/client'
import EmptyState from '../components/EmptyState'
import MapView from '../components/MapView'

export default function Restaurant() {
  const { id } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/restaurants/${id}/menu`).then(({ data }) => {
      setData(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const addToCart = (item) => {
    if (!user) return showToast('Please login first', 'error')
    const cart = getCart()
    const existing = cart.find(c => c.id === item.id && c.restaurantId === Number(id))
    if (existing) {
      existing.qty += 1
    } else {
      cart.push({ ...item, restaurantId: Number(id), restaurantName: data.restaurant.name, qty: 1 })
    }
    saveCart(cart)
    showToast(`${item.name} added to cart`, 'success')
  }

  if (loading) return <div className="max-w-3xl mx-auto p-6 text-center text-gray-500">Loading...</div>

  if (!data || !data.restaurant) {
    return <EmptyState icon="🔍" title="Restaurant not found" message={<Link to="/" className="text-orange-500">Go back</Link>} />
  }

  const { restaurant, items } = data

  if (!restaurant.isOpen) {
    return <EmptyState icon="🔒" title="Restaurant is closed" message="This restaurant is not accepting orders right now." action={<Link to="/" className="text-orange-500 font-medium">Browse other restaurants</Link>} />
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <Link to="/" className="text-sm text-orange-500">&larr; Back to restaurants</Link>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">{restaurant.name}</h1>
        <p className="text-gray-500">{restaurant.cuisine} &middot; {restaurant.deliveryTime}</p>
      </div>
      <div className="mb-6">
        <MapView restaurant={restaurant} height="220px" interactive={false} />
      </div>
      <div className="grid gap-3">
        {items.map(item => (
          <div key={item.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{item.name}</h3>
              {item.desc && <p className="text-sm text-gray-500">{item.desc}</p>}
              <p className="text-orange-600 font-medium mt-1">{formatPrice(item.price)}</p>
            </div>
            <button onClick={() => addToCart(item)} className="bg-orange-500 text-white px-4 py-2 rounded text-sm whitespace-nowrap">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
