import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAllOrders,
  getOrdersForRestaurant,
  getAvailableDeliveries,
  updateOrderStatus,
  saveOrder,
  getCart,
  saveCart,
  getNextStatus,
  isValidTransition,
  STATUS_FLOWS,
} from '../services/orders'

beforeEach(() => {
  localStorage.clear()
})

describe('cart operations', () => {
  it('returns empty array when no cart', () => {
    expect(getCart()).toEqual([])
  })

  it('saves and retrieves cart', () => {
    const items = [{ id: 1, name: 'Pizza', price: 100, qty: 2 }]
    saveCart(items)
    expect(getCart()).toEqual(items)
  })

  it('returns empty array after saving empty cart', () => {
    saveCart([])
    expect(getCart()).toEqual([])
  })
})

describe('order CRUD', () => {
  it('returns empty array when no orders', () => {
    expect(getAllOrders()).toEqual([])
  })

  it('saves and retrieves orders', () => {
    const order = { id: 1, items: [], total: 100, status: 'Pending' }
    saveOrder(order)
    expect(getAllOrders()).toHaveLength(1)
    expect(getAllOrders()[0].id).toBe(1)
  })

  it('saves multiple orders', () => {
    saveOrder({ id: 1, items: [], total: 100, status: 'Pending' })
    saveOrder({ id: 2, items: [], total: 200, status: 'Delivered' })
    expect(getAllOrders()).toHaveLength(2)
  })
})

describe('updateOrderStatus', () => {
  it('updates status of existing order', () => {
    saveOrder({ id: 1, items: [], total: 100, status: 'Pending' })
    const updated = updateOrderStatus(1, 'Confirmed')
    expect(updated.status).toBe('Confirmed')
    expect(getAllOrders()[0].status).toBe('Confirmed')
  })

  it('throws for nonexistent order', () => {
    expect(() => updateOrderStatus(999, 'Done')).toThrow('Order not found')
  })
})

describe('getOrdersForRestaurant', () => {
  it('filters orders by restaurantId', () => {
    saveOrder({ id: 1, items: [{ restaurantId: 1 }], total: 100, status: 'Pending' })
    saveOrder({ id: 2, items: [{ restaurantId: 2 }], total: 200, status: 'Pending' })
    expect(getOrdersForRestaurant(1)).toHaveLength(1)
    expect(getOrdersForRestaurant(2)).toHaveLength(1)
    expect(getOrdersForRestaurant(3)).toHaveLength(0)
  })

  it('finds order with multiple items from same restaurant', () => {
    saveOrder({ id: 1, items: [{ restaurantId: 1 }, { restaurantId: 1 }], total: 100, status: 'Pending' })
    expect(getOrdersForRestaurant(1)).toHaveLength(1)
  })
})

describe('getAvailableDeliveries', () => {
  it('returns orders ready for pickup or out for delivery', () => {
    saveOrder({ id: 1, items: [], total: 100, status: 'Pending' })
    saveOrder({ id: 2, items: [], total: 100, status: 'Ready for Pickup' })
    saveOrder({ id: 3, items: [], total: 100, status: 'Out for Delivery' })
    saveOrder({ id: 4, items: [], total: 100, status: 'Delivered' })
    const available = getAvailableDeliveries()
    expect(available).toHaveLength(2)
    expect(available.map(o => o.id)).toEqual([2, 3])
  })
})

describe('status flow constants', () => {
  it('customer flow has 5 steps', () => {
    expect(STATUS_FLOWS.customer).toEqual(['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'])
  })

  it('owner flow has 4 steps', () => {
    expect(STATUS_FLOWS.owner).toEqual(['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup'])
  })

  it('rider flow has 3 steps', () => {
    expect(STATUS_FLOWS.rider).toEqual(['Ready for Pickup', 'Out for Delivery', 'Delivered'])
  })
})

describe('getNextStatus', () => {
  it('returns next status in flow', () => {
    expect(getNextStatus('Pending', STATUS_FLOWS.customer)).toBe('Confirmed')
    expect(getNextStatus('Delivered', STATUS_FLOWS.customer)).toBeNull()
  })

  it('returns null for unknown status', () => {
    expect(getNextStatus('Unknown', STATUS_FLOWS.customer)).toBeNull()
  })
})

describe('isValidTransition', () => {
  it('allows valid transition by one step', () => {
    expect(isValidTransition('Pending', 'Confirmed', STATUS_FLOWS.customer)).toBe(true)
  })

  it('rejects skipping steps', () => {
    expect(isValidTransition('Pending', 'Delivered', STATUS_FLOWS.customer)).toBe(false)
  })

  it('rejects going backward', () => {
    expect(isValidTransition('Delivered', 'Pending', STATUS_FLOWS.customer)).toBe(false)
  })

  it('rejects unknown statuses', () => {
    expect(isValidTransition('Pending', 'Unknown', STATUS_FLOWS.customer)).toBe(false)
  })
})
