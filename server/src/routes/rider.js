const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')

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
    res.status(500).json({ error: 'Failed to fetch deliveries' })
  }
})

router.patch('/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Latitude and longitude required' })
    }

    const delivery = await prisma.delivery.findFirst({
      where: { riderId: req.user.id, status: { in: ['assigned', 'picked_up'] } },
      orderBy: { createdAt: 'desc' },
    })

    if (!delivery) return res.status(404).json({ error: 'No active delivery found' })

    const updated = await prisma.delivery.update({
      where: { id: delivery.id },
      data: { riderLatitude: latitude, riderLongitude: longitude, locationUpdatedAt: new Date() },
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' })
  }
})

module.exports = router
