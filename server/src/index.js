const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { port } = require('./config/env')

const authRoutes = require('./routes/auth')
const restaurantRoutes = require('./routes/restaurants')
const orderRoutes = require('./routes/orders')
const ownerRoutes = require('./routes/owner')
const riderRoutes = require('./routes/rider')
const adminRoutes = require('./routes/admin')

const app = express()

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/owner', ownerRoutes)
app.use('/api/rider', riderRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
  })
}

module.exports = app
