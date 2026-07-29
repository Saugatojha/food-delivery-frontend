const { badRequest } = require('../utils/errors')

function validate(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '')
    if (missing.length > 0) {
      return badRequest(res, `Missing required fields: ${missing.join(', ')}`)
    }
    next()
  }
}

function validateOptional(...fields) {
  return (req, res, next) => {
    const invalid = fields.filter(f => {
      if (req.body[f] !== undefined && (req.body[f] === null || req.body[f] === '')) return true
      return false
    })
    if (invalid.length > 0) {
      return badRequest(res, `Invalid empty values for: ${invalid.join(', ')}`)
    }
    next()
  }
}

module.exports = { validate, validateOptional }
