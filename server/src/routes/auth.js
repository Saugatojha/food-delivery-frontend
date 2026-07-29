const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/database')
const { jwtSecret, jwtExpiresIn } = require('../config/env')
const { authenticate } = require('../middleware/auth')
const { badRequest, conflict, unauthorized, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')

const router = express.Router()

router.post('/register', validate('name', 'email', 'password'), async (req, res) => {
  try {
    const name = req.body.name.trim()
    const email = req.body.email.trim().toLowerCase()
    const password = req.body.password

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return conflict(res, 'Email already registered')

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'customer' },
    })

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } })
  } catch (err) {
    serverError(res, 'Registration failed')
  }
})

router.post('/login', validate('email', 'password'), async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase()
    const password = req.body.password

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return unauthorized(res, 'Invalid email or password')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return unauthorized(res, 'Invalid email or password')

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId } })
  } catch (err) {
    serverError(res, 'Login failed')
  }
})

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
