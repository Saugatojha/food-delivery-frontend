const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

router.use(authenticate, authorize('owner'))

router.get('/orders', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
    if (!restaurant) return res.status(404).json({ error: 'No restaurant linked' })

    const orders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

router.get('/menu', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
    if (!restaurant) return res.status(404).json({ error: 'No restaurant linked' })

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { name: 'asc' },
    })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu' })
  }
})

router.post('/menu', async (req, res) => {
  try {
    const { name, price, desc } = req.body
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' })

    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
    if (!restaurant) return res.status(404).json({ error: 'No restaurant linked' })

    const item = await prisma.menuItem.create({
      data: { restaurantId: restaurant.id, name, price: Number(price), desc },
    })
    res.status(201).json(item)
  } catch (err) {
    res.status(500).json({ error: 'Failed to add menu item' })
  }
})

router.patch('/menu/:id', async (req, res) => {
  try {
    const { name, price, desc } = req.body
    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
    if (!restaurant) return res.status(404).json({ error: 'No restaurant linked' })

    const item = await prisma.menuItem.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!item) return res.status(404).json({ error: 'Menu item not found' })

    const updated = await prisma.menuItem.update({
      where: { id: item.id },
      data: { name, price: price ? Number(price) : undefined, desc },
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' })
  }
})

router.delete('/menu/:id', async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: req.user.id } })
    if (!restaurant) return res.status(404).json({ error: 'No restaurant linked' })

    const item = await prisma.menuItem.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!item) return res.status(404).json({ error: 'Menu item not found' })

    await prisma.menuItem.delete({ where: { id: item.id } })
    res.json({ message: 'Menu item deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' })
  }
})

module.exports = router
