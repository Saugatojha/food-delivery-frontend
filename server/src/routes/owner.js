const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { notFound, badRequest, forbidden, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')
const { isValidTransition, TERMINAL_STATUSES } = require('../utils/statusFlow')

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

router.get('/restaurant', async (req, res) => {
  try {
    const r = await getRestaurant(req.user.id)
    if (!r) return notFound(res, 'No restaurant linked')
    res.json(r)
  } catch (err) {
    serverError(res, 'Failed to fetch restaurant')
  }
})

router.patch('/restaurant', async (req, res) => {
  try {
    const restaurant = await getRestaurant(req.user.id)
    if (!restaurant) return notFound(res, 'No restaurant linked')
    const { name, cuisine, deliveryTime, isOpen, image } = req.body
    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: name || undefined,
        cuisine: cuisine || undefined,
        deliveryTime: deliveryTime || undefined,
        isOpen: isOpen !== undefined ? isOpen : undefined,
        image: image !== undefined ? image : undefined,
      },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update restaurant')
  }
})

router.patch('/orders/:id/status', validate('status'), async (req, res) => {
  try {
    const { status } = req.body
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const order = await prisma.order.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!order) return notFound(res, 'Order not found')

    if (TERMINAL_STATUSES.includes(order.status)) {
      return badRequest(res, 'Cannot update a terminal order')
    }

    if (!isValidTransition(order.status, status, 'owner')) {
      return forbidden(res, `Cannot transition from ${order.status} to ${status}`)
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update order')
  }
})

module.exports = router
