import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import app from '../index'
import prisma from '../config/database'

const createdEmails = []

beforeAll(async () => {
  await prisma.user.updateMany({ where: { email: 'john@test.com' }, data: { failedLoginAttempts: 0, lockedUntil: null } })
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } })
  await prisma.user.updateMany({ where: { email: 'john@test.com' }, data: { failedLoginAttempts: 0, lockedUntil: null } })
})

describe('POST /api/auth/register', () => {
  const ts = Date.now()
  const newUser = { name: `Test User ${ts}`, email: `test${ts}@test.com`, password: 'Secret123!' }
  createdEmails.push(newUser.email)

  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(newUser)
    expect(res.status).toBe(201)
    expect(res.body.message).toMatch(/verify/i)
    expect(res.body.user.email).toBe(newUser.email)
    expect(res.body.user.role).toBe('customer')
    expect(res.body.user.emailVerified).toBe(false)
    expect(res.body.user).not.toHaveProperty('password')
    expect(res.body.token).toBeFalsy()
  })

  it('blocks login until email is verified', async () => {
    const login = await request(app).post('/api/auth/login').send({ login: newUser.email, password: newUser.password })
    expect(login.status).toBe(403)
    expect(login.body.code).toBe('EMAIL_NOT_VERIFIED')
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

  it('rejects weak password (no uppercase)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'weak1', email: 'weak1@test.com', password: 'secret123!' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Password/i)
  })

  it('rejects weak password (no special char)', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'weak2', email: 'weak2@test.com', password: 'Secret123' })
    expect(res.status).toBe(400)
  })

  it('rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'weak3', email: 'weak3@test.com', password: 'Sh0rt!' })
    expect(res.status).toBe(400)
  })

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'bademail', email: 'not-an-email', password: 'StrongPass1!' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/email/i)
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

describe('GET /api/auth/verify-email', () => {
  const ts = Date.now()
  const email = `verify${ts}@test.com`
  const password = 'StrongPass1!'
  let token
  createdEmails.push(email)

  it('verifies an email via the dev link token, then allows login', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: `Verify ${ts}`, email, password })
    expect(reg.status).toBe(201)
    expect(reg.body.devLink).toMatch(/\/api\/auth\/verify-email\?token=/)
    token = new URL(reg.body.devLink).searchParams.get('token')
    expect(token).toBeTruthy()

    const verify = await request(app).get(`/api/auth/verify-email?token=${token}`)
    expect(verify.status).toBe(200)
    expect(verify.body.message).toMatch(/verified/i)

    const login = await request(app).post('/api/auth/login').send({ login: email, password })
    expect(login.status).toBe(200)
    expect(login.body.user.emailVerified).toBe(true)
  })

  it('rejects a missing token', async () => {
    const res = await request(app).get('/api/auth/verify-email')
    expect(res.status).toBe(400)
  })

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/auth/verify-email?token=nonexistent-token')
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login — persistent account lockout (DB-backed)', () => {
  const ts = Date.now()
  const email = `lock${ts}@test.com`
  const password = 'StrongPass1!'
  createdEmails.push(email)

  it('registers and verifies a fresh account for lockout testing', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: `Lock Test ${ts}`, email, password })
    expect(reg.status).toBe(201)
    const token = new URL(reg.body.devLink).searchParams.get('token')
    const verify = await request(app).get(`/api/auth/verify-email?token=${token}`)
    expect(verify.status).toBe(200)
  })

  it('locks the account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login').send({ login: email, password: 'WrongPass1!' })
      expect(res.status).toBe(401)
    }
    const u = await prisma.user.findUnique({ where: { email } })
    expect(u.failedLoginAttempts).toBe(0)
    expect(u.lockedUntil).toBeTruthy()
  })

  it('rejects the correct password while locked (423)', async () => {
    const res = await request(app).post('/api/auth/login').send({ login: email, password })
    expect(res.status).toBe(423)
    expect(res.body.code).toBe('ACCOUNT_LOCKED')
  })

  it('unlocks automatically once the lockout window passes', async () => {
    await prisma.user.update({ where: { email }, data: { lockedUntil: new Date(Date.now() - 1000), failedLoginAttempts: 0 } })
    const res = await request(app).post('/api/auth/login').send({ login: email, password })
    expect(res.status).toBe(200)
    expect(res.body.user.emailVerified).toBe(true)
  })
})

describe('POST /api/auth/forgot-password + reset-password', () => {
  const ts = Date.now()
  const email = `reset${ts}@test.com`
  const originalPassword = 'StrongPass1!'
  const newPassword = 'NewStrongPass1!'
  let resetToken
  createdEmails.push(email)

  it('registers and verifies a fresh account for reset testing', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: `Reset Test ${ts}`, email, password: originalPassword })
    expect(reg.status).toBe(201)
    const token = new URL(reg.body.devLink).searchParams.get('token')
    const verify = await request(app).get(`/api/auth/verify-email?token=${token}`)
    expect(verify.status).toBe(200)
  })

  it('returns a generic message for an unknown email (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ login: 'nobody@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/If an account exists/)
    expect(res.body.devLink).toBeFalsy()
  })

  it('sends a reset link for a known user', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ login: email })
    expect(res.status).toBe(200)
    expect(res.body.devLink).toMatch(/\/reset-password\?token=/)
    resetToken = new URL(res.body.devLink).searchParams.get('token')
    expect(resetToken).toBeTruthy()
  })

  it('rejects reset with a weak password', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: 'weak' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Password/i)
  })

  it('rejects an invalid reset token', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'not-a-real-token', password: newPassword })
    expect(res.status).toBe(400)
  })

  it('resets the password and allows login with the new password', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: newPassword })
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/reset successful/i)

    const oldLogin = await request(app).post('/api/auth/login').send({ login: email, password: originalPassword })
    expect(oldLogin.status).toBe(401)

    const newLogin = await request(app).post('/api/auth/login').send({ login: email, password: newPassword })
    expect(newLogin.status).toBe(200)
    expect(newLogin.body.user.email).toBe(email)
  })

  it('rejects reuse of the same reset token', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: originalPassword })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/register — rate limiting', () => {
  let remaining
  it('starts returning 429 after limit exceeded', async () => {
    const payload = { name: 'ratelimit', email: 'ratelimit@test.com', password: 'StrongPass1!' }
    for (let i = 0; i < 12; i++) {
      createdEmails.push(`ratelimit${i}@test.com`)
      const res = await request(app).post('/api/auth/register').send({ ...payload, name: `ratelimit${i}`, email: `ratelimit${i}@test.com` })
      if (res.status === 429) remaining = i
    }
    expect(remaining).toBeGreaterThanOrEqual(9)
  })
})
