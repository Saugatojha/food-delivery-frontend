const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { badRequest, notFound, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')
const { isValidTransition, TERMINAL_STATUSES } = require('../utils/statusFlow')
const { notifyCustomer } = require('../utils/notify')

const router = express.Router()

router.use(authenticate, authorize('rider', 'owner'))

async function canManageOrder(order, userId) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: order.restaurantId } })
  if (restaurant?.ownerId === userId) return true
  const assigned = await prisma.delivery.findUnique({ where: { orderId: order.id } })
  return Boolean(assigned && assigned.riderId === userId)
}

router.get('/deliveries', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['Ready for Pickup', 'Out for Delivery'] } },
      include: { items: { include: { menuItem: true } }, delivery: true, restaurant: true },
      orderBy: { createdAt: 'asc' },
    })
    res.json(orders)
  } catch (err) {
    serverError(res, 'Failed to fetch deliveries')
  }
})

router.get('/my-deliveries', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { delivery: { riderId: req.user.id } },
      include: { items: { include: { menuItem: true } }, delivery: true, restaurant: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (err) {
    serverError(res, 'Failed to fetch your deliveries')
  }
})

router.patch('/orders/:id/status', validate('status'), async (req, res) => {
  try {
    const { status } = req.body

    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } })
    if (!order) return notFound(res, 'Order not found')

    if (!(await canManageOrder(order, req.user.id))) {
      return res.status(403).json({ error: 'Not your delivery' })
    }

    if (TERMINAL_STATUSES.includes(order.status)) {
      return badRequest(res, 'Cannot update a terminal order')
    }

    if (!isValidTransition(order.status, status, 'rider')) {
      return badRequest(res, `Invalid transition from ${order.status} to ${status}`)
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true, restaurant: true },
    })
    res.json(updated)

    if (status === 'Out for Delivery') {
      notifyCustomer(order, 'Out for delivery', `Your rider is on the way with order #${order.id}.`)
    } else if (status === 'Delivered') {
      notifyCustomer(order, 'Order delivered', `Order #${order.id} has been delivered. Enjoy your meal!`)
    }
  } catch (err) {
    serverError(res, 'Failed to update delivery status')
  }
})

router.patch('/orders/:id/accept', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { delivery: true },
    })
    if (!order) return notFound(res, 'Order not found')
    if (order.status !== 'Ready for Pickup') return badRequest(res, 'Order is not ready for pickup')

    if (!(await canManageOrder(order, req.user.id))) {
      return res.status(403).json({ error: 'Not your delivery' })
    }

    await prisma.delivery.upsert({
      where: { orderId: order.id },
      update: { riderId: req.user.id, status: 'assigned' },
      create: { orderId: order.id, riderId: req.user.id, address: order.address, status: 'assigned' },
    })

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'Out for Delivery' },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true, restaurant: true },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to accept delivery')
  }
})

router.patch('/orders/:id/reject', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } })
    if (!order) return notFound(res, 'Order not found')
    if (order.status !== 'Ready for Pickup') return badRequest(res, 'Order is not ready for pickup')

    if (!(await canManageOrder(order, req.user.id))) {
      return res.status(403).json({ error: 'Not your delivery' })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'Pending' },
    })
    await prisma.delivery.deleteMany({ where: { orderId: order.id } })
    res.json({ message: 'Delivery rejected' })
  } catch (err) {
    serverError(res, 'Failed to reject delivery')
  }
})

router.get('/earnings', async (req, res) => {
  try {
    const deliveries = await prisma.order.findMany({
      where: {
        delivery: { riderId: req.user.id },
        status: 'Delivered',
      },
      select: { total: true, createdAt: true, id: true },
      orderBy: { createdAt: 'desc' },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    const daily = deliveries.filter(o => new Date(o.createdAt) >= today)
    const weekly = deliveries.filter(o => new Date(o.createdAt) >= weekStart)
    const totalEarnings = deliveries.reduce((s, o) => s + o.total, 0)

    res.json({
      totalEarnings,
      totalDeliveries: deliveries.length,
      dailyEarnings: daily.reduce((s, o) => s + o.total, 0),
      dailyCount: daily.length,
      weeklyEarnings: weekly.reduce((s, o) => s + o.total, 0),
      weeklyCount: weekly.length,
    })
  } catch (err) {
    serverError(res, 'Failed to fetch earnings')
  }
})

module.exports = router
