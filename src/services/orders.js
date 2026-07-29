import { readJson, writeJson } from '../utils/storage'

const ORDERS_KEY = 'orders'

export function getAllOrders() {
  return readJson(ORDERS_KEY, [])
}

export function getOrdersForRestaurant(restaurantId) {
  return getAllOrders().filter(o =>
    o.items.some(i => i.restaurantId === restaurantId)
  )
}

export function getOrdersForCustomer() {
  return getAllOrders()
}

export function getAvailableDeliveries() {
  return getAllOrders().filter(
    o => o.status === 'Ready for Pickup' || o.status === 'Out for Delivery'
  )
}

export function updateOrderStatus(orderId, newStatus) {
  const orders = getAllOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx === -1) throw new Error('Order not found')
  orders[idx] = { ...orders[idx], status: newStatus }
  writeJson(ORDERS_KEY, orders)
  return orders[idx]
}

export function saveOrder(order) {
  const orders = getAllOrders()
  orders.push(order)
  writeJson(ORDERS_KEY, orders)
}

export function getCart() {
  return readJson('cart', [])
}

export function saveCart(items) {
  writeJson('cart', items)
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
  return idx < flow.length - 1 ? flow[idx + 1] : null
}
