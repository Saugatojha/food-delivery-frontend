import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice, CUISINE_CATEGORIES } from '../../data/mock'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import api from '../../api/client'
import { updateOwnerOrderStatus } from '../../services/orders'

function playNotification() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch { }
}

export default function OwnerDashboard() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tab, setTab] = useState('orders')
  const [restaurant, setRestaurant] = useState(null)
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [settingsForm, setSettingsForm] = useState({})
  const [editingSettings, setEditingSettings] = useState(false)

  const [newItem, setNewItem] = useState({ name: '', category: '', price: '', desc: '' })
  const [editingItem, setEditingItem] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const orderCountRef = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const [r, o, m] = await Promise.all([
        api.get('/owner/restaurant'),
        api.get('/owner/orders'),
        api.get('/owner/menu'),
      ])
      setRestaurant(r.data)
      setOrders(o.data)
      setMenuItems(m.data)
      if (o.data.length > orderCountRef[0]) {
        playNotification()
      }
      orderCountRef[0] = o.data.length
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    if (restaurant) {
      setSettingsForm({
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        deliveryTime: restaurant.deliveryTime,
        isOpen: restaurant.isOpen,
        image: restaurant.image || '',
      })
    }
  }, [restaurant])

  const saveSettings = async (e) => {
    e.preventDefault()
    await api.patch('/owner/restaurant', settingsForm)
    setEditingSettings(false)
    showToast('Restaurant updated', 'success')
    fetchData()
  }

  const handleOrderStatus = async (orderId, status) => {
    try {
      await updateOwnerOrderStatus(orderId, status)
      showToast(`Order #${orderId} ${status === 'Confirmed' ? 'accepted' : status}`, 'success')
      setConfirmAction(null)
      fetchData()
    } catch {
      showToast('Failed to update order', 'error')
    }
  }

  const addMenuItem = async (e) => {
    e.preventDefault()
    if (!newItem.name || !newItem.price) return
    try {
      await api.post('/owner/menu', {
        name: newItem.name,
        category: newItem.category || 'General',
        price: Number(newItem.price),
        desc: newItem.desc,
      })
      setNewItem({ name: '', category: '', price: '', desc: '' })
      showToast('Menu item added', 'success')
      fetchData()
    } catch {
      showToast('Failed to add item', 'error')
    }
  }

  const updateMenuItem = async (e) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await api.patch(`/owner/menu/${editingItem.id}`, {
        name: editingItem.name,
        category: editingItem.category,
        price: Number(editingItem.price),
        desc: editingItem.desc,
      })
      setEditingItem(null)
      showToast('Menu item updated', 'success')
      fetchData()
    } catch {
      showToast('Failed to update item', 'error')
    }
  }

  const deleteMenuItem = async (id) => {
    try {
      await api.delete(`/owner/menu/${id}`)
      showToast('Menu item deleted', 'success')
      setConfirmAction(null)
      fetchData()
    } catch {
      showToast('Failed to delete item', 'error')
    }
  }

  const categories = CUISINE_CATEGORIES[restaurant?.cuisine] || ['General']

  const pendingOrders = orders.filter(o => o.status === 'Pending')
  const activeOrders = orders.filter(o => ['Confirmed', 'Preparing'].includes(o.status))
  const completedOrders = orders.filter(o => ['Ready for Pickup', 'Out for Delivery', 'Delivered'].includes(o.status))

  if (loading) return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <CardSkeleton />
      <div className="mt-4 space-y-3">{Array.from({ length: 2 }, (_, i) => <CardSkeleton key={i} />)}</div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{restaurant?.name || 'Owner Dashboard'}</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['orders', 'menu', 'settings'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-sm font-medium capitalize ${tab === t ? 'bg-white shadow text-orange-600' : 'text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'orders' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4 bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
            </div>
            <div className="border rounded-lg p-4 bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-blue-600">{activeOrders.length}</p>
            </div>
            <div className="border rounded-lg p-4 bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
            </div>
          </div>

          <h2 className="font-semibold text-lg mb-3">Pending Orders</h2>
          {pendingOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending orders</p>
          ) : (
            pendingOrders.map(order => (
              <div key={order.id} className="border rounded-lg p-4 mb-3 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Order #{order.id}</p>
                    {(order.items || []).map(item => (
                      <p key={item.id || item.menuItemId} className="text-sm">{item.name || item.menuItem?.name} x{item.qty || item.quantity}</p>
                    ))}
                    <p className="font-bold mt-1 text-orange-600">{formatPrice(order.total)}</p>
                    <p className="text-xs text-gray-400">{order.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmAction({ type: 'accept', order })}
                      className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700">
                      Accept
                    </button>
                    <button onClick={() => setConfirmAction({ type: 'reject', order })}
                      className="bg-red-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-red-600">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {activeOrders.length > 0 && (
            <>
              <h2 className="font-semibold text-lg mb-3 mt-6">Active Orders</h2>
              {activeOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-4 mb-3 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.id}</p>
                      {(order.items || []).map(item => (
                        <p key={item.id || item.menuItemId} className="text-sm">{item.name || item.menuItem?.name} x{item.qty || item.quantity}</p>
                      ))}
                      <p className="font-bold mt-1 text-orange-600">{formatPrice(order.total)}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">{order.status}</span>
                      {order.status === 'Confirmed' && (
                        <button onClick={() => handleOrderStatus(order.id, 'Preparing')}
                          className="block mt-2 bg-orange-500 text-white px-3 py-1 rounded text-xs font-medium">
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'Preparing' && (
                        <button onClick={() => handleOrderStatus(order.id, 'Ready for Pickup')}
                          className="block mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium">
                          Mark Ready
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-lg mb-3">Menu Items</h2>
            {categories.map(cat => {
              const items = menuItems.filter(i => i.category === cat)
              if (items.length === 0) return null
              return (
                <div key={cat} className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</h3>
                  {items.map(item => (
                    <div key={item.id} className="border rounded-lg p-3 mb-2 bg-white flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                        <p className="text-sm font-bold text-orange-600">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingItem(item)}
                          className="text-blue-600 text-sm hover:underline">Edit</button>
                        <button onClick={() => setConfirmAction({ type: 'delete', itemId: item.id, itemName: item.name })}
                          className="text-red-500 text-sm hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
            {menuItems.length === 0 && <p className="text-gray-400 text-center py-8">No menu items yet</p>}
          </div>

          <div>
            {editingItem ? (
              <form onSubmit={updateMenuItem} className="border rounded-lg p-4 bg-white sticky top-4">
                <h3 className="font-semibold mb-3">Edit Item</h3>
                <input className="border p-2 rounded w-full mb-2 text-sm" placeholder="Name"
                  value={editingItem.name} onChange={e => setEditingItem(p => ({ ...p, name: e.target.value }))} required />
                <select className="border p-2 rounded w-full mb-2 text-sm"
                  value={editingItem.category} onChange={e => setEditingItem(p => ({ ...p, category: e.target.value }))}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="border p-2 rounded w-full mb-2 text-sm" type="number" step="0.01" placeholder="Price (NPR)"
                  value={editingItem.price} onChange={e => setEditingItem(p => ({ ...p, price: e.target.value }))} required />
                <textarea className="border p-2 rounded w-full mb-2 text-sm" placeholder="Description"
                  value={editingItem.desc || ''} onChange={e => setEditingItem(p => ({ ...p, desc: e.target.value }))} />
                <div className="flex gap-2">
                  <button type="submit" className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm">Save</button>
                  <button type="button" onClick={() => setEditingItem(null)}
                    className="border px-3 py-1.5 rounded text-sm">Cancel</button>
                </div>
              </form>
            ) : (
              <form onSubmit={addMenuItem} className="border rounded-lg p-4 bg-white sticky top-4">
                <h3 className="font-semibold mb-3">Add Menu Item</h3>
                <input className="border p-2 rounded w-full mb-2 text-sm" placeholder="Item name"
                  value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} required />
                <select className="border p-2 rounded w-full mb-2 text-sm"
                  value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className="border p-2 rounded w-full mb-2 text-sm" type="number" step="0.01" placeholder="Price (NPR)"
                  value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} required />
                <textarea className="border p-2 rounded w-full mb-2 text-sm" placeholder="Description (optional)"
                  value={newItem.desc} onChange={e => setNewItem(p => ({ ...p, desc: e.target.value }))} />
                <button type="submit" className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm">Add Item</button>
              </form>
            )}
          </div>
        </div>
      )}

      {tab === 'settings' && !editingSettings && (
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Restaurant Details</h2>
            <button onClick={() => setEditingSettings(true)}
              className="text-orange-500 border border-orange-500 px-3 py-1 rounded text-sm">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Name:</span> {restaurant?.name}</div>
            <div><span className="text-gray-500">Cuisine:</span> {restaurant?.cuisine}</div>
            <div><span className="text-gray-500">Delivery Time:</span> {restaurant?.deliveryTime}</div>
            <div><span className="text-gray-500">Status:</span> {restaurant?.isOpen ? 'Open' : 'Closed'}</div>
          </div>
        </div>
      )}

      {tab === 'settings' && editingSettings && restaurant && (
        <form onSubmit={saveSettings} className="border rounded-lg p-4 bg-white">
          <h2 className="font-semibold text-lg mb-4">Edit Restaurant</h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="border p-2 rounded text-sm" placeholder="Restaurant name" value={settingsForm.name}
              onChange={e => setSettingsForm(p => ({ ...p, name: e.target.value }))} required />
            <input className="border p-2 rounded text-sm" placeholder="Delivery time" value={settingsForm.deliveryTime}
              onChange={e => setSettingsForm(p => ({ ...p, deliveryTime: e.target.value }))} />
            <select className="border p-2 rounded text-sm" value={settingsForm.cuisine}
              onChange={e => setSettingsForm(p => ({ ...p, cuisine: e.target.value }))}>
              {Object.keys(CUISINE_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="border p-2 rounded text-sm" value={settingsForm.isOpen}
              onChange={e => setSettingsForm(p => ({ ...p, isOpen: e.target.value === 'true' }))}>
              <option value="true">Open</option>
              <option value="false">Closed</option>
            </select>
            <input className="border p-2 rounded text-sm col-span-2" placeholder="Image URL" value={settingsForm.image}
              onChange={e => setSettingsForm(p => ({ ...p, image: e.target.value }))} />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded text-sm">Save</button>
            <button type="button" onClick={() => setEditingSettings(false)}
              className="border px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </form>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            {confirmAction.type === 'accept' && (
              <>
                <p className="font-semibold mb-2">Accept Order #{confirmAction.order.id}?</p>
                <p className="text-sm text-gray-500 mb-4">Total: {formatPrice(confirmAction.order.total)}</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)}
                    className="border px-3 py-1.5 rounded text-sm">Cancel</button>
                  <button onClick={() => handleOrderStatus(confirmAction.order.id, 'Confirmed')}
                    className="bg-green-600 text-white px-4 py-1.5 rounded text-sm">Accept</button>
                </div>
              </>
            )}
            {confirmAction.type === 'reject' && (
              <>
                <p className="font-semibold mb-2">Decline Order #{confirmAction.order.id}?</p>
                <p className="text-sm text-gray-500 mb-4">This will mark the order as rejected.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)}
                    className="border px-3 py-1.5 rounded text-sm">Cancel</button>
                  <button onClick={() => handleOrderStatus(confirmAction.order.id, 'Rejected')}
                    className="bg-red-500 text-white px-4 py-1.5 rounded text-sm">Decline</button>
                </div>
              </>
            )}
            {confirmAction.type === 'delete' && (
              <>
                <p className="font-semibold mb-2">Delete "{confirmAction.itemName}"?</p>
                <p className="text-sm text-gray-500 mb-4">This action cannot be undone.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)}
                    className="border px-3 py-1.5 rounded text-sm">Cancel</button>
                  <button onClick={() => deleteMenuItem(confirmAction.itemId)}
                    className="bg-red-500 text-white px-4 py-1.5 rounded text-sm">Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
