import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice, CUISINE_CATEGORIES, CATEGORY_SUBCATEGORIES } from '../../data/mock'
import { CardSkeleton } from '../../components/LoadingSkeleton'
import ImageUpload from '../../components/ImageUpload'
import MapView from '../../components/MapView'
import api from '../../api/client'
import { updateOwnerOrderStatus, getRiderEarnings, STATUS_FLOWS, getNextStatus, getAllowedTransitions } from '../../services/orders'

const STATUS_FLOW = STATUS_FLOWS.owner
const TERMINAL = ['Delivered', 'Rejected', 'Cancelled']

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
  const isRider = user?.role === 'rider'
  
  const [tab, setTab] = useState('orders')
  const [restaurant, setRestaurant] = useState(null)
  const [orders, setOrders] = useState([])
  const [myDeliveries, setMyDeliveries] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [riders, setRiders] = useState([])
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settingsForm, setSettingsForm] = useState({})
  const [editingSettings, setEditingSettings] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const [newItem, setNewItem] = useState({ name: '', category: '', subCategory: '', price: '', desc: '', image: '' })
  const [editingItem, setEditingItem] = useState(null)

  const orderCountRef = useRef(0)

  const fetchData = useCallback(async () => {
    try {
      if (isRider) {
        // Rider view: fetch assigned deliveries
        const [myDelivs, earningsData] = await Promise.all([
          api.get('/rider/my-deliveries'),
          getRiderEarnings(),
        ])
        setMyDeliveries(myDelivs.data)
        setEarnings(earningsData)
      } else {
        // Owner view: fetch restaurant, orders, menu, riders
        const [r, o, m, riderList] = await Promise.all([
          api.get('/owner/restaurant'),
          api.get('/owner/orders'),
          api.get('/owner/menu'),
          api.get('/owner/riders'),
        ])
        setRestaurant(r.data)
        setOrders(o.data)
        setMenuItems(m.data)
        setRiders(riderList.data)
        if (o.data.length > orderCountRef.current) {
          playNotification()
        }
        orderCountRef.current = o.data.length
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
    setLoading(false)
  }, [isRider])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const fetchEarnings = useCallback(async () => {
    try {
      const data = await getRiderEarnings()
      setEarnings(data)
    } catch { }
  }, [])

  useEffect(() => {
    if (tab === 'earnings') fetchEarnings()
  }, [tab, fetchEarnings])

  const handleRiderOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/rider/orders/${orderId}/status`, { status })
      showToast(`Order #${orderId} marked as ${status}`, 'success')
      setConfirmAction(null)
      fetchData()
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to update delivery', 'error')
    }
  }

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

  const handleOrderStatus = async (orderId, status, riderId) => {
    if (status === 'Confirmed' && !riderId) {
      showToast('Select a rider before accepting the order', 'error')
      return
    }
    try {
      await updateOwnerOrderStatus(orderId, status, riderId)
      showToast(`Order #${orderId} ${status === 'Confirmed' ? 'accepted' : status}`, 'success')
      setConfirmAction(null)
      setSelectedRiderId('')
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
        subCategory: newItem.subCategory || 'General',
        price: Number(newItem.price),
        desc: newItem.desc,
        image: newItem.image || undefined,
      })
      setNewItem({ name: '', category: '', subCategory: '', price: '', desc: '', image: '' })
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
        subCategory: editingItem.subCategory,
        price: Number(editingItem.price),
        desc: editingItem.desc,
        image: editingItem.image || undefined,
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


  const getAssignedRiderName = (order) => {
    const riderId = order.delivery?.riderId
    if (!riderId) return 'Unassigned'
    return riders.find(r => r.id === riderId)?.name || `Rider #${riderId}`
  }

  const assignRider = async (orderId, riderId) => {
    if (!riderId) return
    try {
      await api.patch(`/owner/orders/${orderId}/rider`, { riderId: Number(riderId) })
      showToast('Rider assigned', 'success')
      fetchData()
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to assign rider', 'error')
    }
  }

  const categories = CUISINE_CATEGORIES[restaurant?.cuisine] || ['General']

  const pendingOrders = orders.filter(o => o.status === 'Pending')
  const activeOrders = orders.filter(o => ['Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'].includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'Delivered')
  const declinedOrders = orders.filter(o => o.status === 'Rejected')

  const riderPos = restaurant?.latitude
    ? { latitude: restaurant.latitude, longitude: restaurant.longitude }
    : null

  const renderMap = (order) => {
    if (!restaurant?.latitude || !order.deliveryLatitude) return null
    return (
      <div className="mt-3">
        <MapView
          restaurant={{ latitude: restaurant.latitude, longitude: restaurant.longitude }}
          delivery={{ latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }}
          rider={riderPos}
          interactive={false}
          height="150px"
          showRouteNote
        />
      </div>
    )
  }

  const orderLines = (order) => (
    (order.items || []).map(item => (
      <p key={item.id || item.menuItemId} className="text-sm">{item.name || item.menuItem?.name} x{item.qty || item.quantity}</p>
    ))
  )

  if (loading) return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <CardSkeleton />
      <div className="mt-4 space-y-3">{Array.from({ length: 2 }, (_, i) => <CardSkeleton key={i} />)}</div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{isRider ? 'My Deliveries' : restaurant?.name || 'Owner Dashboard'}</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(isRider ? ['deliveries', 'earnings'] : ['orders', 'menu', 'settings', 'earnings']).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded text-sm font-medium capitalize ${tab === t ? 'bg-white shadow text-orange-600' : 'text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'deliveries' && isRider && (
        <div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4 bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wide">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{myDeliveries.filter(d => ['Ready for Pickup', 'Out for Delivery'].includes(d.status)).length}</p>
            </div>
            <div className="border rounded-lg p-4 bg-white">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{myDeliveries.filter(d => d.status === 'Delivered').length}</p>
            </div>
          </div>

          <h2 className="font-semibold text-lg mb-3">Active Deliveries</h2>
          {myDeliveries.filter(d => ['Ready for Pickup', 'Out for Delivery'].includes(d.status)).length === 0 ? (
            <p className="text-gray-400 text-center py-8">No active deliveries</p>
          ) : (
            myDeliveries.filter(d => ['Ready for Pickup', 'Out for Delivery'].includes(d.status)).map(order => (
              <div key={order.id} className="border rounded-lg p-4 mb-3 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {order.restaurant?.image && (
                        <img src={order.restaurant.image} alt={order.restaurant.name} className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{order.restaurant?.name}</p>
                        <p className="text-xs text-gray-500">Order #{order.id}</p>
                      </div>
                    </div>
                    {(order.items || []).map(item => (
                      <p key={item.id || item.menuItemId} className="text-sm text-gray-600">{item.name || item.menuItem?.name} x{item.qty || item.quantity}</p>
                    ))}
                    <p className="font-bold mt-2 text-orange-600">{formatPrice(order.total)}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {order.address}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium block mb-2 ${
                      order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                    {order.status === 'Ready for Pickup' && (
                      <button onClick={() => handleRiderOrderStatus(order.id, 'Out for Delivery')}
                        className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-600 block w-full mb-1">
                        Start Delivery
                      </button>
                    )}
                    {order.status === 'Out for Delivery' && (
                      <button onClick={() => setConfirmAction({ type: 'riderDeliver', orderId: order.id, orderNum: order.id })}
                        className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700 block w-full">
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {myDeliveries.filter(d => d.status === 'Delivered').length > 0 && (
            <>
              <h2 className="font-semibold text-lg mb-3 mt-6">Delivered</h2>
              {myDeliveries.filter(d => d.status === 'Delivered').map(order => (
                <div key={order.id} className="border rounded-lg p-3 mb-2 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {order.restaurant?.image && (
                      <img src={order.restaurant.image} alt={order.restaurant.name} className="w-8 h-8 rounded object-cover" />
                    )}
                    <p className="text-sm text-gray-600">Order #{order.id} — {order.restaurant?.name} — {formatPrice(order.total)}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Delivered</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'orders' && !isRider && (
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
                    {orderLines(order)}
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
              {activeOrders.map(order => {
                const allowed = getAllowedTransitions(order.status, STATUS_FLOW)
                return (
                  <div key={order.id} className="border rounded-lg p-4 mb-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Order #{order.id}</p>
                        {orderLines(order)}
                        <p className="font-bold mt-1 text-orange-600">{formatPrice(order.total)}</p>
                        <p className="text-xs text-gray-400">📍 {order.address}</p>
                        {order.delivery?.riderId && (
                          <p className="text-xs text-blue-600 mt-1">🚴 Rider: {getAssignedRiderName(order)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium block mb-2 ${
                          order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-700' : 
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                        {allowed.length > 0 && (
                          <div className="flex flex-col gap-1.5 mb-2">
                            {allowed.map(status => (
                              <button 
                                key={status}
                                onClick={() => handleOrderStatus(order.id, status)}
                                className={`px-3 py-1.5 rounded text-xs font-medium text-white transition ${
                                  status === 'Rejected' 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-orange-500 hover:bg-orange-600'
                                }`}
                              >
                                Mark {status}
                              </button>
                            ))}
                          </div>
                        )}
                        <select
                          className="mt-2 border p-1 rounded text-xs w-full"
                          value={order.delivery?.riderId || ''}
                          onChange={e => assignRider(order.id, e.target.value)}
                          disabled={riders.length === 0}
                          aria-label={`Assign rider for order ${order.id}`}
                        >
                          <option value="">Assign rider</option>
                          {riders.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                    </div>
                    {renderMap(order)}
                  </div>
                )
              })}
            </>
          )}

          {completedOrders.length > 0 && (
            <>
              <h2 className="font-semibold text-lg mb-3 mt-6">Completed Orders</h2>
              {completedOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-3 mb-2 bg-gray-50">
                  <p className="text-sm text-gray-500">Order #{order.id} — {formatPrice(order.total)} — Delivered</p>
                </div>
              ))}
            </>
          )}

          {declinedOrders.length > 0 && (
            <>
              <h2 className="font-semibold text-lg mb-3 mt-6">Declined</h2>
              {declinedOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-3 mb-2 bg-gray-50">
                  <p className="text-sm text-gray-500">Order #{order.id} — {formatPrice(order.total)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === 'menu' && !isRider && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-lg mb-3">Menu Items</h2>
            {[...categories, 'Other'].map(cat => {
              const items = cat === 'Other'
                ? menuItems.filter(i => !categories.includes(i.category))
                : menuItems.filter(i => i.category === cat)
              if (items.length === 0) return null
              const subCats = [...new Set(items.map(i => i.subCategory || 'General'))]
              return (
                <div key={cat} className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</h3>
                  {subCats.filter(Boolean).map(sub => {
                    const subItems = items.filter(i => (i.subCategory || 'General') === sub)
                    return (
                      <div key={sub} className="mb-2">
                        <p className="text-xs text-gray-400 ml-1 mb-1">{sub}</p>
                        {subItems.map(item => (
                          <div key={item.id} className="border rounded-lg p-3 mb-1.5 bg-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                                <p className="text-sm font-bold text-orange-600">{formatPrice(item.price)}</p>
                              </div>
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
                  value={editingItem.category} onChange={e => setEditingItem(p => ({ ...p, category: e.target.value, subCategory: '' }))}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border p-2 rounded w-full mb-2 text-sm"
                  value={editingItem.subCategory} onChange={e => setEditingItem(p => ({ ...p, subCategory: e.target.value }))}>
                  <option value="">Select subcategory</option>
                  {(CATEGORY_SUBCATEGORIES[editingItem.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="border p-2 rounded w-full mb-2 text-sm" type="number" step="0.01" placeholder="Price (NPR)"
                  value={editingItem.price} onChange={e => setEditingItem(p => ({ ...p, price: e.target.value }))} required />
                <textarea className="border p-2 rounded w-full mb-2 text-sm" placeholder="Description"
                  value={editingItem.desc || ''} onChange={e => setEditingItem(p => ({ ...p, desc: e.target.value }))} />
                <div className="mb-3">
                  <ImageUpload value={editingItem.image || ''} onChange={(url) => setEditingItem(p => ({ ...p, image: url }))} label="Item image" />
                </div>
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
                  value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value, subCategory: '' }))}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="border p-2 rounded w-full mb-2 text-sm"
                  value={newItem.subCategory} onChange={e => setNewItem(p => ({ ...p, subCategory: e.target.value }))}>
                  <option value="">Select subcategory</option>
                  {(CATEGORY_SUBCATEGORIES[newItem.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="border p-2 rounded w-full mb-2 text-sm" type="number" step="0.01" placeholder="Price (NPR)"
                  value={newItem.price} onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} required />
                <textarea className="border p-2 rounded w-full mb-2 text-sm" placeholder="Description (optional)"
                  value={newItem.desc} onChange={e => setNewItem(p => ({ ...p, desc: e.target.value }))} />
                <div className="mb-3">
                  <ImageUpload value={newItem.image || ''} onChange={(url) => setNewItem(p => ({ ...p, image: url }))} label="Item image" />
                </div>
                <button type="submit" className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm">Add Item</button>
              </form>
            )}
          </div>
        </div>
      )}

      {tab === 'settings' && !editingSettings && !isRider && (
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
          {restaurant?.image && <img src={restaurant.image} alt={restaurant.name} className="mt-3 w-40 h-28 object-cover rounded-lg" />}
        </div>
      )}

      {tab === 'settings' && editingSettings && restaurant && !isRider && (
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
            <div className="col-span-2">
              <ImageUpload value={settingsForm.image || ''} onChange={(url) => setSettingsForm(p => ({ ...p, image: url }))} label="Restaurant image" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded text-sm">Save</button>
            <button type="button" onClick={() => setEditingSettings(false)}
              className="border px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </form>
      )}

      {tab === 'earnings' && (
        <div>
          {earnings ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Today</p>
                  <p className="text-xl font-bold text-green-600">{formatPrice(earnings.dailyEarnings)}</p>
                  <p className="text-xs text-gray-400">{earnings.dailyCount} deliveries</p>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">This Week</p>
                  <p className="text-xl font-bold text-blue-600">{formatPrice(earnings.weeklyEarnings)}</p>
                  <p className="text-xs text-gray-400">{earnings.weeklyCount} deliveries</p>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">All Time</p>
                  <p className="text-xl font-bold text-orange-600">{formatPrice(earnings.totalEarnings)}</p>
                  <p className="text-xs text-gray-400">{earnings.totalDeliveries} deliveries</p>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Avg per Delivery</p>
                  <p className="text-xl font-bold text-gray-800">
                    {earnings.totalDeliveries > 0
                      ? formatPrice(earnings.totalEarnings / earnings.totalDeliveries)
                      : 'Rs. 0.00'}
                  </p>
                </div>
              </div>
              <button onClick={fetchEarnings}
                className="text-blue-600 text-sm hover:underline">Refresh</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          )}
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            {confirmAction.type === 'accept' && (
              <>
                <p className="font-semibold mb-2">Accept Order #{confirmAction.order.id}?</p>
                <p className="text-sm text-gray-500 mb-1">Total: {formatPrice(confirmAction.order.total)}</p>
                <label className="block text-sm text-gray-600 mb-4">
                  Assign rider
                  <select
                    className="mt-1 border p-2 rounded w-full text-sm"
                    value={selectedRiderId}
                    onChange={e => setSelectedRiderId(e.target.value)}
                    disabled={riders.length === 0}
                    required
                  >
                    <option value="">Select rider</option>
                    {riders.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </label>
                {riders.length === 0 && <p className="text-xs text-red-600 mb-4">No rider accounts are available.</p>}
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)}
                    className="border px-3 py-1.5 rounded text-sm">Cancel</button>
                  <button onClick={() => handleOrderStatus(confirmAction.order.id, 'Confirmed', Number(selectedRiderId))}
                    disabled={!selectedRiderId}
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
            {confirmAction.type === 'riderDeliver' && (
              <>
                <p className="font-semibold mb-2">Mark Order #{confirmAction.orderNum} as Delivered?</p>
                <p className="text-sm text-gray-500 mb-4">This will complete the delivery and notify the customer.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)}
                    className="border px-3 py-1.5 rounded text-sm">Cancel</button>
                  <button onClick={() => handleRiderOrderStatus(confirmAction.orderId, 'Delivered')}
                    className="bg-green-600 text-white px-4 py-1.5 rounded text-sm">Confirm Delivery</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}





