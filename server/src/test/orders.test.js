import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../index'

async function getToken(email = 'john@test.com') {
  const res = await request(app).post('/api/auth/login').send({ login: email, password: 'password' })
  return res.body.token
}

describe('POST /api/orders', () => {
  it('creates an order', async () => {
    const token = await getToken()
    const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({
      items: [{ menuItemId: 3, restaurantId: 1, quantity: 2 }],
      address: '123 Test St',
      paymentMethod: 'cash',
      deliveryLatitude: 12.98,
      deliveryLongitude: 77.6,
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('Pending')
    expect(res.body.total).toBeGreaterThan(0)
    expect(res.body.deliveryLatitude).toBe(12.98)
    expect(res.body.items).toHaveLength(1)
  })

  it('rejects without address', async () => {
    const token = await getToken()
    const res = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`).send({
      items: [{ menuItemId: 3, restaurantId: 1, quantity: 1 }],
    })
    expect(res.status).toBe(400)
  })

  it('rejects without auth', async () => {
    const res = await request(app).post('/api/orders').send({ items: [], address: 'x' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/orders', () => {
  it('returns customer orders', async () => {
    const token = await getToken()
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('PATCH /api/orders/:id/status', () => {
  it('requires a rider before accepting the order', async () => {
    const customerToken = await getToken()
    const order = await request(app).post('/api/orders').set('Authorization', `Bearer ${customerToken}`).send({
      items: [{ menuItemId: 3, restaurantId: 1, quantity: 1 }],
      address: '456 Oak St',
      paymentMethod: 'card',
    })
    const orderId = order.body.id

    const ownerToken = await getToken('owner@test.com')
    const res = await request(app).patch(`/api/owner/orders/${orderId}/status`).set('Authorization', `Bearer ${ownerToken}`).send({ status: 'Confirmed' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Rider is required/)
  })

  it('assigns the chosen rider when the order is accepted', async () => {
    const customerToken = await getToken()
    const order = await request(app).post('/api/orders').set('Authorization', `Bearer ${customerToken}`).send({
      items: [{ menuItemId: 3, restaurantId: 1, quantity: 1 }],
      address: '321 Main St',
      paymentMethod: 'cash',
    })
    const orderId = order.body.id

    const rider = await request(app).post('/api/auth/login').send({ login: 'rider@test.com', password: 'password' })
    const ownerToken = await getToken('owner@test.com')
    const res = await request(app).patch(`/api/owner/orders/${orderId}/status`).set('Authorization', `Bearer ${ownerToken}`).send({ status: 'Confirmed', riderId: rider.body.user.id })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Confirmed')
    expect(res.body.delivery).toBeTruthy()
    expect(res.body.delivery.riderId).toBe(rider.body.user.id)
  })

  it('owner can deliver the order through the full lifecycle', async () => {
    const customerToken = await getToken()
    const order = await request(app).post('/api/orders').set('Authorization', `Bearer ${customerToken}`).send({
      items: [{ menuItemId: 3, restaurantId: 1, quantity: 1 }],
      address: '654 Elm St',
      paymentMethod: 'cash',
    })
    const orderId = order.body.id

    const rider = await request(app).post('/api/auth/login').send({ login: 'rider@test.com', password: 'password' })
    const ownerToken = await getToken('owner@test.com')
    const flow = ['Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered']
    for (let i = 0; i < flow.length; i++) {
      const body = i === 0 ? { status: flow[i], riderId: rider.body.user.id } : { status: flow[i] }
      const res = await request(app).patch(`/api/owner/orders/${orderId}/status`).set('Authorization', `Bearer ${ownerToken}`).send(body)
      expect(res.status).toBe(200)
      expect(res.body.status).toBe(flow[i])
    }
  })

  it('rejects invalid transition', async () => {
    const customerToken = await getToken()
    const order = await request(app).post('/api/orders').set('Authorization', `Bearer ${customerToken}`).send({
      items: [{ menuItemId: 3, restaurantId: 1, quantity: 1 }],
      address: '789 Pine St',
      paymentMethod: 'cash',
    })
    const orderId = order.body.id

    const ownerToken = await getToken('owner@test.com')
    const res = await request(app).patch(`/api/owner/orders/${orderId}/status`).set('Authorization', `Bearer ${ownerToken}`).send({ status: 'Delivered' })
    expect(res.status).toBe(403)
  })
})
