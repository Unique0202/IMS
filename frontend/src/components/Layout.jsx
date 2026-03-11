import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

/**
 * Layout component — the app shell for all authenticated pages.
 *
 * STRUCTURE:
 *   ┌─────────────── Navbar (fixed top) ───────────────┐
 *   │ CIPD IMS                        User ▾ | Logout   │
 *   ├────────┬─────────────────────────────────────────┤
 *   │        │                                          │
 *   │ Side-  │          Main Content Area               │
 *   │  bar   │          (<Outlet /> renders              │
 *   │        │           child route here)               │
 *   │        │                                          │
 *   └────────┴──────────────────────────────────────────┘
 *
 * HOW <Outlet> WORKS:
 *   In React Router, nested routes render their component inside the
 *   parent's <Outlet>. So when the URL is /student/dashboard, the Layout
 *   renders as the parent, and student/Dashboard.jsx renders where
 *   <Outlet> is placed. This gives us a persistent sidebar + navbar
 *   while only the content area changes.
 */
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed top navbar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Fixed left sidebar */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Main content area — offset by navbar height and sidebar width */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'ml-60' : 'ml-16'
        }`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
