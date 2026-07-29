export function readJson(key, defaultVal = null) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : defaultVal
  } catch {
    return defaultVal
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeKeys(...keys) {
  keys.forEach(k => localStorage.removeItem(k))
}
