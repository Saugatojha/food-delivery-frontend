import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/mock'
import { getAllOrders, STATUS_FLOWS, getNextStatus } from '../services/orders'
import EmptyState from '../components/EmptyState'

const STEPS = STATUS_FLOWS.customer

export default function OrderTracking() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    setOrders(getAllOrders())
  }, [])

  if (orders.length === 0) {
    return <EmptyState icon="📋" title="No orders yet" message="Place your first order to see it here" action={<Link to="/" className="bg-orange-500 text-white px-4 py-2 rounded inline-block">Browse restaurants</Link>} />
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.toReversed().map(order => {
        const currentStep = STEPS.indexOf(order.status)
        return (
          <div key={order.id} className="border rounded-lg p-4 sm:p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Order #{order.id}</p>
                {order.items.map(item => (
                  <p key={item.id} className="text-sm">{item.name} x{item.qty} — {formatPrice(item.price * item.qty)}</p>
                ))}
                <p className="font-bold mt-2">{formatPrice(order.total)}</p>
                <p className="text-xs text-gray-500 mt-1">Deliver to: {order.address}</p>
                <p className="text-xs text-gray-500">Payment: {order.paymentMethod}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-sm font-semibold text-orange-600">{order.status}</p>
                <p className="text-xs text-gray-500">ETA: {order.deliveryEta}</p>
              </div>
            </div>
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
