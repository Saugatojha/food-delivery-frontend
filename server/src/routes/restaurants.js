const express = require('express')
const prisma = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { notFound, serverError } = require('../utils/errors')

const router = express.Router()

router.get('/', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
    const search = (req.query.search || '').trim()
    const cuisine = (req.query.cuisine || '').trim()
    const openOnly = req.query.open === 'true'

    const where = {}
    if (search) where.OR = [{ name: { contains: search } }, { cuisine: { contains: search } }]
    if (cuisine) where.cuisine = { equals: cuisine }
    if (openOnly) where.isOpen = true

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.restaurant.count({ where }),
    ])

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    res.json({ restaurants, total, page, limit, totalPages: Math.ceil(total / limit) })
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