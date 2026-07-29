import { describe, it, expect, beforeEach } from 'vitest'
import { readJson, writeJson, removeKeys } from '../utils/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('readJson', () => {
  it('returns null for missing key', () => {
    expect(readJson('nonexistent')).toBeNull()
  })

  it('returns default if provided for missing key', () => {
    expect(readJson('x', [])).toEqual([])
  })

  it('parses stored JSON', () => {
    localStorage.setItem('test', JSON.stringify({ a: 1 }))
    expect(readJson('test')).toEqual({ a: 1 })
  })

  it('returns null on parse error', () => {
    localStorage.setItem('bad', '{invalid')
    expect(readJson('bad')).toBeNull()
  })
})

describe('writeJson', () => {
  it('writes JSON to localStorage', () => {
    writeJson('key', { x: 1 })
    expect(JSON.parse(localStorage.getItem('key'))).toEqual({ x: 1 })
  })
})

describe('removeKeys', () => {
  it('removes multiple keys', () => {
    localStorage.setItem('a', '1')
    localStorage.setItem('b', '2')
    removeKeys('a', 'b')
    expect(localStorage.getItem('a')).toBeNull()
    expect(localStorage.getItem('b')).toBeNull()
  })
})
