import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../index'

async function getToken() {
  const res = await request(app).post('/api/auth/login').send({ login: 'john@test.com', password: 'password' })
  return res.body.token
}

describe('GET /api/restaurants', () => {
  it('returns restaurant list', async () => {
    const token = await getToken()
    const res = await request(app).get('/api/restaurants').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThanOrEqual(6)
    expect(res.body[0]).toHaveProperty('name')
    expect(res.body[0]).toHaveProperty('latitude')
  })

  it('rejects without auth', async () => {
    const res = await request(app).get('/api/restaurants')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/restaurants/:id/menu', () => {
  it('returns restaurant with menu items', async () => {
    const token = await getToken()
    const res = await request(app).get('/api/restaurants/1/menu').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.restaurant.name).toBe('Pizza Palace')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.items.length).toBeGreaterThanOrEqual(3)
  })

  it('returns 404 for unknown restaurant', async () => {
    const token = await getToken()
    const res = await request(app).get('/api/restaurants/999/menu').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
  })
})
