import { useState, useEffect, useCallback } from 'react'
import { formatPrice } from '../../data/mock'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import api from '../../api/client'

const ROLE_COLORS = { admin: 'bg-red-100 text-red-700', owner: 'bg-blue-100 text-blue-700', rider: 'bg-green-100 text-green-700', customer: 'bg-gray-100 text-gray-700' }

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [editingRest, setEditingRest] = useState(null)
  const [showAddRest, setShowAddRest] = useState(false)

  const fetchAll = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/restaurants'),
    ]).then(([s, u, r]) => {
      setStats(s.data)
      setUsers(u.data)
      setRestaurants(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateUser = async (id, data) => {
    await api.patch(`/admin/users/${id}`, data)
    fetchAll()
    setEditingUser(null)
  }

  const saveRestaurant = async (data) => {
    if (data.id) await api.patch(`/admin/restaurants/${data.id}`, data)
    else await api.post('/admin/restaurants', data)
    fetchAll()
    setEditingRest(null)
    setShowAddRest(false)
  }

  const deleteRestaurant = async (id) => {
    if (!confirm('Delete this restaurant and all related data?')) return
    await api.delete(`/admin/restaurants/${id}`)
    fetchAll()
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
      <CardSkeleton />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Super Admin Panel</h1>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="border rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-2xl font-bold">{stats.users}</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-500">Restaurants</p>
            <p className="text-2xl font-bold">{stats.restaurants}</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-500">Orders</p>
            <p className="text-2xl font-bold">{stats.orders}</p>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <p className="text-sm text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatPrice(stats.revenue)}</p>
          </div>
        </div>
      )}

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-3">Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Role</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="border p-2">{u.name}</td>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">
                    {editingUser === u.id ? (
                      <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })} className="border rounded text-xs p-1">
                        <option value="customer">customer</option>
                        <option value="owner">owner</option>
                        <option value="rider">rider</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    )}
                  </td>
                  <td className="border p-2">
                    {editingUser === u.id ? (
                      <button onClick={() => setEditingUser(null)} className="text-xs text-gray-500">Done</button>
                    ) : (
                      <button onClick={() => setEditingUser(u.id)} className="text-xs text-orange-500">Change role</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Restaurants</h2>
          <button onClick={() => setShowAddRest(true)} className="bg-orange-500 text-white px-3 py-1 rounded text-sm">+ Add</button>
        </div>
        {showAddRest && (
          <RestaurantForm onSave={saveRestaurant} onCancel={() => setShowAddRest(false)} users={users} />
        )}
        {editingRest && (
          <RestaurantForm restaurant={editingRest} onSave={saveRestaurant} onCancel={() => setEditingRest(null)} users={users} />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {restaurants.map(r => (
            <div key={r.id} className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold">{r.name}</h3>
              <p className="text-sm text-gray-500">{r.cuisine} &middot; ⭐ {r.rating}</p>
              <span className={`text-xs font-medium ${r.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                {r.isOpen ? 'Open' : 'Closed'}
              </span>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setEditingRest(r)} className="text-xs text-blue-600">Edit</button>
                <button onClick={() => deleteRestaurant(r.id)} className="text-xs text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function RestaurantForm({ restaurant, onSave, onCancel, users }) {
  const [form, setForm] = useState({ name: restaurant?.name || '', cuisine: restaurant?.cuisine || '', rating: restaurant?.rating || 0, deliveryTime: restaurant?.deliveryTime || '25-35 min', isOpen: restaurant?.isOpen ?? true, ownerId: restaurant?.ownerId ?? '', latitude: restaurant?.latitude ?? '', longitude: restaurant?.longitude ?? '', image: restaurant?.image || '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ id: restaurant?.id, ...form, rating: Number(form.rating), ownerId: form.ownerId === '' ? null : Number(form.ownerId), latitude: form.latitude === '' ? null : Number(form.latitude), longitude: form.longitude === '' ? null : Number(form.longitude) })
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-4 bg-gray-50 grid grid-cols-2 gap-3 text-sm">
      <input className="border p-2 rounded col-span-2" placeholder="Restaurant name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
      <input className="border p-2 rounded" placeholder="Cuisine" value={form.cuisine} onChange={e => setForm(p => ({ ...p, cuisine: e.target.value }))} required />
      <input className="border p-2 rounded" placeholder="Delivery time (e.g. 25-35 min)" value={form.deliveryTime} onChange={e => setForm(p => ({ ...p, deliveryTime: e.target.value }))} />
      <input className="border p-2 rounded" type="number" step="0.1" placeholder="Rating" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))} />
      <select className="border p-2 rounded" value={form.isOpen} onChange={e => setForm(p => ({ ...p, isOpen: e.target.value === 'true' }))}>
        <option value="true">Open</option>
        <option value="false">Closed</option>
      </select>
      <select className="border p-2 rounded" value={form.ownerId} onChange={e => setForm(p => ({ ...p, ownerId: e.target.value }))}>
        <option value="">No owner</option>
        {users.filter(u => u.role === 'owner').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <input className="border p-2 rounded" placeholder="Latitude" type="number" step="any" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} />
      <input className="border p-2 rounded" placeholder="Longitude" type="number" step="any" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} />
      <input className="border p-2 rounded col-span-2" placeholder="Image URL" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} />
      <div className="col-span-2 flex gap-2">
        <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded text-sm">{restaurant ? 'Update' : 'Create'}</button>
        <button type="button" onClick={onCancel} className="border px-4 py-2 rounded text-sm">Cancel</button>
      </div>
    </form>
  )
}
