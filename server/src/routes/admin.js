const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { serverError } = require('../utils/errors')

const router = express.Router()

router.use(authenticate, authorize('admin'))

router.get('/stats', async (req, res) => {
  try {
    const [users, restaurants, orders] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.order.count(),
    ])
    const revenueAgg = await prisma.order.aggregate({ _sum: { total: true } })
    res.json({ users, restaurants, orders, revenue: revenueAgg._sum.total || 0 })
  } catch (err) {
    serverError(res, 'Failed to fetch stats')
  }
})

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, restaurantId: true },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch (err) {
    serverError(res, 'Failed to fetch users')
  }
})

router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
    res.json(restaurants)
  } catch (err) {
    serverError(res, 'Failed to fetch restaurants')
  }
})

module.exports = router
