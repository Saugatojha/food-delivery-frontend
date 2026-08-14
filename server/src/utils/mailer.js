const { Resend } = require('resend')
const logger = require('../config/logger')

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function verificationUrl(token, email) {
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173'
  return `${origin}/verify-email?token=${encodeURIComponent(token)}${email ? `&email=${encodeURIComponent(email)}` : ''}`
}

function passwordResetUrl(token, email) {
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173'
  return `${origin}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
}

async function sendPasswordResetEmail(user, token) {
  const link = passwordResetUrl(token, user.email)
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV EMAIL] To: ${user.email} — Reset your password: ${link}`)
    return { devLink: link }
  }

  if (!resend) {
    logger.error('RESEND_API_KEY is not set — cannot send email in production')
    throw new Error('RESEND_API_KEY is not configured')
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Hello ${user.name},</p><p>Click below to reset your password. This link expires in 30 minutes.</p><a href="${link}">${link}</a>`,
  })

  if (error) {
    logger.error({ message: 'Resend send error', error: error.message })
    throw error
  }

  return {}
}

async function sendVerificationEmail(user, token) {
  const link = verificationUrl(token, user.email)
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV EMAIL] To: ${user.email} — Verify your account: ${link}`)
    return { devLink: link }
  }

  if (!resend) {
    logger.error('RESEND_API_KEY is not set — cannot send email in production')
    throw new Error('RESEND_API_KEY is not configured')
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    to: user.email,
    subject: 'Verify your email',
    html: `<p>Hello ${user.name},</p><p>Verify your account to finish registering:</p><a href="${link}">${link}</a>`,
  })

  if (error) {
    logger.error({ message: 'Resend send error', error: error.message })
    throw error
  }

  return {}
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, verificationUrl, passwordResetUrl }
