import api from '../api/client'

export async function getAllOrders() {
  const { data } = await api.get('/orders')
  return data
}

export async function getOrdersForRestaurant(restaurantId) {
  const orders = await getAllOrders()
  return orders.filter(o => o.restaurantId === restaurantId)
}

export async function getOrdersForCustomer() {
  return getAllOrders()
}

export async function getAvailableDeliveries() {
  const { data } = await api.get('/rider/deliveries')
  return data
}

export async function getMyDeliveries() {
  const { data } = await api.get('/rider/my-deliveries')
  return data
}

export async function updateOrderStatus(orderId, newStatus) {
  const { data } = await api.patch(`/orders/${orderId}/status`, { status: newStatus })
  return data
}

export async function updateOwnerOrderStatus(orderId, newStatus) {
  const { data } = await api.patch(`/owner/orders/${orderId}/status`, { status: newStatus })
  return data
}

export async function updateRiderOrderStatus(orderId, newStatus) {
  const { data } = await api.patch(`/rider/orders/${orderId}/status`, { status: newStatus })
  return data
}

export async function acceptDelivery(orderId) {
  const { data } = await api.patch(`/rider/orders/${orderId}/accept`)
  return data
}

export async function rejectDelivery(orderId) {
  const { data } = await api.patch(`/rider/orders/${orderId}/reject`)
  return data
}

export async function getRiderEarnings() {
  const { data } = await api.get('/rider/earnings')
  return data
}

export async function saveOrder(order) {
  const { data } = await api.post('/orders', order)
  return data
}

export function getCart() {
  try {
    const raw = localStorage.getItem('cart')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCart(items) {
  localStorage.setItem('cart', JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('cart-update'))
}

export async function submitOrder(orderPayload) {
  const { data } = await api.post('/orders', {
    items: orderPayload.items.map(i => ({
      menuItemId: i.id || i.menuItemId,
      restaurantId: i.restaurantId,
      quantity: i.qty || i.quantity,
    })),
    address: orderPayload.address,
    phone: orderPayload.phone,
    paymentMethod: orderPayload.paymentMethod,
    deliveryLatitude: orderPayload.deliveryLatitude,
    deliveryLongitude: orderPayload.deliveryLongitude,
  })
  return data
}

export const STATUS_FLOWS = {
  customer: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'],
  owner: ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup'],
  rider: ['Ready for Pickup', 'Out for Delivery', 'Delivered'],
}

export function isValidTransition(current, next, flow) {
  const idx = flow.indexOf(current)
  return idx !== -1 && idx + 1 === flow.indexOf(next)
}

export function getNextStatus(current, flow) {
  const idx = flow.indexOf(current)
  if (idx === -1 || idx >= flow.length - 1) return null
  return flow[idx + 1]
}
