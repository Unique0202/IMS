import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../utils/api'

/**
 * AuthContext — stores the currently logged-in user across the entire app.
 *
 * WHY CONTEXT?
 *   Without Context, you would need to pass the user object as a prop
 *   from App → Layout → Navbar → every child component. That is called
 *   "prop drilling" and it becomes unmanageable quickly.
 *   Context lets ANY component read the user by calling useAuth().
 *
 * SESSION PERSISTENCE (Phase 4):
 *   On login, the JWT token is saved to localStorage.
 *   On page refresh, useEffect calls /api/auth/me with the saved token.
 *   If the token is valid → user is restored. If expired → user is logged out.
 *
 * TOKEN STORAGE: localStorage
 *   We store the token in localStorage so it persists across page refreshes.
 *   The backend also sets an httpOnly cookie as a fallback.
 *   The api.js interceptor attaches the token to every request automatically.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true until we check the token

  // On app load: check if there's a saved token and restore session
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('ims_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/api/auth/me')
        if (response.data.success) {
          setUser(response.data.data.user)
        }
      } catch {
        // Token invalid/expired — clear it
        localStorage.removeItem('ims_token')
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  // Save user + token to state and localStorage
  const login = useCallback((userData, token) => {
    if (token) {
      localStorage.setItem('ims_token', token)
    }
    setUser(userData)
  }, [])

  // Clear everything
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('ims_token')
    setUser(null)
  }, [])

  // Helper to check if current user is admin
  const isAdmin = useCallback(() => {
    return user?.role === 'ADMIN'
  }, [user])

  const value = {
    user,
    login,
    logout,
    isAdmin,
    isAuthenticated: !!user,
    loading, // true while checking token on page load
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to use auth context.
 * Usage: const { user, login, logout, isAdmin, loading } = useAuth()
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
