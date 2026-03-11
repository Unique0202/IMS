import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute — wraps routes that require authentication.
 *
 * HOW IT WORKS:
 *   If the user is not logged in → redirect to /login.
 *   If a requiredRole is specified and the user's role doesn't match → redirect to their own dashboard.
 *   Otherwise → render the children.
 *
 * USAGE IN ROUTES:
 *   <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><Layout /></ProtectedRoute>}>
 *     ...child routes...
 *   </Route>
 *
 * NOTE: In Phase 4, AuthContext also checks for token validity on page load
 * via /api/auth/me, so stale sessions are caught.
 */
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    // Wrong role — redirect to their own dashboard
    const dashboardPath = user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  return children
}

export default ProtectedRoute
