const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { notFound, badRequest, forbidden, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')
const { isValidTransition, TERMINAL_STATUSES } = require('../utils/statusFlow')
const { notifyCustomer } = require('../utils/notify')

const router = express.Router()

router.use(authenticate, authorize('owner', 'rider'))

router.get('/riders', async (req, res) => {
  try {
    const riders = await prisma.user.findMany({
      where: { role: 'rider' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    res.json(riders)
  } catch (err) {
    serverError(res, 'Failed to fetch riders')
  }
})

async function getRestaurant(userId) {
  return prisma.restaurant.findUnique({ where: { ownerId: userId } })
}

async function requireRestaurant(userId, res) {
  const r = await getRestaurant(userId)
  if (!r) notFound(res, 'No restaurant linked')
  return r
}

router.get('/orders', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const orders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: { include: { rider: { select: { id: true, name: true, email: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (err) {
    serverError(res, 'Failed to fetch orders')
  }
})

router.get('/menu', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { name: 'asc' },
    })
    res.json(items)
  } catch (err) {
    serverError(res, 'Failed to fetch menu')
  }
})

router.post('/menu', validate('name', 'price'), async (req, res) => {
  try {
    const { name, price, category, subCategory, desc, image } = req.body
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const item = await prisma.menuItem.create({
      data: { restaurantId: restaurant.id, name, price: Number(price), category: category || 'General', subCategory: subCategory || 'General', desc, image },
    })
    res.status(201).json(item)
  } catch (err) {
    serverError(res, 'Failed to add menu item')
  }
})

router.patch('/menu/:id', async (req, res) => {
  try {
    const { name, price, category, subCategory, desc, image } = req.body
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const item = await prisma.menuItem.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!item) return notFound(res, 'Menu item not found')

    const updated = await prisma.menuItem.update({
      where: { id: item.id },
      data: { name, price: price ? Number(price) : undefined, category, subCategory, desc, image },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update menu item')
  }
})

router.delete('/menu/:id', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const item = await prisma.menuItem.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!item) return notFound(res, 'Menu item not found')

    await prisma.menuItem.delete({ where: { id: item.id } })
    res.json({ message: 'Menu item deleted' })
  } catch (err) {
    serverError(res, 'Failed to delete menu item')
  }
})

// Get all unique categories for this restaurant's menu
router.get('/menu/categories', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const items = await prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id },
      select: { category: true },
      distinct: ['category'],
    })
    const categories = items.map(i => i.category).sort()
    res.json(categories)
  } catch (err) {
    serverError(res, 'Failed to fetch categories')
  }
})

// Add a new category (just creating an empty slot or marker)
router.post('/menu/categories', validate('name'), async (req, res) => {
  try {
    const { name } = req.body
    if (!name || name.trim().length === 0) {
      return badRequest(res, 'Category name cannot be empty')
    }
    if (name.length > 50) {
      return badRequest(res, 'Category name must be under 50 characters')
    }
    res.status(201).json({ category: name.trim() })
  } catch (err) {
    serverError(res, 'Failed to add category')
  }
})

// Rename a category (update all items with old category to new category)
router.patch('/menu/categories/:oldName', validate('newName'), async (req, res) => {
  try {
    const { oldName } = req.params
    const { newName } = req.body
    
    if (!newName || newName.trim().length === 0) {
      return badRequest(res, 'New category name cannot be empty')
    }
    if (newName.length > 50) {
      return badRequest(res, 'Category name must be under 50 characters')
    }

    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const updated = await prisma.menuItem.updateMany({
      where: { restaurantId: restaurant.id, category: oldName },
      data: { category: newName.trim() },
    })

    if (updated.count === 0) {
      return notFound(res, 'Category not found')
    }

    res.json({ message: `Renamed ${updated.count} items`, newCategory: newName.trim() })
  } catch (err) {
    serverError(res, 'Failed to rename category')
  }
})

// Delete a category (remove all items in this category)
router.delete('/menu/categories/:name', async (req, res) => {
  try {
    const { name } = req.params
    
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const deleted = await prisma.menuItem.deleteMany({
      where: { restaurantId: restaurant.id, category: name },
    })

    if (deleted.count === 0) {
      return notFound(res, 'Category not found')
    }

    res.json({ message: `Deleted ${deleted.count} items from category` })
  } catch (err) {
    serverError(res, 'Failed to delete category')
  }
})

router.get('/restaurant', async (req, res) => {
  try {
    const r = await getRestaurant(req.user.id)
    if (!r) return notFound(res, 'No restaurant linked')
    res.json(r)
  } catch (err) {
    serverError(res, 'Failed to fetch restaurant')
  }
})

router.patch('/restaurant', async (req, res) => {
  try {
    const restaurant = await getRestaurant(req.user.id)
    if (!restaurant) return notFound(res, 'No restaurant linked')
    const { name, cuisine, deliveryTime, isOpen, image } = req.body
    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: name || undefined,
        cuisine: cuisine || undefined,
        deliveryTime: deliveryTime || undefined,
        isOpen: isOpen !== undefined ? isOpen : undefined,
        image: image !== undefined ? image : undefined,
      },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to update restaurant')
  }
})

router.patch('/orders/:id/rider', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const order = await prisma.order.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!order) return notFound(res, 'Order not found')
    if (TERMINAL_STATUSES.includes(order.status)) return badRequest(res, 'Cannot assign a rider to a terminal order')

    const riderId = Number(req.body.riderId)
    if (!riderId) return badRequest(res, 'Rider is required')

    const rider = await prisma.user.findFirst({ where: { id: riderId, role: 'rider' } })
    if (!rider) return badRequest(res, 'Rider not found')

    await prisma.delivery.upsert({
      where: { orderId: order.id },
      update: { riderId: rider.id, status: 'assigned', address: order.address },
      create: { orderId: order.id, riderId: rider.id, address: order.address, status: 'assigned' },
    })

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: { include: { rider: { select: { id: true, name: true, email: true } } } } },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to assign rider')
  }
})

router.post('/orders/:id/auto-assign-rider', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const order = await prisma.order.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!order) return notFound(res, 'Order not found')

    const rider = await prisma.user.findFirst({
      where: { role: 'rider' },
      orderBy: { name: 'asc' },
    })

    if (!rider) {
      return res.json({ rider: null, message: 'No riders available' })
    }

    await prisma.delivery.upsert({
      where: { orderId: order.id },
      update: { riderId: rider.id, status: 'assigned', address: order.address },
      create: { orderId: order.id, riderId: rider.id, address: order.address, status: 'assigned' },
    })

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: { include: { rider: { select: { id: true, name: true, email: true } } } } },
    })

    res.json({ rider: { id: rider.id, name: rider.name, email: rider.email }, order: updated })
  } catch (err) {
    serverError(res, 'Failed to auto-assign rider')
  }
})

router.patch('/orders/:id/status', validate('status'), async (req, res) => {
  try {
    const { status, riderId } = req.body
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const order = await prisma.order.findFirst({
      where: { id: Number(req.params.id), restaurantId: restaurant.id },
    })
    if (!order) return notFound(res, 'Order not found')

    if (TERMINAL_STATUSES.includes(order.status)) {
      return badRequest(res, 'Cannot update a terminal order')
    }

    if (!isValidTransition(order.status, status, 'owner')) {
      return forbidden(res, `Cannot transition from ${order.status} to ${status}`)
    }

    if (status === 'Confirmed') {
      const assignedRiderId = Number(riderId)
      if (!assignedRiderId) return badRequest(res, 'Rider is required before accepting the order')
      const rider = await prisma.user.findFirst({ where: { id: assignedRiderId, role: 'rider' } })
      if (!rider) return badRequest(res, 'Rider not found')

      await prisma.delivery.upsert({
        where: { orderId: order.id },
        update: { riderId: rider.id, status: 'assigned', address: order.address },
        create: { orderId: order.id, riderId: rider.id, address: order.address, status: 'assigned' },
      })
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: { include: { rider: { select: { id: true, name: true, email: true } } } } },
    })
    res.json(updated)

    if (status === 'Confirmed') {
      notifyCustomer(order, 'Order accepted', `Great news — order #${order.id} has been accepted by the restaurant.`)
    } else if (status === 'Rejected') {
      notifyCustomer(order, 'Order declined', `Sorry, order #${order.id} was declined by the restaurant.`)
    }
  } catch (err) {
    serverError(res, 'Failed to update order')
  }
})

module.exports = router


