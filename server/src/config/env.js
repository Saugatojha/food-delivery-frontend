require('dotenv').config()

const jwtSecret = process.env.JWT_SECRET || 'dev-secret'

if (jwtSecret === 'dev-secret' && process.env.NODE_ENV === 'production') {
  console.error('[env] CRITICAL: Change JWT_SECRET to a strong 256-bit value in production')
}

if (jwtSecret.length < 32 && process.env.NODE_ENV === 'production') {
  console.warn('[env] JWT_SECRET is too short; use at least 32 characters')
}

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
}