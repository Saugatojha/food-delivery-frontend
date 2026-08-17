const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const speakeasy = require('speakeasy')
const QRCode = require('qrcode')
const rateLimit = require('express-rate-limit')
const prisma = require('../config/database')
const { jwtSecret, jwtExpiresIn } = require('../config/env')
const { authenticate } = require('../middleware/auth')
const { badRequest, conflict, unauthorized, serverError, forbidden } = require('../utils/errors')
const { validate, validatePasswordStrength } = require('../middleware/validate')
const { generateCsrfToken, setCsrfCookie } = require('../middleware/csrf')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer')
const logger = require('../config/logger')

const router = express.Router()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000

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

const forgotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: limitMax(5),
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const resetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: limitMax(5),
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

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
      user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId, emailVerified: false, twoFactorEnabled: false },
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

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ id: user.id, role: user.role, tfa: true }, jwtSecret, { expiresIn: '5m' })
      return res.json({ requires2FA: true, tempToken })
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    setJwtCookie(res, token)
    setCsrfCookie(res, generateCsrfToken())
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId, emailVerified: true, twoFactorEnabled: false } })
  } catch (err) {
    logger.error({ message: 'Login error', error: err.message })
    serverError(res, 'Login failed')
  }
})

router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token
    const email = (req.query.email || '').trim().toLowerCase()
    if (!token) return badRequest(res, 'Verification token is required')

    const user = await prisma.user.findFirst({ where: { verificationToken: token } })
    if (!user && email) {
      const byEmail = await prisma.user.findUnique({ where: { email } })
      if (byEmail?.emailVerified) {
        return res.json({ message: 'Email already verified. You can now log in.' })
      }
    }
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

router.post('/forgot-password', forgotLimiter, validate('login'), async (req, res) => {
  try {
    const loginValue = req.body.login.trim()
    const isEmail = loginValue.includes('@')
    const identifier = isEmail ? loginValue.toLowerCase() : loginValue
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findFirst({ where: { name: identifier } })

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = hashResetToken(rawToken)
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
      await prisma.passwordResetToken.create({
        data: { token: tokenHash, userId: user.id, expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS) },
      })
      const emailResult = await sendPasswordResetEmail(user, rawToken)
      return res.json({
        message: 'If an account exists for that email, a password reset link has been sent.',
        ...(process.env.NODE_ENV !== 'production' && emailResult.devLink ? { devLink: emailResult.devLink } : {}),
      })
    }

    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' })
  } catch (err) {
    logger.error({ message: 'Forgot password error', error: err.message })
    serverError(res, 'Failed to send reset email')
  }
})

router.post('/reset-password', resetLimiter, validate('token', 'password'), validatePasswordStrength, async (req, res) => {
  try {
    const rawToken = req.body.token.trim()
    const password = req.body.password
    const tokenHash = hashResetToken(rawToken)

    const reset = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash }, include: { user: true } })
    if (!reset || !reset.user || reset.usedAt) return badRequest(res, 'Invalid or expired reset token')
    if (reset.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: reset.id } })
      return badRequest(res, 'Reset token has expired. Request a new one.')
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hashed, failedLoginAttempts: 0, lockedUntil: null },
    })
    await prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } })

    logger.info(`password reset: user ${reset.userId}`)
    res.json({ message: 'Password reset successful. You can now log in.' })
  } catch (err) {
    logger.error({ message: 'Reset password error', error: err.message })
    serverError(res, 'Failed to reset password')
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })
  res.json({ message: 'Logged out' })
})

router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `SmartServe (${req.user.email})`, length: 20 })
    await prisma.user.update({ where: { id: req.user.id }, data: { twoFactorSecret: secret.base32 } })
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url)
    res.json({ secret: secret.base32, qrCode: qrDataUrl })
  } catch (err) {
    serverError(res, 'Failed to setup 2FA')
  }
})

router.post('/2fa/enable', authenticate, validate('token'), async (req, res) => {
  try {
    const { token } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user.twoFactorSecret) return badRequest(res, 'Run 2FA setup first')
    if (user.twoFactorEnabled) return badRequest(res, '2FA is already enabled')

    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 })
    if (!verified) return badRequest(res, 'Invalid verification code')

    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } })
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'))
    res.json({ message: '2FA enabled successfully', backupCodes })
  } catch (err) {
    serverError(res, 'Failed to enable 2FA')
  }
})

router.post('/2fa/disable', authenticate, validate('token'), async (req, res) => {
  try {
    const { token } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user.twoFactorEnabled) return badRequest(res, '2FA is not enabled')

    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 })
    if (!verified) return badRequest(res, 'Invalid verification code')

    await prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
    res.json({ message: '2FA disabled successfully' })
  } catch (err) {
    serverError(res, 'Failed to disable 2FA')
  }
})

router.post('/2fa/verify', validate('token'), async (req, res) => {
  try {
    const { token, tempToken } = req.body
    if (!tempToken) return badRequest(res, 'Temp token required')

    let decoded
    try {
      decoded = jwt.verify(tempToken, jwtSecret)
    } catch {
      return unauthorized(res, 'Session expired. Please login again.')
    }
    if (!decoded.tfa) return badRequest(res, 'Invalid token type')

    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return unauthorized(res, 'User not found')
    if (!user.twoFactorEnabled) return badRequest(res, '2FA is not enabled')

    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 })
    if (!verified) return badRequest(res, 'Invalid verification code')

    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } })
    const fullToken = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    setJwtCookie(res, fullToken)
    setCsrfCookie(res, generateCsrfToken())
    res.json({ token: fullToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId, emailVerified: true, twoFactorEnabled: true } })
  } catch (err) {
    serverError(res, 'Failed to verify 2FA')
  }
})

module.exports = router
