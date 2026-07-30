const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const prisma = require('../config/database')
const { jwtSecret, jwtExpiresIn } = require('../config/env')
const { authenticate } = require('../middleware/auth')
const { badRequest, conflict, unauthorized, serverError } = require('../utils/errors')
const { validate, validatePasswordStrength } = require('../middleware/validate')
const { generateCsrfToken, setCsrfCookie } = require('../middleware/csrf')
const logger = require('../config/logger')

const router = express.Router()

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const accountLockout = new Map()
setInterval(() => {
  for (const [key, entry] of accountLockout) {
    if (Date.now() - entry.start > 15 * 60 * 1000) accountLockout.delete(key)
  }
}, 60 * 1000)

function checkLockout(req, res, next) {
  const loginValue = req.body.login?.trim().toLowerCase()
  if (!loginValue) return next()
  const entry = accountLockout.get(loginValue)
  if (entry && entry.count >= 5 && Date.now() - entry.start < 15 * 60 * 1000) {
    logger.warn(`account locked: ${loginValue}`)
    return unauthorized(res, 'Invalid email/username or password')
  }
  next()
}

function recordFailedAttempt(loginValue) {
  if (!loginValue) return
  const key = loginValue.trim().toLowerCase()
  const entry = accountLockout.get(key) || { count: 0, start: Date.now() }
  entry.count++
  accountLockout.set(key, entry)
}

function setJwtCookie(res, token) {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

router.post('/register', registerLimiter, validate('name', 'email', 'password'), validatePasswordStrength, async (req, res) => {
  try {
    const name = req.body.name.trim()
    const email = req.body.email.trim().toLowerCase()
    const password = req.body.password

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) return conflict(res, 'Email already registered')

    const existingName = await prisma.user.findFirst({ where: { name } })
    if (existingName) return conflict(res, 'Username already taken')

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'customer' },
    })

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    setJwtCookie(res, token)
    setCsrfCookie(res, generateCsrfToken())
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } })
  } catch (err) {
    logger.error({ message: 'Register error', error: err.message, stack: err.stack })
    serverError(res, 'Registration failed')
  }
})

router.post('/login', loginLimiter, checkLockout, validate('login', 'password'), async (req, res) => {
  try {
    const loginValue = req.body.login.trim()
    const password = req.body.password

    const isEmail = loginValue.includes('@')
    const identifier = isEmail ? loginValue.toLowerCase() : loginValue
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findFirst({ where: { name: identifier } })

    if (!user) return unauthorized(res, 'Invalid credentials')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      recordFailedAttempt(loginValue)
      return unauthorized(res, 'Invalid credentials')
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    setJwtCookie(res, token)
    setCsrfCookie(res, generateCsrfToken())
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } })
  } catch (err) {
    logger.error({ message: 'Login error', error: err.message, stack: err.stack })
    serverError(res, 'Login failed')
  }
})

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user })
})

router.post('/logout', (req, res) => {
  res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
  res.json({ message: 'Logged out' })
})

module.exports = router
