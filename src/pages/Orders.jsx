import { useState, useEffect } from 'react'

const STATUSES = ['Preparing', 'Out for Delivery', 'Delivered']

export default function Orders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    setOrders(JSON.parse(localStorage.getItem('orders') || '[]'))
  }, [])

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">No orders yet</h1>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {orders.toReversed().map(order => (
        <div key={order.id} className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Order #{order.id}</p>
              {order.items.map(item => (
                <p key={item.id}>{item.name} x{item.qty} - Rs. {(item.price * item.qty).toFixed(2)}</p>
              ))}
              <p className="font-bold mt-1">Total: Rs. {order.total.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Deliver to: {order.address}</p>
              <p className="text-sm text-gray-500">Payment: {order.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{order.status}</p>
              <p className="text-xs text-gray-500">ETA: {order.deliveryEta}</p>
              <div className="flex gap-1 mt-2">
                {STATUSES.map((s, i) => (
                  <div key={s} className={`w-3 h-3 rounded-full ${STATUSES.indexOf(order.status) >= i ? 'bg-green-500' : 'bg-gray-300'}`} title={s} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
