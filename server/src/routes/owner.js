const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { notFound, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')

const router = express.Router()

router.use(authenticate, authorize('owner'))

async function getRestaurant(userId) {
  return prisma.restaurant.findUnique({ where: { ownerId: userId } })
}

async function requireRestaurant(userId, res) {
  const r = await getRestaurant(userId)
  if (!r) notFound(res, 'No restaurant linked')
  return r
}

router.get('/orders', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const orders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (err) {
    serverError(res, 'Failed to fetch orders')
  }
})

router.get('/menu', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { name: 'asc' },
    })
    res.json(items)
  } catch (err) {
    serverError(res, 'Failed to fetch menu')
  }
})

router.post('/menu', validate('name', 'price'), async (req, res) => {
  try {
    const { name, price, desc } = req.body
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const item = await prisma.menuItem.create({
      data: { restaurantId: restaurant.id, name, price: Number(price), desc },
    })
    res.status(201).json(item)
  } catch (err) {
    serverError(res, 'Failed to add menu item')
  }
})

router.patch('/menu/:id', async (req, res) => {
  try {
    const { name, price, desc } = req.body
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const item = await prisma.menuItem.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!item) return notFound(res, 'Menu item not found')

    const updated = await prisma.menuItem.update({
      where: { id: item.id },
      data: { name, price: price ? Number(price) : undefined, desc },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update menu item')
  }
})

router.delete('/menu/:id', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const item = await prisma.menuItem.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!item) return notFound(res, 'Menu item not found')

    await prisma.menuItem.delete({ where: { id: item.id } })
    res.json({ message: 'Menu item deleted' })
  } catch (err) {
    serverError(res, 'Failed to delete menu item')
  }
})

module.exports = router
