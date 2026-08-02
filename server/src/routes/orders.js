const express = require('express')
const prisma = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { isValidTransition, TERMINAL_STATUSES } = require('../utils/statusFlow')
const { badRequest, notFound, forbidden, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')
const { notifyRestaurantOwner } = require('../utils/notify')

const router = express.Router()

router.post('/', authenticate, validate('address'), async (req, res) => {
  try {
    const { items, address, phone, paymentMethod, deliveryLatitude, deliveryLongitude } = req.body
    if (!items || !items.length) return badRequest(res, 'Items required')

    const restaurantId = items[0].restaurantId
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant || !restaurant.isOpen) return badRequest(res, 'Restaurant is closed or not found')

    let total = 0
    const orderItems = []
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } })
      if (!menuItem) return badRequest(res, `Menu item ${item.menuItemId} not found`)
      total += menuItem.price * item.quantity
      orderItems.push({ menuItemId: menuItem.id, quantity: item.quantity, price: menuItem.price })
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        restaurantId,
        total,
        address,
        phone,
        paymentMethod: paymentMethod || 'cash',
        status: 'Pending',
        deliveryLatitude: deliveryLatitude || null,
        deliveryLongitude: deliveryLongitude || null,
        items: { create: orderItems },
        payment: { create: { method: paymentMethod || 'cash', status: 'completed' } },
        delivery: { create: { address, status: 'assigned' } },
      },
      include: { items: true, payment: true, delivery: true },
    })

    res.status(201).json(order)

    notifyRestaurantOwner(
      order,
      'New order received',
      `New order #${order.id} for NPR ${order.total.toFixed(2)} — check your dashboard.`,
      'order',
    )
  } catch (err) {
    serverError(res, 'Failed to create order')
  }
})

router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (err) {
    serverError(res, 'Failed to fetch orders')
  }
})

router.get('/tracking/:id', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        items: { include: { menuItem: true } },
        restaurant: { select: { latitude: true, longitude: true } },
        delivery: { select: { riderLatitude: true, riderLongitude: true, locationUpdatedAt: true } },
      },
    })
    if (!order) return notFound(res, 'Order not found')
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return forbidden(res, 'Not your order')
    }
    res.json(order)
  } catch (err) {
    serverError(res, 'Failed to fetch tracking')
  }
})

router.patch('/:id/status', authenticate, validate('status'), async (req, res) => {
  try {
    const { status } = req.body

    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } })
    if (!order) return notFound(res, 'Order not found')

    const current = order.status
    if (TERMINAL_STATUSES.includes(current)) {
      return badRequest(res, 'Cannot update a terminal order')
    }

    const role = req.user.role
    if (!isValidTransition(current, status, role)) {
      return forbidden(res, `Invalid transition from ${current} to ${status} for role ${role}`)
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
    })

    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update status')
  }
})

module.exports = router
