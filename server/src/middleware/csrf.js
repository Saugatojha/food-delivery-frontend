const crypto = require('crypto')

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

function setCsrfCookie(res, token) {
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 2 * 60 * 60 * 1000,
  })
}

function ensureCsrfCookie(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!req.cookies['csrf-token']) {
      setCsrfCookie(res, generateCsrfToken())
    }
  }
  next()
}

function csrfProtection(req, res, next) {
  if (process.env.NODE_ENV === 'test' && process.env.CSRF_FORCE !== 'true') return next()
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const headerToken = req.headers['x-csrf-token']
  const cookieToken = req.cookies['csrf-token']
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' })
  }
  next()
}

module.exports = { generateCsrfToken, setCsrfCookie, ensureCsrfCookie, csrfProtection }
