const { badRequest } = require('../utils/errors')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_MAX_LENGTH = 100
const MAX_INPUT_LENGTH = 2000
const PASSWORD_RULES = {
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
  requireSpecial: true,
}

const PASSWORD_HINT = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
const SENSITIVE_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'confirmPassword'])

function sanitizeString(value) {
  if (typeof value !== 'string') return value
  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, MAX_INPUT_LENGTH)
}

function sanitizeObject(value, key) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [childKey, childValue]) => {
      acc[childKey] = sanitizeObject(childValue, childKey)
      return acc
    }, {})
  }
  if (typeof value === 'string') {
    return SENSITIVE_KEYS.has(key) ? value : sanitizeString(value)
  }
  return value
}

function sanitizeRequest(req, res, next) {
  if (req.body) req.body = sanitizeObject(req.body)
  if (req.query) req.query = sanitizeObject(req.query)
  if (req.params) req.params = sanitizeObject(req.params)
  next()
}

function validate(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '')
    if (missing.length > 0) {
      return badRequest(res, `Missing required fields: ${missing.join(', ')}`)
    }
    if (fields.includes('email') && !EMAIL_REGEX.test(req.body.email)) {
      return badRequest(res, 'Invalid email format')
    }
    if (fields.includes('name') && req.body.name.trim().length > NAME_MAX_LENGTH) {
      return badRequest(res, `Name must be under ${NAME_MAX_LENGTH} characters`)
    }
    next()
  }
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < PASSWORD_RULES.minLength) return false
  if (PASSWORD_RULES.requireUpper && !/[A-Z]/.test(password)) return false
  if (PASSWORD_RULES.requireLower && !/[a-z]/.test(password)) return false
  if (PASSWORD_RULES.requireDigit && !/\d/.test(password)) return false
  if (PASSWORD_RULES.requireSpecial && !/[^A-Za-z0-9]/.test(password)) return false
  return true
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
    next()
  }
}

module.exports = {
  sanitizeRequest,
  validate,
  validateOptional,
  validatePassword,
  validatePasswordStrength,
  PASSWORD_HINT,
}
