import { createContext, useContext, useState, ReactNode } from 'react'
import { api } from '../lib/api'

interface AuthContextValue {
  isAuthenticated: boolean
  idToken: string | null
  accessToken: string | null
  userEmail: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [idToken, setIdToken] = useState<string | null>(
    () => localStorage.getItem('midrive_id_token'),
  )
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem('midrive_access_token'),
  )
  const [userEmail, setUserEmail] = useState<string | null>(
    () => localStorage.getItem('midrive_user_email'),
  )

  const isAuthenticated = !!idToken

  async function login(email: string, password: string) {
    const response = await api.post<{
      data: { idToken: string; accessToken: string; refreshToken: string; email: string }
    }>('/api/auth/login', { email, password })

    const { idToken, accessToken, email: userEmail } = response.data.data
    setIdToken(idToken)
    setAccessToken(accessToken)
    setUserEmail(userEmail)
    localStorage.setItem('midrive_id_token', idToken)
    localStorage.setItem('midrive_access_token', accessToken)
    localStorage.setItem('midrive_user_email', userEmail)
  }

  function logout() {
    setIdToken(null)
    setAccessToken(null)
    setUserEmail(null)
    localStorage.removeItem('midrive_id_token')
    localStorage.removeItem('midrive_access_token')
    localStorage.removeItem('midrive_user_email')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, idToken, accessToken, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
