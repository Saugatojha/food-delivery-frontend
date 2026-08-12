const LEGACY_HOSTS = ['localhost:5000', '127.0.0.1:5000', '[::1]:5000']

function currentOrigin(req) {
  return process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:5001'}`
}

function rewriteLegacyUrls(value, origin) {
  if (typeof value === 'string') {
    let out = value
    for (const host of LEGACY_HOSTS) {
      out = out.replaceAll(`http://${host}`, origin)
      out = out.replaceAll(`https://${host}`, origin)
    }
    return out
  }
  if (Array.isArray(value)) return value.map((v) => rewriteLegacyUrls(v, origin))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = rewriteLegacyUrls(v, origin)
    return out
  }
  return value
}

function legacyUrlRewriteMiddleware(req, res, next) {
  const origin = currentOrigin(req)
  const originalJson = res.json.bind(res)
  res.json = (body) => originalJson(rewriteLegacyUrls(body, origin))
  next()
}

module.exports = { legacyUrlRewriteMiddleware, rewriteLegacyUrls, currentOrigin }
