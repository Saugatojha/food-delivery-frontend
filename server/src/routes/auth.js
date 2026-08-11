const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const prisma = require('../config/database')
const { jwtSecret, jwtExpiresIn } = require('../config/env')
const { authenticate } = require('../middleware/auth')
const { badRequest, conflict, unauthorized, serverError } = require('../utils/errors')
const { validate, validatePasswordStrength } = require('../middleware/validate')
const { generateCsrfToken, setCsrfCookie } = require('../middleware/csrf')
const { sendVerificationEmail } = require('../utils/mailer')
const logger = require('../config/logger')

const router = express.Router()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function limitMax(prodMax) {
  return process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' ? prodMax : 100000
}

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: limitMax(20),
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: limitMax(10),
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

function lockoutMinutesLeft(user) {
  if (!user.lockedUntil) return 0
  const msLeft = new Date(user.lockedUntil).getTime() - Date.now()
  return msLeft > 0 ? Math.max(1, Math.ceil(msLeft / 60000)) : 0
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
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    let user
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          role: 'customer',
          emailVerified: false,
          verificationToken,
          verificationExpires,
        },
      })
    } catch (err) {
      if (err.code === 'P2002') return conflict(res, 'Email already registered')
      throw err
    }

    const emailResult = await sendVerificationEmail(user, verificationToken)

    res.status(201).json({
      message: 'Registration successful. Please verify your email to login.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId, emailVerified: false },
      ...(process.env.NODE_ENV !== 'production' && emailResult.devLink ? { devLink: emailResult.devLink } : {}),
    })
  } catch (err) {
    logger.error({ message: 'Register error', error: err.message, stack: err.stack })
    serverError(res, 'Registration failed')
  }
})

router.post('/login', loginLimiter, validate('login', 'password'), async (req, res) => {
  try {
    const loginValue = req.body.login.trim()
    const password = req.body.password

    const isEmail = loginValue.includes('@')
    const identifier = isEmail ? loginValue.toLowerCase() : loginValue
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findFirst({ where: { name: identifier } })

    if (!user) return unauthorized(res, 'Invalid credentials')

    const minutesLeft = lockoutMinutesLeft(user)
    if (minutesLeft > 0) {
      logger.warn(`account locked: ${identifier}`)
      return res.status(423).json({
        error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        code: 'ACCOUNT_LOCKED',
      })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1
      const data = { failedLoginAttempts: attempts }
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        data.failedLoginAttempts = 0
        data.lockedUntil = new Date(Date.now() + LOCKOUT_MS)
      }
      await prisma.user.update({ where: { id: user.id }, data })
      return unauthorized(res, 'Invalid credentials')
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      })
    }

    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } })
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    setJwtCookie(res, token)
    setCsrfCookie(res, generateCsrfToken())
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId, emailVerified: true } })
  } catch (err) {
    logger.error({ message: 'Login error', error: err.message, stack: err.stack })
    serverError(res, 'Login failed')
  }
})

router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token
    if (!token) return badRequest(res, 'Verification token is required')

    const user = await prisma.user.findFirst({ where: { verificationToken: token } })
    if (!user) return badRequest(res, 'Invalid or expired verification token')

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      return badRequest(res, 'Verification token has expired. Request a new one.')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationExpires: null },
    })

    res.json({ message: 'Email verified successfully. You can now log in.' })
  } catch (err) {
    logger.error({ message: 'Verify email error', error: err.message })
    serverError(res, 'Verification failed')
  }
})

router.post('/resend-verification', validate('login'), async (req, res) => {
  try {
    const loginValue = req.body.login.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: loginValue } })
    if (!user) return unauthorized(res, 'Invalid email')

    if (user.emailVerified) return badRequest(res, 'Email is already verified')

    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({ where: { id: user.id }, data: { verificationToken, verificationExpires } })

    const emailResult = await sendVerificationEmail(user, verificationToken)

    res.json({
      message: 'Verification email sent.',
      ...(process.env.NODE_ENV !== 'production' && emailResult.devLink ? { devLink: emailResult.devLink } : {}),
    })
  } catch (err) {
    logger.error({ message: 'Resend verification error', error: err.message })
    serverError(res, 'Failed to resend verification')
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
