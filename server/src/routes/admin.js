const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { badRequest, notFound, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')

const router = express.Router()

const VALID_ROLES = ['customer', 'owner', 'rider', 'admin']

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

router.patch('/users/:id', async (req, res) => {
  try {
    const { role, restaurantId } = req.body
    const id = Number(req.params.id)
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return notFound(res, 'User not found')
    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return badRequest(res, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`)
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { role: role || undefined, restaurantId: restaurantId !== undefined ? restaurantId : undefined },
      select: { id: true, name: true, email: true, role: true, restaurantId: true },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update user')
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

router.post('/restaurants', validate('name', 'cuisine'), async (req, res) => {
  try {
    const { name, cuisine, rating, deliveryTime, isOpen, ownerId, latitude, longitude, image } = req.body
    const restaurant = await prisma.restaurant.create({
      data: {
        name, cuisine,
        rating: rating || 0,
        deliveryTime: deliveryTime || '25-35 min',
        isOpen: isOpen !== undefined ? isOpen : true,
        ownerId: ownerId || null,
        latitude: latitude || null,
        longitude: longitude || null,
        image: image || null,
      },
    })
    res.status(201).json(restaurant)
  } catch (err) {
    serverError(res, 'Failed to create restaurant')
  }
})

router.patch('/restaurants/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.restaurant.findUnique({ where: { id } })
    if (!existing) return notFound(res, 'Restaurant not found')
    const { name, cuisine, rating, deliveryTime, isOpen, ownerId, latitude, longitude, image } = req.body
    const updated = await prisma.restaurant.update({
      where: { id },
      data: {
        name: name || undefined,
        cuisine: cuisine || undefined,
        rating: rating !== undefined ? rating : undefined,
        deliveryTime: deliveryTime || undefined,
        isOpen: isOpen !== undefined ? isOpen : undefined,
        ownerId: ownerId !== undefined ? ownerId : undefined,
        latitude: latitude !== undefined ? latitude : undefined,
        longitude: longitude !== undefined ? longitude : undefined,
        image: image !== undefined ? image : undefined,
      },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update restaurant')
  }
})

router.delete('/restaurants/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const existing = await prisma.restaurant.findUnique({ where: { id } })
    if (!existing) return notFound(res, 'Restaurant not found')
    await prisma.restaurant.delete({ where: { id } })
    res.json({ message: 'Restaurant deleted' })
  } catch (err) {
    serverError(res, 'Failed to delete restaurant')
  }
})

module.exports = router
