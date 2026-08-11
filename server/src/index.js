const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')
const { port } = require('./config/env')
const { csrfProtection } = require('./middleware/csrf')
const logger = require('./config/logger')

const authRoutes = require('./routes/auth')
const restaurantRoutes = require('./routes/restaurants')
const orderRoutes = require('./routes/orders')
const ownerRoutes = require('./routes/owner')
const riderRoutes = require('./routes/rider')
const adminRoutes = require('./routes/admin')
const cartRoutes = require('./routes/cart')
const uploadRoutes = require('./routes/upload')
const notificationRoutes = require('./routes/notifications')

const app = express()

app.use(helmet())

if (process.env.NODE_ENV !== 'test') {
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 100000,
    message: { error: 'Too many requests. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use('/api', globalLimiter)
}

app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()),
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url, ip: req.ip })
    next()
  })
}

if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy')
  app.use((req, res, next) => {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next()
  })
}

app.use('/api/auth', authRoutes)
app.use('/api', csrfProtection)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/rider', riderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`)
  })
}

module.exports = app
