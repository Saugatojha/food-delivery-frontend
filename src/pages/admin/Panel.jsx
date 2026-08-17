import { useState, useEffect, useCallback } from 'react'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import TwoFactorSetup from '../../components/TwoFactorSetup'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

export default function AdminPanel() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingRest, setEditingRest] = useState(null)
  const [showAddRest, setShowAddRest] = useState(false)

  const fetchAll = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/restaurants'),
    ]).then(([u, r]) => {
      setUsers(u.data)
      setRestaurants(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

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
      <CardSkeleton />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Restaurant Management</h1>
        <button onClick={() => setShowAddRest(true)} className="bg-orange-500 text-white px-4 py-1.5 rounded text-sm font-medium">+ Add Restaurant</button>
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
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-sm text-gray-500">{r.cuisine}</p>
                <p className="text-xs text-gray-400">⭐ {r.rating} &middot; {r.deliveryTime}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                {r.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            {r.ownerId && <p className="text-xs text-gray-400 mt-1">Owner ID: {r.ownerId}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditingRest(r)} className="text-xs text-blue-600 border border-blue-600 px-2 py-1 rounded">Edit</button>
              <button onClick={() => deleteRestaurant(r.id)} className="text-xs text-red-600 border border-red-600 px-2 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
        {restaurants.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-8">No restaurants yet</p>
        )}
      </div>

      <div className="mt-8 max-w-md">
        <h2 className="text-lg font-bold mb-3">Account Security</h2>
        <TwoFactorSetup enabled={user?.twoFactorEnabled} />
      </div>
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
