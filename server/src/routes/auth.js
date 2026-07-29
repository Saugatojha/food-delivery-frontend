const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/database')
const { jwtSecret, jwtExpiresIn } = require('../config/env')
const { authenticate } = require('../middleware/auth')
const { badRequest, conflict, unauthorized, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')

const router = express.Router()

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 2 * 60 * 60 * 1000,
  })
}

router.post('/register', validate('name', 'email', 'password'), async (req, res) => {
  try {
    const name = req.body.name.trim()
    const email = req.body.email.trim().toLowerCase()
    const password = req.body.password

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) return conflict(res, 'Email already registered')

    const existingName = await prisma.user.findFirst({ where: { name } })
    if (existingName) return conflict(res, 'Username already taken')

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'customer' },
    })

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    setTokenCookie(res, token)
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } })
  } catch (err) {
    serverError(res, 'Registration failed')
  }
})

router.post('/login', validate('login', 'password'), async (req, res) => {
  try {
    const loginValue = req.body.login.trim()
    const password = req.body.password

    const isEmail = loginValue.includes('@')
    const identifier = isEmail ? loginValue.toLowerCase() : loginValue
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findFirst({ where: { name: identifier } })

    if (!user) return unauthorized(res, 'Invalid email/username or password')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return unauthorized(res, 'Invalid email/username or password')

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    setTokenCookie(res, token)
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } })
  } catch (err) {
    serverError(res, 'Login failed')
  }
})

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' })
  res.json({ message: 'Logged out' })
})

module.exports = router
