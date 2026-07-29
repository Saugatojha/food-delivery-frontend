const express = require('express')
const prisma = require('../config/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: 'asc' },
    })
    res.json(restaurants)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurants' })
  }
})

router.get('/:id/menu', authenticate, async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: Number(req.params.id) } })
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' })

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: Number(req.params.id) },
      orderBy: { name: 'asc' },
    })
    res.json({ restaurant, items })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu' })
  }
})

module.exports = router
