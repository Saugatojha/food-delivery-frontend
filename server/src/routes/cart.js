const express = require('express')
const prisma = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { badRequest, notFound, serverError } = require('../utils/errors')

const router = express.Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { menuItem: true },
      orderBy: { createdAt: 'asc' },
    })
    res.json(items)
  } catch (err) {
    serverError(res, 'Failed to fetch cart')
  }
})

router.post('/sync', async (req, res) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) return badRequest(res, 'Items array required')

    const valid = []
    for (const i of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: Number(i.menuItemId) } })
      if (!menuItem) return badRequest(res, `Menu item ${i.menuItemId} not found`)
      if (menuItem.restaurantId !== Number(i.restaurantId)) {
        return badRequest(res, `Menu item ${i.menuItemId} does not belong to restaurant ${i.restaurantId}`)
      }
      valid.push({
        userId: req.user.id,
        menuItemId: menuItem.id,
        restaurantId: menuItem.restaurantId,
        quantity: Math.min(99, Math.max(1, Math.floor(Number(i.quantity) || 1))),
      })
    }

    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } })

    if (valid.length > 0) {
      await prisma.cartItem.createMany({ data: valid })
    }

    const saved = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { menuItem: true },
    })
    res.json(saved)
  } catch (err) {
    serverError(res, 'Failed to sync cart')
  }
})

router.post('/add', async (req, res) => {
  try {
    const { menuItemId, restaurantId, quantity } = req.body
    if (!menuItemId || !restaurantId) return badRequest(res, 'menuItemId and restaurantId required')

    const menuItem = await prisma.menuItem.findUnique({ where: { id: Number(menuItemId) } })
    if (!menuItem) return badRequest(res, 'Menu item not found')
    if (menuItem.restaurantId !== Number(restaurantId)) {
      return badRequest(res, 'Menu item does not belong to this restaurant')
    }
    const qty = Math.min(99, Math.max(1, Math.floor(Number(quantity) || 1)))

    const existing = await prisma.cartItem.findFirst({
      where: { userId: req.user.id, menuItemId: menuItem.id },
    })

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(99, existing.quantity + qty) },
        include: { menuItem: true },
      })
      return res.json(updated)
    }

    const item = await prisma.cartItem.create({
      data: { userId: req.user.id, menuItemId: menuItem.id, restaurantId: menuItem.restaurantId, quantity: qty },
      include: { menuItem: true },
    })
    res.status(201).json(item)
  } catch (err) {
    serverError(res, 'Failed to add cart item')
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const item = await prisma.cartItem.findUnique({ where: { id: Number(req.params.id) } })
    if (!item || item.userId !== req.user.id) return notFound(res, 'Cart item not found')
    await prisma.cartItem.delete({ where: { id: item.id } })
    res.json({ message: 'Removed' })
  } catch (err) {
    serverError(res, 'Failed to remove cart item')
  }
})

module.exports = router