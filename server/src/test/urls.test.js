import { describe, it, expect } from 'vitest'
import { rewriteLegacyUrls } from '../utils/urls'

describe('rewriteLegacyUrls', () => {
  const origin = 'http://localhost:5001'

  it('rewrites legacy localhost:5000 URLs in strings', () => {
    expect(rewriteLegacyUrls('http://localhost:5000/uploads/a.jpg', origin)).toBe('http://localhost:5001/uploads/a.jpg')
    expect(rewriteLegacyUrls('http://127.0.0.1:5000/uploads/a.jpg', origin)).toBe('http://localhost:5001/uploads/a.jpg')
  })

  it('recursively rewrites object and array values', () => {
    const input = { restaurant: { image: 'http://localhost:5000/uploads/a.jpg' }, items: ['http://localhost:5000/x.png'] }
    const out = rewriteLegacyUrls(input, origin)
    expect(out.restaurant.image).toBe('http://localhost:5001/uploads/a.jpg')
    expect(out.items[0]).toBe('http://localhost:5001/x.png')
  })

  it('leaves unrelated strings untouched', () => {
    const url = 'https://placehold.co/400x200/EA580C/FFFFFF?text=Pizza'
    expect(rewriteLegacyUrls(url, origin)).toBe(url)
  })

  it('passes through primitives', () => {
    expect(rewriteLegacyUrls(42, origin)).toBe(42)
    expect(rewriteLegacyUrls(null, origin)).toBe(null)
    expect(rewriteLegacyUrls(undefined, origin)).toBe(undefined)
  })
})
