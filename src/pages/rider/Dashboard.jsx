import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice, MOCK_RESTAURANTS } from '../../data/mock'
import {
  getAvailableDeliveries,
  updateOrderStatus,
  STATUS_FLOWS,
  getNextStatus,
  isValidTransition,
} from '../../services/orders'
import MapView from '../../components/MapView'
import EmptyState from '../../components/EmptyState'
import { CardSkeleton } from '../../components/LoadingSkeleton'

const FLOW = STATUS_FLOWS.rider

export default function RiderDashboard() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [riderLocation, setRiderLocation] = useState(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    getAvailableDeliveries().then(data => {
      setOrders(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const advanceOrder = async (order) => {
    const next = getNextStatus(order.status, FLOW)
    if (!next) return
    if (!isValidTransition(order.status, next, FLOW)) {
      return showToast('Invalid status transition', 'error')
    }
    try {
      await updateOrderStatus(order.id, next)
      const updated = await getAvailableDeliveries()
      setOrders(updated)
      showToast(`Order #${order.id} → ${next}`, 'success')
    } catch {
      showToast('Failed to update order', 'error')
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return showToast('Geolocation not supported', 'error')
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRiderLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLocating(false)
        showToast('Location updated', 'success')
      },
      () => {
        setLocating(false)
        showToast('Could not get location', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-3">
      {Array.from({ length: 2 }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  )

  if (orders.length === 0) {
    return <EmptyState icon="🛵" title="No deliveries available" message="Waiting for restaurants to mark orders ready" />
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rider Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
        </div>
        <button onClick={useCurrentLocation} disabled={locating} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50">
          {locating ? 'Locating...' : 'Use my current location'}
        </button>
      </div>
      {[...orders].reverse().map(order => {
        const next = getNextStatus(order.status, FLOW)
        const restaurant = order.restaurant || MOCK_RESTAURANTS.find(r => r.id === order.restaurantId)
        const hasMap = restaurant?.latitude
        return (
          <div key={order.id} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Order #{order.id}</p>
                {(order.items || []).map(item => (
                  <p key={item.id || item.menuItemId} className="text-sm">{item.name || item.menuItem?.name} x{item.qty || item.quantity}</p>
                ))}
                <p className="font-medium mt-1">{formatPrice(order.total)}</p>
                <p className="text-xs text-gray-500 mt-1">Deliver to: {order.address}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'Ready for Pickup' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.status}
                </span>
                {next && (
                  <button onClick={() => advanceOrder(order)} className="block mt-2 bg-green-600 text-white px-3 py-1 rounded text-xs">
                    {next === 'Out for Delivery' ? 'Pick Up' : 'Mark Delivered'}
                  </button>
                )}
              </div>
            </div>
            {hasMap && (
              <div className="mt-3">
                <MapView
                  restaurant={restaurant}
                  delivery={order.deliveryLatitude ? { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude } : null}
                  rider={riderLocation}
                  interactive={false}
                  height="180px"
                  showRouteNote
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
