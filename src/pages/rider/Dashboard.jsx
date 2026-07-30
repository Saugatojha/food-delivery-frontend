import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../data/mock'
import {
  getAvailableDeliveries,
  getMyDeliveries,
  getRiderEarnings,
  updateRiderOrderStatus,
  acceptDelivery,
  rejectDelivery,
} from '../../services/orders'
import MapView from '../../components/MapView'
import EmptyState from '../../components/EmptyState'
import { CardSkeleton } from '../../components/LoadingSkeleton'

export default function RiderDashboard() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tab, setTab] = useState('available')
  const [available, setAvailable] = useState([])
  const [myDeliveries, setMyDeliveries] = useState([])
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [riderLocation, setRiderLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [avail, mine] = await Promise.all([
        getAvailableDeliveries(),
        getMyDeliveries(),
      ])
      setAvailable(avail.filter(o => o.status === 'Ready for Pickup'))
      setMyDeliveries(mine)
    } catch { }
    setLoading(false)
  }, [])

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

  const handleAccept = async (orderId) => {
    try {
      await acceptDelivery(orderId)
      showToast('Delivery accepted! Head to the restaurant.', 'success')
      setConfirmAction(null)
      fetchData()
    } catch {
      showToast('Failed to accept delivery', 'error')
    }
  }

  const handleReject = async (orderId) => {
    try {
      await rejectDelivery(orderId)
      showToast('Delivery rejected', 'info')
      setConfirmAction(null)
      fetchData()
    } catch {
      showToast('Failed to reject delivery', 'error')
    }
  }

  const advanceDelivery = async (order, next) => {
    try {
      await updateRiderOrderStatus(order.id, next)
      const [avail, mine] = await Promise.all([
        getAvailableDeliveries(),
        getMyDeliveries(),
      ])
      setAvailable(avail.filter(o => o.status === 'Ready for Pickup'))
      setMyDeliveries(mine)
      showToast(`Order #${order.id} → ${next}`, 'success')
    } catch {
      showToast('Failed to update delivery', 'error')
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return showToast('Geolocation not supported', 'error')
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setRiderLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLocating(false)
        showToast('Location updated', 'success')
      },
      () => {
        setLocating(false)
        showToast('Could not get location', 'error')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const tabs = [
    { key: 'available', label: 'Available', count: available.length },
    { key: 'my-deliveries', label: 'My Deliveries', count: myDeliveries.filter(o => o.status !== 'Delivered').length },
    { key: 'earnings', label: 'Earnings' },
  ]

  if (loading) return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-3">
      {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Rider Dashboard</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded text-sm font-medium relative ${tab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}>
              {t.label}
              {t.count > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'available' && (
        <>
          {available.length === 0 ? (
            <EmptyState title="No deliveries available" message="Waiting for restaurants to mark orders ready" />
          ) : (
            available.map(order => (
              <div key={order.id} className="border rounded-lg p-4 mb-3 bg-white">
                <div className="flex justify-between items-start">
                    <div>
                    <p className="text-sm text-gray-500">Order #{order.id}</p>
                    <p className="font-medium">{order.restaurant?.name}</p>
                    <p className="font-bold mt-1 text-green-600">{formatPrice(order.total)}</p>
                    <p className="text-xs text-gray-400 mt-1">Deliver to: {order.address}</p>
                    {order.phone && <p className="text-xs text-gray-400">Phone: {order.phone}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmAction({ type: 'accept', order })}
                      className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium">
                      Accept
                    </button>
                    <button onClick={() => setConfirmAction({ type: 'reject', order })}
                      className="bg-gray-400 text-white px-4 py-1.5 rounded text-sm font-medium">
                      Pass
                    </button>
                  </div>
                </div>
                {order.restaurant?.latitude && (
                  <div className="mt-3">
                    <MapView
                      restaurant={order.restaurant}
                      delivery={order.deliveryLatitude ? { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude } : null}
                      interactive={false}
                      height="140px"
                      showRouteNote
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {tab === 'my-deliveries' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={useCurrentLocation} disabled={locating}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50">
              {locating ? 'Locating...' : 'Share Location'}
            </button>
          </div>
          {myDeliveries.length === 0 ? (
            <EmptyState title="No deliveries yet" message="Accept an available delivery to get started" />
          ) : (
            myDeliveries.filter(o => o.status !== 'Delivered').map(order => {
              const restaurant = order.restaurant
              const hasMap = restaurant?.latitude
              return (
                <div key={order.id} className="border rounded-lg p-4 mb-3 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">Order #{order.id}</p>
                      <p className="font-medium">{restaurant?.name}</p>
                      <p className="font-bold mt-1 text-green-600">{formatPrice(order.total)}</p>
                      <p className="text-xs text-gray-400 mt-1">Deliver to: {order.address}</p>
                      {order.phone && <p className="text-xs text-gray-400">Phone: {order.phone}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium block mb-2 ${
                        order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                      {order.status === 'Out for Delivery' && (
                        <button onClick={() => advanceDelivery(order, 'Delivered')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium">
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                  {hasMap && (
                    <div className="mt-3">
                      <MapView
                        restaurant={restaurant}
                        delivery={order.deliveryLatitude ? { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude } : null}
                        rider={riderLocation}
                        interactive={false}
                        height="160px"
                        showRouteNote
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}
          {myDeliveries.filter(o => o.status === 'Delivered').length > 0 && (
            <details className="mt-6">
              <summary className="text-sm text-gray-500 cursor-pointer font-medium">
                Completed ({myDeliveries.filter(o => o.status === 'Delivered').length})
              </summary>
              {myDeliveries.filter(o => o.status === 'Delivered').map(order => (
                <div key={order.id} className="border rounded-lg p-3 mt-2 bg-gray-50">
                  <p className="text-sm text-gray-500">Order #{order.id} — {formatPrice(order.total)}</p>
                </div>
              ))}
            </details>
          )}
        </>
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
                <p className="font-semibold mb-2">Accept Delivery #{confirmAction.order.id}?</p>
                <p className="text-sm text-gray-500 mb-1">{confirmAction.order.restaurant?.name}</p>
                <p className="text-sm text-gray-500 mb-4">Earnings: {formatPrice(confirmAction.order.total)}</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)}
                    className="border px-3 py-1.5 rounded text-sm">Cancel</button>
                  <button onClick={() => handleAccept(confirmAction.order.id)}
                    className="bg-green-600 text-white px-4 py-1.5 rounded text-sm">Accept</button>
                </div>
              </>
            )}
            {confirmAction.type === 'reject' && (
              <>
                <p className="font-semibold mb-2">Pass on Delivery #{confirmAction.order.id}?</p>
                <p className="text-sm text-gray-500 mb-4">Another rider can pick it up.</p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setConfirmAction(null)}
                    className="border px-3 py-1.5 rounded text-sm">Cancel</button>
                  <button onClick={() => handleReject(confirmAction.order.id)}
                    className="bg-gray-500 text-white px-4 py-1.5 rounded text-sm">Pass</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
