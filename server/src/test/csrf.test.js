import express from 'express'
import request from 'supertest'
import cookieParser from 'cookie-parser'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { ensureCsrfCookie, csrfProtection } from '../middleware/csrf'

let originalCsrFForce
beforeAll(() => {
  originalCsrFForce = process.env.CSRF_FORCE
  process.env.CSRF_FORCE = 'true'
})

afterAll(() => {
  process.env.CSRF_FORCE = originalCsrFForce
})

const createApp = () => {
  const app = express()
  app.use(cookieParser())
  app.use(express.json())
  app.use('/api', ensureCsrfCookie)
  app.post('/api/test', csrfProtection, (req, res) => res.status(200).json({ success: true }))
  app.get('/api/hey', (req, res) => res.status(200).json({ ok: true }))
  return app
}

describe('CSRF protection', () => {
  it('sets a csrf-token cookie on safe GET requests', async () => {
    const app = createApp()
    const response = await request(app).get('/api/hey')

    expect(response.status).toBe(200)
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('csrf-token='),
    ]))
  })

  it('rejects state-changing requests without a CSRF header', async () => {
    const app = createApp()
    const agent = request.agent(app)
    await agent.get('/api/hey')
    const response = await agent.post('/api/test').send({})

    expect(response.status).toBe(403)
    expect(response.body.error).toMatch(/CSRF token/i)
  })

  it('allows state-changing requests with a matching CSRF token header', async () => {
    const app = createApp()
    const agent = request.agent(app)
    const getResponse = await agent.get('/api/hey')
    const csrfCookie = getResponse.headers['set-cookie'].find((cookie) => cookie.startsWith('csrf-token='))
    const csrfToken = csrfCookie.match(/csrf-token=([^;]+)/)[1]

    const response = await agent.post('/api/test').set('X-CSRF-Token', csrfToken).send({})
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
