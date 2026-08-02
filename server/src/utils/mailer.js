const logger = require('../config/logger')

function verificationUrl(token) {
  const origin = process.env.APP_URL || 'http://localhost:5000'
  return `${origin}/api/auth/verify-email?token=${token}`
}

function sendVerificationEmail(user, token) {
  const link = verificationUrl(token)
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[DEV EMAIL] To: ${user.email} — Verify your account: ${link}`)
    console.log('\n============================================')
    console.log(`VERIFY EMAIL for ${user.email}`)
    console.log(`Open this link to verify your account:\n${link}`)
    console.log('============================================\n')
    return { devLink: link }
  }

  // Production: plug in a real mail provider (e.g. nodemailer/Resend/SendGrid) here.
  logger.info(`Verification email would be sent to ${user.email}`)
  return {}
}

module.exports = { sendVerificationEmail, verificationUrl }
