const express = require('express')
const prisma = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { notFound, serverError } = require('../utils/errors')

const router = express.Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { name: 'asc' },
    })
    res.json(restaurants)
  } catch (err) {
    serverError(res, 'Failed to fetch restaurants')
  }
})

router.get('/:id/menu', authenticate, async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: Number(req.params.id) } })
    if (!restaurant) return notFound(res, 'Restaurant not found')

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: Number(req.params.id) },
      orderBy: { name: 'asc' },
    })
    res.json({ restaurant, items })
  } catch (err) {
    serverError(res, 'Failed to fetch menu')
  }
})

module.exports = router
