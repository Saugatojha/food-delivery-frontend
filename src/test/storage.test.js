import { describe, it, expect, beforeEach } from 'vitest'
import { readJson, writeJson, removeKeys } from '../utils/storage'

beforeEach(() => {
  localStorage.clear()
})

describe('readJson', () => {
  it('returns parsed value when key exists', () => {
    localStorage.setItem('test', '{"a":1}')
    expect(readJson('test')).toEqual({ a: 1 })
  })

  it('returns default when key missing', () => {
    expect(readJson('nonexistent', [])).toEqual([])
  })

  it('returns default when JSON is malformed', () => {
    localStorage.setItem('bad', '{broken')
    expect(readJson('bad', 'fallback')).toBe('fallback')
  })

  it('returns null default when key missing and no default given', () => {
    expect(readJson('missing')).toBeNull()
  })
})

describe('writeJson', () => {
  it('writes stringified value', () => {
    writeJson('key', { b: 2 })
    expect(localStorage.getItem('key')).toBe('{"b":2}')
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
