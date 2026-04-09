import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

/**
 * Sidebar navigation — role-based links for student vs admin.
 *
 * HOW IT KNOWS WHICH LINKS TO SHOW:
 *   Reads user.role from AuthContext. If role is 'ADMIN', shows admin links.
 *   Otherwise shows student links.
 *
 * COLLAPSED STATE:
 *   Expanded: 240px wide, shows icon + label
 *   Collapsed: 64px wide, shows icon only with tooltip on hover
 *
 * NavLink from react-router-dom automatically adds an "active" class
 * to the link that matches the current URL. We use this to highlight it.
 */

const studentLinks = [
  {
    to: '/student/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/student/inventory',
    label: 'Browse Inventory',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    to: '/student/cart',
    label: 'My Cart',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    badge: 0, // Wired to CartContext in Phase 6
  },
  {
    to: '/student/requests',
    label: 'My Requests',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    to: '/student/profile',
    label: 'My Profile',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

const adminLinks = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/admin/inventory',
    label: 'Inventory',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    to: '/admin/requests',
    label: 'Requests',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    badge: true, // Signals this link shows the live pending count
  },
  {
    to: '/admin/issued',
    label: 'Issued Items',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    to: '/admin/add-item',
    label: 'Add Item',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    to: '/admin/users',
    label: 'Students',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

function Sidebar({ isOpen }) {
  const { isAdmin } = useAuth()
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)

  // Refetch pending count every time the route changes (so it updates after admin acts)
  useEffect(() => {
    if (!isAdmin()) return
    api.get('/api/requests/all')
      .then((res) => {
        if (res.data.success) {
          const count = res.data.data.requests.filter((r) => r.status === 'PENDING').length
          setPendingCount(count)
        }
      })
      .catch(() => {})
  }, [location.pathname, isAdmin])

  const links = isAdmin() ? adminLinks : studentLinks

  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 z-30 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out ${
        isOpen ? 'w-72' : 'w-[72px]'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className={`border-b border-slate-200 px-4 py-4 ${isOpen ? '' : 'px-3'}`}>
          <div className={`rounded-2xl border border-slate-200 bg-slate-50 ${isOpen ? 'px-4 py-4' : 'px-3 py-4'}`}>
            <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-white shadow-[0_10px_25px_rgba(15,59,76,0.25)]">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9.75 3v2.25m4.5-2.25v2.25M4.5 9.75h15M6.75 6h10.5A2.25 2.25 0 0119.5 8.25v9A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25v-9A2.25 2.25 0 016.75 6zM9 13h.008v.008H9V13zm3 0h.008v.008H12V13zm3 0h.008v.008H15V13z" />
                </svg>
              </div>

              <div className={`${isOpen ? 'opacity-100' : 'hidden'}`}>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 font-body">Workspace</p>
                <p className="mt-1 text-sm font-semibold text-slate-900 font-body">
                  {isAdmin() ? 'Admin Control' : 'Student Portal'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className={`mb-3 ${isOpen ? 'px-2' : 'hidden'}`}>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 font-body">Navigation</p>
          </div>

          <div className="flex flex-col gap-1.5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium font-body transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`
                }
              >
                <span className="shrink-0">{link.icon}</span>

                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  }`}
                >
                  {link.label}
                </span>

                {link.badge && pendingCount > 0 && (
                  <span
                    className={`bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ${
                      isOpen
                        ? 'ml-auto px-2 py-0.5 min-w-[20px]'
                        : 'absolute -top-1 -right-1 w-4 h-4 text-[10px]'
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}

                {!isOpen && (
                  <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {link.label}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {isOpen && (
          <div className="border-t border-slate-200 px-4 py-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 font-body">CIPD</p>
              <p className="mt-1 text-sm text-slate-700 font-body">Electronics lab inventory workspace</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
