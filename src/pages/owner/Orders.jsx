import { useState, useEffect } from 'react'
import { formatPrice } from '../../data/mock'
import { useToast } from '../../context/ToastContext'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import {
  updateOwnerOrderStatus,
  autoAssignRider,
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
  const [assigningId, setAssigningId] = useState(null)

  useEffect(() => {
    api.get('/owner/orders').then(({ data }) => {
      setOrders(data)
      if (data.length > 0) setRestaurant(data[0].restaurant || { name: 'Your Restaurant' })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const refreshOrders = async () => {
    const { data } = await api.get('/owner/orders')
    setOrders(data)
  }

  const changeStatus = async (orderId, status) => {
    try {
      await updateOwnerOrderStatus(orderId, status)
      await refreshOrders()
      showToast(`Order #${orderId} → ${status}`, 'success')

      if (status === 'Confirmed') {
        setAssigningId(orderId)
        try {
          const result = await autoAssignRider(orderId)
          await refreshOrders()
          if (result?.rider) {
            showToast(`Rider ${result.rider.name || 'assigned'} for Order #${orderId}`, 'success')
          } else {
            showToast('No riders available. Assign manually later.', 'error')
          }
        } catch {
          showToast('Could not auto-assign rider. Assign manually later.', 'error')
        } finally {
          setAssigningId(null)
        }
      }
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
                {order.phone && <p className="text-xs text-gray-500">Phone: {order.phone}</p>}
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'Ready for Pickup' ? 'bg-green-100 text-green-700' : order.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {order.status}
                </span>
                {order.rider && (
                  <p className="text-xs text-gray-500 mt-1">
                    Rider: {order.rider.name || order.rider.email || `#${order.rider.id}`}
                  </p>
                )}
                {assigningId === order.id && (
                  <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Assigning rider...
                  </p>
                )}
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
