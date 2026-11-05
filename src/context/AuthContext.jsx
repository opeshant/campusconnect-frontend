import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('campusconnect_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setUser(null)
      return
    }

    let active = true
    api.get('/api/v1/users/me')
      .then((response) => {
        if (active) setUser(response.data.data)
      })
      .catch(() => {
        localStorage.removeItem('campusconnect_token')
        if (active) {
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [token])

  const login = (newToken, userData) => {
    localStorage.setItem('campusconnect_token', newToken)
    setToken(newToken)
    setUser(userData || null)
    setLoading(false)
  }

  const logout = () => {
    localStorage.removeItem('campusconnect_token')
    setToken(null)
    setUser(null)
  }

  const refreshProfile = async () => {
    const response = await api.get('/api/v1/users/me')
    setUser(response.data.data)
    return response.data.data
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
