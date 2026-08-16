import { describe, it, expect } from 'vitest'
import { formatPrice, calcTotal, mockLogin, mockRegister, mockGetRestaurants } from '../data/mock'

describe('formatPrice', () => {
  it('formats number with Rs. prefix and 2 decimals', () => {
    expect(formatPrice(169)).toBe('Rs. 169.00')
    expect(formatPrice(0)).toBe('Rs. 0.00')
    expect(formatPrice(99.5)).toBe('Rs. 99.50')
  })
})

describe('calcTotal', () => {
  it('sums item price * qty', () => {
    const items = [
      { price: 100, qty: 2 },
      { price: 50, qty: 1 },
    ]
    expect(calcTotal(items)).toBe(250)
  })

  it('returns 0 for empty array', () => {
    expect(calcTotal([])).toBe(0)
  })
})

describe('mockLogin', () => {
  it('returns token and user on valid credentials', () => {
    const result = mockLogin('john@example.com', 'password')
    expect(result.token).toContain('mock-jwt-')
    expect(result.user.email).toBe('john@example.com')
    expect(result.user).not.toHaveProperty('password')
  })

  it('throws on invalid email', () => {
    expect(() => mockLogin('noone@example.com', 'x')).toThrow('Invalid email or password')
  })

  it('throws on wrong password', () => {
    expect(() => mockLogin('john@example.com', 'wrong')).toThrow('Invalid email or password')
  })
})

describe('mockRegister', () => {
  it('returns token and user for new account', () => {
    const result = mockRegister('Test', 'new@example.com', 'pass')
    expect(result.token).toContain('mock-jwt-')
    expect(result.user.name).toBe('Test')
    expect(result.user.role).toBe('customer')
  })

  it('throws on duplicate email', () => {
    expect(() => mockRegister('Dup', 'john@example.com', 'x')).toThrow('Email already registered')
  })
})

describe('mockGetRestaurants', () => {
  it('returns array of restaurants', () => {
    const restaurants = mockGetRestaurants()
    expect(Array.isArray(restaurants)).toBe(true)
    expect(restaurants.length).toBeGreaterThan(0)
    expect(restaurants[0]).toHaveProperty('name')
    expect(restaurants[0]).toHaveProperty('isOpen')
  })
})
