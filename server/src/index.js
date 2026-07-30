const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const { port } = require('./config/env')
const { csrfProtection } = require('./middleware/csrf')

const authRoutes = require('./routes/auth')
const restaurantRoutes = require('./routes/restaurants')
const orderRoutes = require('./routes/orders')
const ownerRoutes = require('./routes/owner')
const riderRoutes = require('./routes/rider')
const adminRoutes = require('./routes/admin')
const cartRoutes = require('./routes/cart')
const uploadRoutes = require('./routes/upload')

const app = express()

app.use(helmet())
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
app.use(express.json())

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
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

module.exports = app
