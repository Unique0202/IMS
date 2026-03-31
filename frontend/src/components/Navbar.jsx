import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'

/**
 * Top navigation bar — fixed at the top of every authenticated page.
 *
 * Shows:
 *   Left:  "CIPD IMS" logo text + sidebar toggle button
 *   Right: User name + role badge + cart icon (student only) + logout button
 *
 * The cart icon badge count is hardcoded to 0 for now.
 * Phase 6 will wire it to CartContext.
 */
function Navbar({ sidebarOpen, onToggleSidebar }) {
  const { user, logout, isAdmin } = useAuth()
  const { cartTotal, setCartOpen } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {/* Left side: toggle + logo */}
      <div className="flex items-center gap-3">
        {/* Sidebar toggle button */}
        <button
          onClick={onToggleSidebar}
          className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <span className="text-white font-bold text-lg font-body tracking-tight">
          CIPD <span className="font-normal text-blue-300">IMS</span>
        </span>
      </div>

      {/* Right side: user info + actions */}
      <div className="flex items-center gap-3">
        {/* Cart icon — student only, shows live item count */}
        {!isAdmin() && (
          <button
            onClick={() => setCartOpen(true)}
            className="relative text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Open cart"
            aria-label={`Cart — ${cartTotal} items`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {/* Badge — only shown when cart has items */}
            {cartTotal > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 font-body">
                {cartTotal > 99 ? '99+' : cartTotal}
              </span>
            )}
          </button>
        )}

        {/* Notification bell placeholder (wired in Phase 9) */}
        <button
          className="relative text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Notifications (coming in Phase 9)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-white/20" />

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="text-right">
            <p className="text-white text-sm font-medium leading-tight">{user?.name || 'User'}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              isAdmin()
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}>
              {user?.role || 'STUDENT'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
