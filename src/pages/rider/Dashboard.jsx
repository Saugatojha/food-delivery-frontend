import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../data/mock'
import EmptyState from '../../components/EmptyState'

const RIDER_FLOW = ['Ready for Pickup', 'Out for Delivery', 'Delivered']

export default function RiderDashboard() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [orders, setOrders] = useState(
    JSON.parse(localStorage.getItem('orders') || '[]').filter(
      o => o.status === 'Ready for Pickup' || o.status === 'Out for Delivery'
    )
  )

  const updateStatus = (orderId, newStatus) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const changed = { ...o, status: newStatus }
        const allOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        const idx = allOrders.findIndex(a => a.id === orderId)
        if (idx !== -1) {
          allOrders[idx] = changed
          localStorage.setItem('orders', JSON.stringify(allOrders))
        }
        return changed
      }
      return o
    })
    setOrders(updated.filter(o => o.status === 'Ready for Pickup' || o.status === 'Out for Delivery'))
    showToast(`Order #${orderId} → ${newStatus}`, 'success')
  }

  const nextStatus = (current) => {
    const idx = RIDER_FLOW.indexOf(current)
    return idx < RIDER_FLOW.length - 1 ? RIDER_FLOW[idx + 1] : null
  }

  if (orders.length === 0) {
    return <EmptyState icon="🛵" title="No deliveries available" message="Waiting for restaurants to mark orders ready" />
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Rider Dashboard</h1>
      <p className="text-sm text-gray-500 mb-4">Welcome, {user?.name}</p>
      {orders.toReversed().map(order => {
        const next = nextStatus(order.status)
        return (
          <div key={order.id} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Order #{order.id}</p>
                {order.items.map(item => (
                  <p key={item.id} className="text-sm">{item.name} x{item.qty}</p>
                ))}
                <p className="font-medium mt-1">{formatPrice(order.total)}</p>
                <p className="text-xs text-gray-500 mt-1">Deliver to: {order.address}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'Ready for Pickup' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {order.status}
                </span>
                {next && (
                  <button onClick={() => updateStatus(order.id, next)} className="block mt-2 bg-green-600 text-white px-3 py-1 rounded text-xs">
                    {next === 'Out for Delivery' ? 'Pick Up' : 'Mark Delivered'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
