import { createContext, useContext, useState, useCallback } from 'react'

/**
 * AuthContext — stores the currently logged-in user across the entire app.
 *
 * WHY CONTEXT?
 *   Without Context, you would need to pass the user object as a prop
 *   from App → Layout → Navbar → every child component. That is called
 *   "prop drilling" and it becomes unmanageable quickly.
 *   Context lets ANY component read the user by calling useAuth().
 *
 * WHAT HAPPENS ON PAGE REFRESH?
 *   Right now (Phase 3): state resets — the user gets logged out.
 *   In Phase 4: we add JWT tokens, and a /api/auth/me call on app load
 *   to restore the session. So refreshing will keep you logged in.
 *
 * DEV MODE (Phase 3 only):
 *   Since there is no backend, Login.jsx sets a fake user via login().
 *   This lets us test both Student and Admin dashboards.
 *   This gets replaced with real API auth in Phase 4.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // Save user to state (Phase 4: also saves JWT token)
  const login = useCallback((userData) => {
    setUser(userData)
  }, [])

  // Clear user and redirect (Phase 4: also clears JWT)
  const logout = useCallback(() => {
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
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to use auth context.
 * Usage: const { user, login, logout, isAdmin } = useAuth()
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
