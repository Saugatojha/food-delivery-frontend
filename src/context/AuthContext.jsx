import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../api/client'
import { readJson, writeJson, removeKeys } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJson('user'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      writeJson('user', data.user)
      setUser(data.user)
    }).catch(() => {
      removeKeys('user')
      setUser(null)
    }).finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (loginValue, password) => {
    const { data } = await api.post('/auth/login', { login: loginValue.trim(), password })
    writeJson('user', data.user)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name: name.trim(), email: email.trim().toLowerCase(), password })
    return data
  }, [])

  const verifyEmail = useCallback(async (token) => {
    const { data } = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
    return data
  }, [])

  const resendVerification = useCallback(async (email) => {
    const { data } = await api.post('/auth/resend-verification', { login: email.trim().toLowerCase() })
    return data
  }, [])

  const forgotPassword = useCallback(async (loginValue) => {
    const { data } = await api.post('/auth/forgot-password', { login: loginValue.trim() })
    return data
  }, [])

  const resetPassword = useCallback(async (token, password) => {
    const { data } = await api.post('/auth/reset-password', { token: token.trim(), password })
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    removeKeys('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendVerification, forgotPassword, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
