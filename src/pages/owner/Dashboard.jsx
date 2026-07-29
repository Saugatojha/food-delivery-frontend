import { useAuth } from '../../context/AuthContext'
import { MOCK_RESTAURANTS, formatPrice } from '../../data/mock'
import { getOrdersForRestaurant } from '../../services/orders'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const restaurant = MOCK_RESTAURANTS.find(r => r.ownerId === user.id)
  const orders = restaurant ? getOrdersForRestaurant(restaurant.id) : []
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed')

  if (!restaurant) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h2 className="text-xl font-bold">No restaurant linked to your account</h2>
        <p className="text-gray-500 mt-2">Contact admin to get assigned.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard — {restaurant.name}</h1>
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
                {order.items.map(item => (
                  <p key={item.id} className="text-sm">{item.name} x{item.qty}</p>
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
