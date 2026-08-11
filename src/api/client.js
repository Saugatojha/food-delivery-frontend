import axios from 'axios'
import { removeKeys } from '../utils/storage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
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
    if (err.response?.status === 401) {
      removeKeys('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
