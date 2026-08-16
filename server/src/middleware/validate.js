const { badRequest } = require('../utils/errors')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_MAX_LENGTH = 100
const TEXT_MAX_LENGTH = 500
const DESCRIPTION_MAX_LENGTH = 2000

const PASSWORD_RULES = {
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
  requireSpecial: true,
}

const PASSWORD_HINT = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'

// Sanitize string input to prevent XSS
function sanitizeString(input, maxLength = TEXT_MAX_LENGTH) {
  if (typeof input !== 'string') return ''
  const trimmed = input.trim()
  if (trimmed.length > maxLength) return trimmed.substring(0, maxLength)
  // Remove potentially dangerous characters while allowing basic text
  return trimmed
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_RULES.minLength) return false
  if (PASSWORD_RULES.requireUpper && !/[A-Z]/.test(password)) return false
  if (PASSWORD_RULES.requireLower && !/[a-z]/.test(password)) return false
  if (PASSWORD_RULES.requireDigit && !/\d/.test(password)) return false
  if (PASSWORD_RULES.requireSpecial && !/[^A-Za-z0-9]/.test(password)) return false
  return true
}

function validate(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.body[f]
      return val === undefined || val === null || (typeof val === 'string' ? val.trim() === '' : val === '')
    })
    if (missing.length > 0) {
      return badRequest(res, `Missing required fields: ${missing.join(', ')}`)
    }
    if (fields.includes('email') && !EMAIL_REGEX.test(req.body.email)) {
      return badRequest(res, 'Invalid email format')
    }
    if (fields.includes('name') && req.body.name.trim().length > NAME_MAX_LENGTH) {
      return badRequest(res, `Name must be under ${NAME_MAX_LENGTH} characters`)
    }
    // Sanitize text fields
    if (fields.includes('address') && req.body.address) {
      req.body.address = sanitizeString(req.body.address, TEXT_MAX_LENGTH)
    }
    if (fields.includes('description') && req.body.description) {
      req.body.description = sanitizeString(req.body.description, DESCRIPTION_MAX_LENGTH)
    }
    if (fields.includes('cuisine') && req.body.cuisine) {
      req.body.cuisine = sanitizeString(req.body.cuisine, 100)
    }
    next()
  }
}

function validatePasswordStrength(req, res, next) {
  if (!validatePassword(req.body.password)) {
    return badRequest(res, PASSWORD_HINT)
  }
  next()
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
    // Sanitize optional text fields
    if (fields.includes('address') && req.body.address) {
      req.body.address = sanitizeString(req.body.address, TEXT_MAX_LENGTH)
    }
    if (fields.includes('description') && req.body.description) {
      req.body.description = sanitizeString(req.body.description, DESCRIPTION_MAX_LENGTH)
    }
    next()
  }
}

module.exports = { validate, validateOptional, validatePassword, validatePasswordStrength, PASSWORD_HINT, sanitizeString }
