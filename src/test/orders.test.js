import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getNextStatus,
  isValidTransition,
  STATUS_FLOWS,
  getCart,
  saveCart,
} from '../services/orders'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

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
