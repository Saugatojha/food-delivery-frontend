import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MOCK_RESTAURANTS, formatPrice } from '../../data/mock'
import { useToast } from '../../context/ToastContext'

const STATUS_FLOW = ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup']

export default function OwnerOrders() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const restaurant = MOCK_RESTAURANTS.find(r => r.ownerId === user.id)
  const [orders, setOrders] = useState(
    JSON.parse(localStorage.getItem('orders') || '[]').filter(o =>
      o.items.some(i => i.restaurantId === restaurant?.id)
    )
  )

  if (!restaurant) {
    return <div className="max-w-3xl mx-auto p-6 text-center text-gray-500">No restaurant linked.</div>
  }

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
    setOrders(updated)
    showToast(`Order #${orderId} → ${newStatus}`, 'success')
  }

  const nextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current)
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">No orders received</h1>
        <p className="text-gray-500">Orders will appear here when customers place them.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Orders — {restaurant.name}</h1>
      {orders.toReversed().map(order => {
        const next = nextStatus(order.status)
        return (
          <div key={order.id} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Order #{order.id}</p>
                {order.items.map(item => (
                  <p key={item.id} className="text-sm">{item.name} x{item.qty} — {formatPrice(item.price * item.qty)}</p>
                ))}
                <p className="font-medium mt-1">{formatPrice(order.total)}</p>
                <p className="text-xs text-gray-500 mt-1">{order.address}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'Ready for Pickup' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {order.status}
                </span>
                {next && (
                  <button onClick={() => updateStatus(order.id, next)} className="block mt-2 bg-orange-500 text-white px-3 py-1 rounded text-xs">
                    Mark {next}
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
