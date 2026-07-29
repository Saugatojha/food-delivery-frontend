const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { badRequest, notFound, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')

const router = express.Router()

router.use(authenticate, authorize('rider'))

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

router.patch('/location', validate('latitude', 'longitude'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body

    const delivery = await prisma.delivery.findFirst({
      where: { riderId: req.user.id, status: { in: ['assigned', 'picked_up'] } },
      orderBy: { createdAt: 'desc' },
    })

    if (!delivery) return notFound(res, 'No active delivery found')

    const updated = await prisma.delivery.update({
      where: { id: delivery.id },
      data: { riderLatitude: latitude, riderLongitude: longitude, locationUpdatedAt: new Date() },
    })

    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update location')
  }
})

module.exports = router
