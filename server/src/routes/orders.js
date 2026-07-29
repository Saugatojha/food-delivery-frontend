const express = require('express')
const prisma = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { isValidTransition, getNextStatus, FLOWS, TERMINAL_STATUSES } = require('../utils/statusFlow')

const router = express.Router()

router.post('/', authenticate, async (req, res) => {
  try {
    const { items, address, paymentMethod, deliveryLatitude, deliveryLongitude } = req.body
    if (!items || !items.length || !address) {
      return res.status(400).json({ error: 'Items and address required' })
    }

    const restaurantId = items[0].restaurantId
    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
    if (!restaurant || !restaurant.isOpen) {
      return res.status(400).json({ error: 'Restaurant is closed or not found' })
    }

    let total = 0
    const orderItems = []
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } })
      if (!menuItem) return res.status(400).json({ error: `Menu item ${item.menuItemId} not found` })
      const lineTotal = menuItem.price * item.quantity
      total += lineTotal
      orderItems.push({ menuItemId: menuItem.id, quantity: item.quantity, price: menuItem.price })
    }

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        restaurantId,
        total,
        address,
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order' })
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
    res.status(500).json({ error: 'Failed to fetch orders' })
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
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not your order' })
    }
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tracking' })
  }
})

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'Status required' })

    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } })
    if (!order) return res.status(404).json({ error: 'Order not found' })

    const current = order.status
    if (TERMINAL_STATUSES.includes(current)) {
      return res.status(400).json({ error: 'Cannot update a terminal order' })
    }

    const role = req.user.role
    if (!isValidTransition(current, status, role)) {
      return res.status(403).json({ error: `Invalid transition from ${current} to ${status} for role ${role}` })
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' })
  }
})

module.exports = router
