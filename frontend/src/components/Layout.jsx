import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import CartSidebar from './CartSidebar'

/**
 * Layout — app shell for all authenticated pages.
 *
 * RESPONSIVE SIDEBAR BEHAVIOUR:
 *   Mobile  (< lg):  Sidebar is a full-height drawer overlay.
 *                    Closed → off-screen left. Open → slides in, dark backdrop shown.
 *                    Main content always takes full width (ml-0).
 *
 *   Desktop (≥ lg):  Sidebar is always visible and pushes content.
 *                    Open  → sidebar 288px wide, content ml-72.
 *                    Closed → sidebar 72px (icon-only), content ml-[72px].
 */
function Layout() {
  // Default open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)

  // Close sidebar automatically when screen shrinks to mobile
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-shell)]">
      {/* Fixed top navbar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {/* Mobile backdrop — shown behind the sidebar drawer on small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed left sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Cart sidebar — slides in from right for students */}
      <CartSidebar />

      {/* Main content area
          Mobile:  no left margin (sidebar is overlay, not pushing)
          Desktop: margin matches sidebar width                        */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-72' : 'lg:ml-[72px]'
        }`}
      >
        <div className="px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
