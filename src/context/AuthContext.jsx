import { createContext, useContext, useState, useCallback } from 'react'
import { mockLogin, mockRegister } from '../data/mock'
import { readJson, writeJson, removeKeys } from '../utils/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJson('user'))

  const login = useCallback(async (email, password) => {
    const { token, user } = mockLogin(email, password)
    writeJson('token', token)
    writeJson('user', user)
    setUser(user)
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { token, user } = mockRegister(name, email, password)
    writeJson('token', token)
    writeJson('user', user)
    setUser(user)
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
