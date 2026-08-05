import { describe, it, expect } from 'vitest'
import { FLOWS, getAllowedTransitions, getNextStatus, isValidTransition, TERMINAL_STATUSES } from '../utils/statusFlow'

describe('FLOWS', () => {
  it('defines customer flow', () => {
    expect(FLOWS.customer).toEqual(['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'])
  })

  it('defines owner flow', () => {
    expect(FLOWS.owner).toEqual(['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Rejected'])
  })

  it('defines rider flow', () => {
    expect(FLOWS.rider).toEqual(['Ready for Pickup', 'Out for Delivery', 'Delivered'])
  })
})

describe('getAllowedTransitions', () => {
  it('returns next single step for valid status', () => {
    expect(getAllowedTransitions('customer', 'Pending')).toEqual(['Confirmed'])
    expect(getAllowedTransitions('owner', 'Preparing')).toEqual(['Ready for Pickup'])
    expect(getAllowedTransitions('rider', 'Out for Delivery')).toEqual(['Delivered'])
  })

  it('returns empty array at end of flow', () => {
    expect(getAllowedTransitions('customer', 'Delivered')).toEqual([])
  })

  it('returns empty array for unknown role', () => {
    expect(getAllowedTransitions('unknown', 'Pending')).toEqual([])
  })
})

describe('getNextStatus', () => {
  it('returns next status', () => {
    expect(getNextStatus('Pending', 'customer')).toBe('Confirmed')
    expect(getNextStatus('Ready for Pickup', 'rider')).toBe('Out for Delivery')
  })

  it('returns null at end', () => {
    expect(getNextStatus('Delivered', 'customer')).toBeNull()
  })

  it('returns null for unknown status', () => {
    expect(getNextStatus('Unknown', 'customer')).toBeNull()
  })

  it('returns null for unknown role', () => {
    expect(getNextStatus('Pending', 'unknown')).toBeNull()
  })
})

describe('isValidTransition', () => {
  it('allows valid single-step transitions', () => {
    expect(isValidTransition('Pending', 'Confirmed', 'owner')).toBe(true)
    expect(isValidTransition('Ready for Pickup', 'Out for Delivery', 'rider')).toBe(true)
  })

  it('rejects skipping steps', () => {
    expect(isValidTransition('Pending', 'Delivered', 'customer')).toBe(false)
  })

  it('rejects going backward', () => {
    expect(isValidTransition('Confirmed', 'Pending', 'owner')).toBe(false)
  })
})

describe('TERMINAL_STATUSES', () => {
  it('includes Delivered, Cancelled, Rejected', () => {
    expect(TERMINAL_STATUSES).toContain('Delivered')
    expect(TERMINAL_STATUSES).toContain('Cancelled')
    expect(TERMINAL_STATUSES).toContain('Rejected')
  })
})
