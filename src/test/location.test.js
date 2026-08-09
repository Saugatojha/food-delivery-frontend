import { describe, it, expect } from 'vitest'
import { reverseGeocode, formatDeliveryAddress, emptyAddressDetails } from '../utils/location'

describe('reverseGeocode', () => {
  it('returns null for invalid input', () => {
    expect(reverseGeocode()).toBeNull()
    expect(reverseGeocode('a', 'b')).toBeNull()
  })

  it('resolves a point near Thamel', () => {
    const place = reverseGeocode(27.7159, 85.3124)
    expect(place.area).toBe('Thamel')
    expect(place.city).toBe('Kathmandu')
  })

  it('resolves a point in Bhaktapur', () => {
    const place = reverseGeocode(27.672, 85.428)
    expect(place.area).toBe('Bhaktapur')
    expect(place.city).toBe('Bhaktapur')
  })
})

describe('formatDeliveryAddress', () => {
  it('builds a full address in real format', () => {
    expect(formatDeliveryAddress({
      house: 'House 12',
      street: 'Pipal Bot Marg',
      landmark: 'Jamal',
      area: 'Thamel',
      city: 'Kathmandu',
    })).toBe('House 12, Pipal Bot Marg, near Jamal, Thamel, Kathmandu')
  })

  it('omits empty parts', () => {
    expect(formatDeliveryAddress({ area: 'Baneshwor', city: 'Kathmandu' })).toBe('Baneshwor, Kathmandu')
  })

  it('returns empty string when nothing provided', () => {
    expect(formatDeliveryAddress()).toBe('')
  })
})

describe('emptyAddressDetails', () => {
  it('returns blank fields', () => {
    expect(emptyAddressDetails()).toEqual({ house: '', street: '', area: '', city: '', landmark: '' })
  })
})
