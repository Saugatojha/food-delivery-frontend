import request from 'supertest'
import { describe, it, expect, beforeAll } from 'vitest'
import app from '../index'

describe('POST /api/auth/register', () => {
  const ts = Date.now()
  const newUser = { name: `Test User ${ts}`, email: `test${ts}@test.com`, password: 'Secret123!' }

  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser)
    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe(newUser.email)
    expect(res.body.user.role).toBe('customer')
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/required/i)
  })

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser)
    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/registered/i)
  })
})

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ login: 'john@test.com', password: 'password' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe('john@test.com')
  })

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ login: 'john@test.com', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  it('rejects unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ login: 'noone@test.com', password: 'x' })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns user when authenticated', async () => {
    const login = await request(app).post('/api/auth/login').send({ login: 'john@test.com', password: 'password' })
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('john@test.com')
  })

  it('rejects without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('rejects invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer bad-token')
    expect(res.status).toBe(401)
  })
})
