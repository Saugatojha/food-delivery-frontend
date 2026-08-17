const express = require('express')
const prisma = require('../config/database')
const { authenticate, authorize } = require('../middleware/auth')
const { notFound, badRequest, forbidden, serverError } = require('../utils/errors')
const { validate } = require('../middleware/validate')
const { isValidTransition, TERMINAL_STATUSES } = require('../utils/statusFlow')
const { notifyCustomer } = require('../utils/notify')

const router = express.Router()

router.use(authenticate, authorize('owner'))

router.get('/riders', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const riders = await prisma.user.findMany({
      where: { role: 'rider', restaurantId: restaurant.id },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    })
    res.json(riders)
  } catch (err) {
    serverError(res, 'Failed to fetch riders')
  }
})

router.post('/riders', validate('name', 'email', 'password'), async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const { name, email, password } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return badRequest(res, 'Email already in use')

    const bcrypt = require('bcryptjs')
    const hashed = await bcrypt.hash(password, 10)
    const rider = await prisma.user.create({
      data: { name, email, password: hashed, role: 'rider', restaurantId: restaurant.id, emailVerified: true },
      select: { id: true, name: true, email: true },
    })
    res.status(201).json(rider)
  } catch (err) {
    serverError(res, 'Failed to add rider')
  }
})

router.delete('/riders/:id', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const riderId = Number(req.params.id)
    const rider = await prisma.user.findFirst({ where: { id: riderId, role: 'rider', restaurantId: restaurant.id } })
    if (!rider) return notFound(res, 'Rider not found in your restaurant')

    const activeDeliveries = await prisma.delivery.findMany({
      where: { riderId, order: { status: { in: ['Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery'] } } },
    })
    if (activeDeliveries.length > 0) return badRequest(res, 'Cannot remove rider with active deliveries')

    await prisma.user.update({ where: { id: riderId }, data: { restaurantId: null } })
    res.json({ message: 'Rider removed from restaurant' })
  } catch (err) {
    serverError(res, 'Failed to remove rider')
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
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
      orderBy: { createdAt: 'desc' },
    })

    const riderIds = [...new Set(orders.map(o => o.delivery?.riderId).filter(Boolean))]
    let riders = []
    if (riderIds.length > 0) {
      riders = await prisma.user.findMany({
        where: { id: { in: riderIds } },
        select: { id: true, name: true, email: true },
      })
    }
    const riderMap = Object.fromEntries(riders.map(r => [r.id, r]))

    const enriched = orders.map(o => ({
      ...o,
      delivery: o.delivery ? { ...o.delivery, rider: riderMap[o.delivery.riderId] || null } : null,
    }))

    res.json(enriched)
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

    const catName = (category || 'General').trim()
    await prisma.category.upsert({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: catName } },
      update: {},
      create: { restaurantId: restaurant.id, name: catName },
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

// Get all categories with subcategories for this restaurant
router.get('/menu/categories', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const cats = await prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      include: { subCategories: { select: { id: true, name: true }, orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    })
    res.json(cats.map(c => ({ name: c.name, subCategories: c.subCategories })))
  } catch (err) {
    serverError(res, 'Failed to fetch categories')
  }
})

// Add a new category
router.post('/menu/categories', validate('name'), async (req, res) => {
  try {
    const { name } = req.body
    if (!name || name.trim().length === 0) {
      return badRequest(res, 'Category name cannot be empty')
    }
    if (name.length > 50) {
      return badRequest(res, 'Category name must be under 50 characters')
    }

    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const existing = await prisma.category.findUnique({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: name.trim() } },
    })
    if (existing) return badRequest(res, 'Category already exists')

    await prisma.category.create({
      data: { restaurantId: restaurant.id, name: name.trim() },
    })
    res.status(201).json({ category: name.trim() })
  } catch (err) {
    serverError(res, 'Failed to add category')
  }
})

// Rename a category (update Category table and all menu items)
router.patch('/menu/categories/:oldName', validate('newName'), async (req, res) => {
  try {
    const { oldName } = req.params
    const { newName } = req.body
    
    if (!newName || newName.trim().length === 0) {
      return badRequest(res, 'New category name cannot be empty')
    }
    if (newName.length > 50) {
      return badRequest(res, 'New category name must be under 50 characters')
    }

    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const cat = await prisma.category.findUnique({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: oldName } },
    })
    if (!cat) return notFound(res, 'Category not found')

    const dup = await prisma.category.findUnique({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: newName.trim() } },
    })
    if (dup && dup.id !== cat.id) return badRequest(res, 'A category with that name already exists')

    await prisma.category.update({ where: { id: cat.id }, data: { name: newName.trim() } })

    await prisma.menuItem.updateMany({
      where: { restaurantId: restaurant.id, category: oldName },
      data: { category: newName.trim() },
    })

    res.json({ message: 'Category renamed', newCategory: newName.trim() })
  } catch (err) {
    serverError(res, 'Failed to rename category')
  }
})

// Delete a category (remove from Category table and delete all items in it)
router.delete('/menu/categories/:name', async (req, res) => {
  try {
    const { name } = req.params
    
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const cat = await prisma.category.findUnique({
      where: { restaurantId_name: { restaurantId: restaurant.id, name } },
    })
    if (!cat) return notFound(res, 'Category not found')

    const deleted = await prisma.menuItem.deleteMany({
      where: { restaurantId: restaurant.id, category: name },
    })

    await prisma.category.delete({ where: { id: cat.id } })

    res.json({ message: `Deleted category and ${deleted.count} items` })
  } catch (err) {
    serverError(res, 'Failed to delete category')
  }
})

// Add a subcategory under a category
router.post('/menu/subcategories', validate('name', 'category'), async (req, res) => {
  try {
    const { name, category } = req.body
    if (!name || name.trim().length === 0) return badRequest(res, 'Subcategory name cannot be empty')
    if (name.length > 50) return badRequest(res, 'Subcategory name must be under 50 characters')

    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const cat = await prisma.category.findUnique({
      where: { restaurantId_name: { restaurantId: restaurant.id, name: category } },
    })
    if (!cat) return notFound(res, 'Category not found')

    const existing = await prisma.subCategory.findUnique({
      where: { categoryId_name: { categoryId: cat.id, name: name.trim() } },
    })
    if (existing) return badRequest(res, 'Subcategory already exists')

    const sub = await prisma.subCategory.create({
      data: { categoryId: cat.id, name: name.trim() },
    })
    res.status(201).json({ id: sub.id, name: sub.name, category })
  } catch (err) {
    serverError(res, 'Failed to add subcategory')
  }
})

// Delete a subcategory
router.delete('/menu/subcategories/:id', async (req, res) => {
  try {
    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const subId = Number(req.params.id)
    const sub = await prisma.subCategory.findUnique({
      where: { id: subId },
      include: { category: true },
    })
    if (!sub || sub.category.restaurantId !== restaurant.id) return notFound(res, 'Subcategory not found')

    await prisma.menuItem.updateMany({
      where: { restaurantId: restaurant.id, category: sub.category.name, subCategory: sub.name },
      data: { subCategory: 'General' },
    })

    await prisma.subCategory.delete({ where: { id: subId } })
    res.json({ message: 'Subcategory deleted' })
  } catch (err) {
    serverError(res, 'Failed to delete subcategory')
  }
})

// Rename a subcategory
router.patch('/menu/subcategories/:id', validate('name'), async (req, res) => {
  try {
    const { name } = req.body
    if (!name || name.trim().length === 0) return badRequest(res, 'Name cannot be empty')

    const restaurant = await requireRestaurant(req.user.id, res)
    if (!restaurant) return

    const subId = Number(req.params.id)
    const sub = await prisma.subCategory.findUnique({
      where: { id: subId },
      include: { category: true },
    })
    if (!sub || sub.category.restaurantId !== restaurant.id) return notFound(res, 'Subcategory not found')

    const dup = await prisma.subCategory.findUnique({
      where: { categoryId_name: { categoryId: sub.categoryId, name: name.trim() } },
    })
    if (dup && dup.id !== sub.id) return badRequest(res, 'Subcategory name already exists')

    await prisma.subCategory.update({ where: { id: subId }, data: { name: name.trim() } })

    await prisma.menuItem.updateMany({
      where: { restaurantId: restaurant.id, category: sub.category.name, subCategory: sub.name },
      data: { subCategory: name.trim() },
    })

    res.json({ message: 'Subcategory renamed', name: name.trim() })
  } catch (err) {
    serverError(res, 'Failed to rename subcategory')
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

    const rider = await prisma.user.findFirst({ where: { id: riderId, role: 'rider', restaurantId: restaurant.id } })
    if (!rider) return badRequest(res, 'Rider not found in your restaurant')

    await prisma.delivery.upsert({
      where: { orderId: order.id },
      update: { riderId: rider.id, status: 'assigned', address: order.address },
      create: { orderId: order.id, riderId: rider.id, address: order.address, status: 'assigned' },
    })

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
    })

    if (updated.delivery?.riderId) {
      const rider = await prisma.user.findUnique({
        where: { id: updated.delivery.riderId },
        select: { id: true, name: true, email: true },
      })
      updated.delivery.rider = rider || null
    }

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
      where: { role: 'rider', restaurantId: restaurant.id },
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
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
    })

    if (updated.delivery?.riderId) {
      const riderRecord = await prisma.user.findUnique({
        where: { id: updated.delivery.riderId },
        select: { id: true, name: true, email: true },
      })
      updated.delivery.rider = riderRecord || null
    }

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
      const rider = await prisma.user.findFirst({ where: { id: assignedRiderId, role: 'rider', restaurantId: restaurant.id } })
      if (!rider) return badRequest(res, 'Rider not found in your restaurant')

      await prisma.delivery.upsert({
        where: { orderId: order.id },
        update: { riderId: rider.id, status: 'assigned', address: order.address },
        create: { orderId: order.id, riderId: rider.id, address: order.address, status: 'assigned' },
      })
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status },
      include: { items: { include: { menuItem: true } }, payment: true, delivery: true },
    })

    if (updated.delivery?.riderId) {
      const rider = await prisma.user.findUnique({
        where: { id: updated.delivery.riderId },
        select: { id: true, name: true, email: true },
      })
      updated.delivery.rider = rider || null
    }

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


