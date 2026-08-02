const express = require('express')
const prisma = require('../config/database')
const { authenticate } = require('../middleware/auth')
const { notFound, serverError } = require('../utils/errors')

const router = express.Router()

router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(notifications)
  } catch (err) {
    serverError(res, 'Failed to fetch notifications')
  }
})

router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, read: false },
    })
    res.json({ count })
  } catch (err) {
    serverError(res, 'Failed to fetch unread count')
  }
})

router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: Number(req.params.id), userId: req.user.id },
    })
    if (!notification) return notFound(res, 'Notification not found')

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    })
    res.json(updated)
  } catch (err) {
    serverError(res, 'Failed to mark notification read')
  }
})

router.post('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    })
    res.json({ message: 'All notifications marked read' })
  } catch (err) {
    serverError(res, 'Failed to mark notifications read')
  }
})

module.exports = router
