const { Resend } = require('resend')
const logger = require('../config/logger')

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function verificationUrl(token) {
  const origin = process.env.APP_URL || 'http://localhost:5000'
  return `${origin}/api/auth/verify-email?token=${token}`
}

async function sendVerificationEmail(user, token) {
  const link = verificationUrl(token)
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

module.exports = { sendVerificationEmail, verificationUrl }
