import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/api'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const TYPE_DOT = {
  APPROVED: 'bg-emerald-500',
  DECLINED: 'bg-red-500',
  ISSUED:   'bg-blue-500',
  RETURNED: 'bg-slate-400',
  OVERDUE:  'bg-amber-500',
}

function Navbar({ sidebarOpen, onToggleSidebar }) {
  const { user, logout, isAdmin } = useAuth()
  const { cartTotal, setCartOpen } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  // ── Notification state ──────────────────────────────────────────────────────
  const [notifs, setNotifs]         = useState([])
  const [unread, setUnread]         = useState(0)
  const [bellOpen, setBellOpen]     = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const bellRef = useRef(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await api.get('/api/notifications/mine')
      if (res.data.success) {
        setNotifs(res.data.data.notifications)
        setUnread(res.data.data.unreadCount)
      }
    } catch {
      // silently fail — bell just shows no count
    }
  }, [])

  // Refetch on every route change so the bell stays fresh
  useEffect(() => { fetchNotifs() }, [fetchNotifs, location.pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleBellClick = () => {
    setBellOpen((v) => !v)
  }

  const markOne = async (notif) => {
    if (notif.read) return
    try {
      await api.patch(`/api/notifications/${notif.id}/read`)
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n))
      setUnread((u) => Math.max(0, u - 1))
    } catch { /* ignore */ }
  }

  const markAll = async () => {
    setMarkingAll(true)
    try {
      await api.patch('/api/notifications/read-all')
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } catch { /* ignore */ }
    setMarkingAll(false)
  }

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
        <button
          onClick={onToggleSidebar}
          className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="text-white font-bold text-lg font-body tracking-tight">
          CIPD <span className="font-normal text-blue-300">IMS</span>
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Cart icon — student only */}
        {!isAdmin() && (
          <button
            onClick={() => setCartOpen(true)}
            className="relative text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Open cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {cartTotal > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 font-body">
                {cartTotal > 99 ? '99+' : cartTotal}
              </span>
            )}
          </button>
        )}

        {/* Notification bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={handleBellClick}
            className="relative text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 font-body">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 font-body">Notifications</p>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    disabled={markingAll}
                    className="text-xs text-cyan-600 hover:text-cyan-800 font-body cursor-pointer disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-slate-400 font-body">No notifications yet</p>
                  </div>
                ) : (
                  notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markOne(n)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-cyan-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? (TYPE_DOT[n.type] || 'bg-slate-400') : 'bg-transparent'}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-body leading-relaxed ${!n.read ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-slate-400 font-body mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-white/20 hidden sm:block" />

        {/* User info — avatar always, name only on sm+ */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="text-right hidden md:block">
            <p className="text-white text-sm font-medium leading-tight">{user?.name || 'User'}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              isAdmin() ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
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
