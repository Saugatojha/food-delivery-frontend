import { useState, useEffect } from 'react'
import { formatPrice } from '../../data/mock'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import api from '../../api/client'

export default function OwnerDashboard() {
  const [restaurant, setRestaurant] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/owner/orders').then(({ data }) => {
      setOrders(data)
      if (data.length > 0) setRestaurant(data[0].restaurant || { name: 'Your Restaurant' })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed')

  if (loading) return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="space-y-3">{Array.from({ length: 2 }, (_, i) => <CardSkeleton key={i} />)}</div>
    </div>
  )

  if (!restaurant && orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-xl font-bold">No restaurant linked to your account</h2>
        <p className="text-gray-500 mt-2">Contact admin to get assigned.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard — {restaurant?.name || 'Your Restaurant'}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(orders.reduce((s, o) => s + o.total, 0))}</p>
        </div>
      </div>

      <h2 className="font-semibold text-lg mb-3">Pending Orders</h2>
      {pendingOrders.length === 0 ? (
        <p className="text-gray-500">No pending orders</p>
      ) : (
        pendingOrders.map(order => (
          <div key={order.id} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Order #{order.id}</p>
                {(order.items || []).map(item => (
                  <p key={item.id || item.menuItemId} className="text-sm">{item.name || item.menuItem?.name} x{item.qty || item.quantity}</p>
                ))}
                <p className="font-medium mt-1">{formatPrice(order.total)}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                {order.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
