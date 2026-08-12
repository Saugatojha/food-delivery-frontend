import axios from 'axios'
import { removeKeys } from '../utils/storage'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 10000,
})

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/)
  return match ? match[1] : null
}

api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const token = getCsrfToken()
    if (token) config.headers['X-CSRF-Token'] = token
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !PUBLIC_PATHS.includes(window.location.pathname)) {
      removeKeys('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
