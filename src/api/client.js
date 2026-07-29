import axios from 'axios'
import { readJson, removeKeys } from '../utils/storage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

api.interceptors.request.use((config) => {
  const token = readJson('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      removeKeys('token', 'user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
