import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import StudentDashboard from './pages/student/Dashboard'
import StudentInventory from './pages/student/Inventory'
import CategoryItems from './pages/student/CategoryItems'
import MyRequests from './pages/student/MyRequests'
import Cart from './pages/student/Cart'
import AdminDashboard from './pages/admin/Dashboard'
import AdminRequests from './pages/admin/Requests'
import AdminInventory from './pages/admin/Inventory'
import AddItem from './pages/admin/AddItem'
import IssuedItems from './pages/admin/IssuedItems'
import AdminUsers from './pages/admin/Users'
import AdminCategories from './pages/admin/Categories'
import AdminReports from './pages/admin/Reports'
import StudentProfile from './pages/student/Profile'
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
        <Route path="inventory" element={<StudentInventory />} />
        <Route path="inventory/:categoryId" element={<CategoryItems />} />
        <Route path="cart" element={<Cart />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="profile" element={<StudentProfile />} />
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
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="issued" element={<IssuedItems />} />
        <Route path="add-item" element={<AddItem />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Placeholder title="404" message="Page not found" />} />
    </Routes>
  )
}

export default App
