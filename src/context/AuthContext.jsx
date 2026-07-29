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
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name: name.trim(), email: email.trim().toLowerCase(), password })
    writeJson('user', data.user)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    removeKeys('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
