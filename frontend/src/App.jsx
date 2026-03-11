import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Placeholder from './pages/Placeholder'

function App() {
  return (
    <Routes>
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Placeholder title="Signup" message="Coming in Phase 2" />} />

      {/* Student pages (placeholder until Phase 3) */}
      <Route path="/student/dashboard" element={<Placeholder title="Student Dashboard" message="Coming in Phase 3" />} />
      <Route path="/student/*" element={<Placeholder title="Student Area" message="Coming soon" />} />

      {/* Admin pages (placeholder until Phase 3) */}
      <Route path="/admin/dashboard" element={<Placeholder title="Admin Dashboard" message="Coming in Phase 3" />} />
      <Route path="/admin/*" element={<Placeholder title="Admin Area" message="Coming soon" />} />

      {/* 404 */}
      <Route path="*" element={<Placeholder title="404" message="Page not found" />} />
    </Routes>
  )
}

export default App
