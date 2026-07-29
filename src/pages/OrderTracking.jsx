import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice, MOCK_RESTAURANTS } from '../data/mock'
import { getAllOrders, STATUS_FLOWS } from '../services/orders'
import MapView from '../components/MapView'
import EmptyState from '../components/EmptyState'
import { CardSkeleton } from '../components/LoadingSkeleton'

const STEPS = STATUS_FLOWS.customer

function simulateRiderLocation(order) {
  if (order.status === 'Out for Delivery' && order.restaurant?.latitude && order.deliveryLatitude) {
    return {
      latitude: (order.restaurant.latitude + order.deliveryLatitude) / 2,
      longitude: (order.restaurant.longitude + order.deliveryLongitude) / 2,
    }
  }
  if (order.status === 'Out for Delivery' && order.restaurantLatitude && order.deliveryLatitude) {
    return {
      latitude: (order.restaurantLatitude + order.deliveryLatitude) / 2,
      longitude: (order.restaurantLongitude + order.deliveryLongitude) / 2,
    }
  }
  return null
}

export default function OrderTracking() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllOrders().then(data => {
      setOrders(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-3">
      {Array.from({ length: 2 }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  )

  if (orders.length === 0) {
    return <EmptyState icon="📋" title="No orders yet" message="Place your first order to see it here" action={<Link to="/" className="bg-orange-500 text-white px-4 py-2 rounded inline-block">Browse restaurants</Link>} />
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {[...orders].reverse().map(order => {
        const currentStep = STEPS.indexOf(order.status)
        const restaurant = order.restaurant || (order.items?.[0]?.menuItem?.restaurantId ? MOCK_RESTAURANTS.find(r => r.id === order.items[0].menuItem.restaurantId) : null)
        const restLat = restaurant?.latitude || order.restaurantLatitude || order.restaurant?.latitude
        const restLng = restaurant?.longitude || order.restaurantLongitude || order.restaurant?.longitude
        const delLat = order.deliveryLatitude
        const delLng = order.deliveryLongitude
        const hasMap = restLat && delLat
        const rider = simulateRiderLocation(order)
        return (
          <div key={order.id} className="border rounded-lg p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Order #{order.id}</p>
                {(order.items || []).map(item => (
                  <p key={item.id || item.menuItemId} className="text-sm">{item.name || item.menuItem?.name} x{item.qty || item.quantity} — {formatPrice((item.price || 0) * (item.qty || item.quantity || 1))}</p>
                ))}
                <p className="font-bold mt-2">{formatPrice(order.total)}</p>
                <p className="text-xs text-gray-500 mt-1">Deliver to: {order.address}</p>
                {order.phone && <p className="text-xs text-gray-500">Phone: {order.phone}</p>}
                <p className="text-xs text-gray-500">Payment: {order.paymentMethod}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm font-semibold text-orange-600">{order.status}</p>
                <p className="text-xs text-gray-500">ETA: {order.deliveryEta}</p>
              </div>
            </div>
            {hasMap && (
              <div className="mt-4">
                <MapView
                  restaurant={{ latitude: restLat, longitude: restLng }}
                  delivery={{ latitude: delLat, longitude: delLng }}
                  rider={rider}
                  interactive={false}
                  height="200px"
                  showRouteNote
                />
              </div>
            )}
            <div className="flex items-center gap-1 mt-4">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${i <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
              {STEPS.map(s => <span key={s} className="text-center w-12 sm:w-auto">{s}</span>)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
