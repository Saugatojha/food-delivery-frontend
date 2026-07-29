import { useState, useEffect } from 'react'
import { formatPrice } from '../../data/mock'
import { useToast } from '../../context/ToastContext'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import {
  updateOrderStatus,
  STATUS_FLOWS,
  getNextStatus,
} from '../../services/orders'
import api from '../../api/client'

const FLOW = STATUS_FLOWS.owner

export default function OwnerOrders() {
  const { showToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState(null)

  useEffect(() => {
    api.get('/owner/orders').then(({ data }) => {
      setOrders(data)
      if (data.length > 0) setRestaurant(data[0].restaurant || { name: 'Your Restaurant' })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const changeStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      const { data } = await api.get('/owner/orders')
      setOrders(data)
      showToast(`Order #${orderId} → ${status}`, 'success')
    } catch {
      showToast('Failed to update order', 'error')
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-3">
      {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  )

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
      <h1 className="text-2xl font-bold mb-6">Orders — {restaurant?.name || 'Your Restaurant'}</h1>
      {[...orders].reverse().map(order => {
        const next = getNextStatus(order.status, FLOW)
        return (
          <div key={order.id} className="border rounded-lg p-4 mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Order #{order.id}</p>
                {(order.items || []).map(item => (
                  <p key={item.id || item.menuItemId} className="text-sm">{item.name || item.menuItem?.name} x{item.qty || item.quantity} — {formatPrice((item.price || 0) * (item.qty || item.quantity || 1))}</p>
                ))}
                <p className="font-medium mt-1">{formatPrice(order.total)}</p>
                <p className="text-xs text-gray-500 mt-1">{order.address}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'Ready for Pickup' ? 'bg-green-100 text-green-700' : order.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {order.status}
                </span>
                {order.status === 'Pending' ? (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => changeStatus(order.id, 'Confirmed')} className="bg-green-600 text-white px-3 py-1 rounded text-xs">
                      Accept
                    </button>
                    <button onClick={() => changeStatus(order.id, 'Rejected')} className="bg-red-500 text-white px-3 py-1 rounded text-xs">
                      Reject
                    </button>
                  </div>
                ) : next ? (
                  <button onClick={() => changeStatus(order.id, next)} className="block mt-2 bg-orange-500 text-white px-3 py-1 rounded text-xs">
                    Mark {next}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
