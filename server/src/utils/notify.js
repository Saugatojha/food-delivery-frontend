const prisma = require('../config/database')

async function createNotification({ userId, title, message, type = 'info', orderId = null }) {
  if (!userId) return null
  try {
    return await prisma.notification.create({
      data: { userId, title, message, type, orderId },
    })
  } catch {
    return null
  }
}

async function notifyRestaurantOwner(order, title, message, type = 'order') {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: order.restaurantId },
    select: { ownerId: true },
  })
  if (!restaurant?.ownerId) return null
  return createNotification({ userId: restaurant.ownerId, title, message, type, orderId: order.id })
}

async function notifyCustomer(order, title, message, type = 'order') {
  return createNotification({ userId: order.userId, title, message, type, orderId: order.id })
}

module.exports = { createNotification, notifyRestaurantOwner, notifyCustomer }
