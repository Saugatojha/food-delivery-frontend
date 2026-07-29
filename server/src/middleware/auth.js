const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config/env')
const prisma = require('../config/database')
const { unauthorized, forbidden } = require('../utils/errors')

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.token
    if (!token) return unauthorized(res, 'No token provided')
    const decoded = jwt.verify(token, jwtSecret)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })
    if (!user) return unauthorized(res, 'User not found')
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role, restaurantId: user.restaurantId }
    next()
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token')
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'Insufficient permissions')
    }
    next()
  }
}

module.exports = { authenticate, authorize }
