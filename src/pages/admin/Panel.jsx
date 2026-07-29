import { useState, useEffect } from 'react'
import { MOCK_USERS, MOCK_RESTAURANTS, formatPrice } from '../../data/mock'

export default function AdminPanel() {
  const [orders] = useState(JSON.parse(localStorage.getItem('orders') || '[]'))
  const users = MOCK_USERS
  const restaurants = MOCK_RESTAURANTS
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">Restaurants</p>
          <p className="text-2xl font-bold">{restaurants.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-3">Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="border p-2">{u.name}</td>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'owner' ? 'bg-blue-100 text-blue-700' : u.role === 'rider' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-3">Restaurants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {restaurants.map(r => (
            <div key={r.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{r.name}</h3>
              <p className="text-sm text-gray-500">{r.cuisine} &middot; ⭐ {r.rating}</p>
              <span className={`text-xs font-medium ${r.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                {r.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
