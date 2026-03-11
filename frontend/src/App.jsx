import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Layout from './components/Layout'
import StudentDashboard from './pages/student/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import Placeholder from './pages/Placeholder'

/**
 * App routing structure:
 *
 *   /                    → redirect to /login
 *   /login               → Login page (no layout)
 *   /signup              → Signup page (no layout)
 *
 *   /student             → Layout (student sidebar) wrapper
 *     /student/dashboard → Student Dashboard
 *     /student/inventory → Placeholder (Phase 5)
 *     /student/cart      → Placeholder (Phase 6)
 *     /student/requests  → Placeholder (Phase 6)
 *     /student/profile   → Placeholder (Phase 9)
 *
 *   /admin               → Layout (admin sidebar) wrapper
 *     /admin/dashboard   → Admin Dashboard
 *     /admin/inventory   → Placeholder (Phase 8)
 *     /admin/requests    → Placeholder (Phase 7)
 *     /admin/issued      → Placeholder (Phase 8)
 *     /admin/add-item    → Placeholder (Phase 8)
 *
 * HOW NESTED ROUTES WORK:
 *   The Layout component renders <Outlet /> in its main content area.
 *   Child routes (like /student/dashboard) render inside that Outlet.
 *   This gives us persistent navbar + sidebar while only content changes.
 */
function App() {
  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth pages (no layout wrapper) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Student routes — wrapped in Layout */}
      <Route path="/student" element={<Layout />}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="inventory" element={<Placeholder title="Browse Inventory" message="Coming in Phase 5" />} />
        <Route path="inventory/:categoryId" element={<Placeholder title="Category Items" message="Coming in Phase 5" />} />
        <Route path="cart" element={<Placeholder title="My Cart" message="Coming in Phase 6" />} />
        <Route path="requests" element={<Placeholder title="My Requests" message="Coming in Phase 6" />} />
        <Route path="profile" element={<Placeholder title="My Profile" message="Coming in Phase 9" />} />
      </Route>

      {/* Admin routes — wrapped in Layout */}
      <Route path="/admin" element={<Layout />}>
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
