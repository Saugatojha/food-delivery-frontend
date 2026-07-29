import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'
import { readJson, writeJson, removeKeys } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJson('user'))

  const login = useCallback(async (loginValue, password) => {
    const { data } = await api.post('/auth/login', { login: loginValue.trim(), password })
    writeJson('token', data.token)
    writeJson('user', data.user)
    setUser(data.user)
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name: name.trim(), email: email.trim().toLowerCase(), password })
    writeJson('token', data.token)
    writeJson('user', data.user)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    removeKeys('token', 'user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
