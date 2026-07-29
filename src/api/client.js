import axios from 'axios'
import { removeKeys } from '../utils/storage'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      removeKeys('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
