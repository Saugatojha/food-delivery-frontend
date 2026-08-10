import request from 'supertest'
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import app from '../index'

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')

async function getToken(email) {
  const res = await request(app).post('/api/auth/login').send({ login: email, password: 'password' })
  return res.body.token
}

function cleanupUploaded(url) {
  const filename = url.split('/').pop()
  const filePath = path.join(uploadsDir, filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

describe('image upload validation', () => {
  it('owner can upload a valid PNG', async () => {
    const token = await getToken('owner@test.com')
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', PNG_1x1, { filename: 'pic.png', contentType: 'image/png' })
    expect(res.status).toBe(200)
    expect(res.body.url).toMatch(/\/uploads\//)
    cleanupUploaded(res.body.url)
  })

  it('rejects a file whose content does not match its image type (disguised HTML)', async () => {
    const token = await getToken('owner@test.com')
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('<html><script>alert(1)</script></html>'), { filename: 'evil.png', contentType: 'image/png' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/does not match/)
  })

  it('rejects a disallowed file extension', async () => {
    const token = await getToken('owner@test.com')
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', PNG_1x1, { filename: 'evil.html', contentType: 'image/png' })
    expect(res.status).toBe(400)
  })

  it('customer cannot upload', async () => {
    const token = await getToken('john@test.com')
    const res = await request(app)
      .post('/api/upload/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', PNG_1x1, { filename: 'pic.png', contentType: 'image/png' })
    expect(res.status).toBe(403)
  })
})
