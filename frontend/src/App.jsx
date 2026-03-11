import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import StudentDashboard from './pages/student/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import Placeholder from './pages/Placeholder'

/**
 * App routing structure:
 *
 *   /                    → redirect to /login
 *   /login               → Login page (redirects to dashboard if already logged in)
 *   /signup              → Signup page
 *
 *   /student             → ProtectedRoute (STUDENT) → Layout wrapper
 *     /student/dashboard → Student Dashboard
 *     /student/inventory → Placeholder (Phase 5)
 *     ...etc
 *
 *   /admin               → ProtectedRoute (ADMIN) → Layout wrapper
 *     /admin/dashboard   → Admin Dashboard
 *     ...etc
 *
 * PROTECTED ROUTES:
 *   Student routes require role=STUDENT, admin routes require role=ADMIN.
 *   If not authenticated → redirect to /login.
 *   If wrong role → redirect to your own dashboard.
 */
function App() {
  const { loading } = useAuth()

  // While checking saved token on page load, show nothing (prevents flash)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth pages (no layout wrapper) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Student routes — protected + wrapped in Layout */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="STUDENT">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="inventory" element={<Placeholder title="Browse Inventory" message="Coming in Phase 5" />} />
        <Route path="inventory/:categoryId" element={<Placeholder title="Category Items" message="Coming in Phase 5" />} />
        <Route path="cart" element={<Placeholder title="My Cart" message="Coming in Phase 6" />} />
        <Route path="requests" element={<Placeholder title="My Requests" message="Coming in Phase 6" />} />
        <Route path="profile" element={<Placeholder title="My Profile" message="Coming in Phase 9" />} />
      </Route>

      {/* Admin routes — protected + wrapped in Layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="inventory" element={<Placeholder title="Inventory" message="Coming in Phase 8" />} />
        <Route path="requests" element={<Placeholder title="Requests" message="Coming in Phase 7" />} />
        <Route path="issued" element={<Placeholder title="Issued Items" message="Coming in Phase 8" />} />
        <Route path="add-item" element={<Placeholder title="Add Item" message="Coming in Phase 8" />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Placeholder title="404" message="Page not found" />} />
    </Routes>
  )
}

export default App
