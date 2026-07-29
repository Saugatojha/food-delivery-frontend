import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../index'

async function getToken(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password' })
  return res.body.token
}

describe('role-based access', () => {
  it('owner can access owner routes', async () => {
    const token = await getToken('owner@test.com')
    const res = await request(app).get('/api/owner/orders').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('customer cannot access owner routes', async () => {
    const token = await getToken('john@test.com')
    const res = await request(app).get('/api/owner/orders').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('rider can access rider routes', async () => {
    const token = await getToken('rider@test.com')
    const res = await request(app).get('/api/rider/deliveries').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('customer cannot access rider routes', async () => {
    const token = await getToken('john@test.com')
    const res = await request(app).get('/api/rider/deliveries').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('admin can access admin routes', async () => {
    const token = await getToken('admin@test.com')
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('users')
    expect(res.body).toHaveProperty('revenue')
  })

  it('customer cannot access admin routes', async () => {
    const token = await getToken('john@test.com')
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })
})

describe('owner menu management', () => {
  it('owner can add menu item', async () => {
    const token = await getToken('owner@test.com')
    const res = await request(app).post('/api/owner/menu').set('Authorization', `Bearer ${token}`).send({
      name: 'Test Item',
      price: 99,
      desc: 'A test item',
    })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Test Item')
  })

  it('owner can list menu', async () => {
    const token = await getToken('owner@test.com')
    const res = await request(app).get('/api/owner/menu').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('owner can delete their own menu item', async () => {
    const token = await getToken('owner@test.com')
    const add = await request(app).post('/api/owner/menu').set('Authorization', `Bearer ${token}`).send({
      name: 'Delete Me', price: 10, desc: 'Delete test item',
    })
    expect(add.status).toBe(201)
    const res = await request(app).delete(`/api/owner/menu/${add.body.id}`).set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Menu item deleted')
  })
})

describe('rider location', () => {
  it('updates rider location', async () => {
    const token = await getToken('rider@test.com')
    const res = await request(app).patch('/api/rider/location').set('Authorization', `Bearer ${token}`).send({
      latitude: 12.97,
      longitude: 77.59,
    })
    expect(res.status).toBe(404)
  })
})
