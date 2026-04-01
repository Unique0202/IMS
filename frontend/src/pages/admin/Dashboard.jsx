import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

const quickLinks = [
  {
    title: 'Review Requests',
    description: 'Approve or decline pending equipment requests from students.',
    to: '/admin/requests',
    icon: 'requests',
  },
  {
    title: 'Open Inventory',
    description: 'Inspect stock, quantities, and item records across the lab.',
    to: '/admin/inventory',
    icon: 'inventory',
  },
]

const statTones = {
  cyan:    { panel: 'bg-cyan-50 text-cyan-700 border-cyan-100',       accent: 'bg-cyan-500' },
  emerald: { panel: 'bg-emerald-50 text-emerald-700 border-emerald-100', accent: 'bg-emerald-500' },
  amber:   { panel: 'bg-amber-50 text-amber-700 border-amber-100',    accent: 'bg-amber-500' },
  red:     { panel: 'bg-red-50 text-red-700 border-red-100',          accent: 'bg-red-500' },
}

const STATUS_COLORS = {
  PENDING:  'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ISSUED:   'bg-blue-50 text-blue-700 border-blue-200',
  DECLINED: 'bg-red-50 text-red-700 border-red-200',
  RETURNED: 'bg-slate-100 text-slate-600 border-slate-200',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 2)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function DashboardIcon({ type, className = 'w-5 h-5' }) {
  switch (type) {
    case 'requests':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h6m-6 4h4" />
        </svg>
      )
    case 'inventory':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      )
    case 'issued':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    case 'alerts':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.66 18h16.68a1 1 0 00.87-1.14l-7.5-13a1 1 0 00-1.74 0z" />
        </svg>
      )
    default:
      return null
  }
}

function AdminDashboard() {
  const [requests, setRequests] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/requests/all'),
      api.get('/api/inventory/low-stock'),
    ])
      .then(([reqRes, stockRes]) => {
        if (reqRes.data.success)   setRequests(reqRes.data.data.requests)
        if (stockRes.data.success) setLowStock(stockRes.data.data.items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    {
      label: 'Pending Requests',
      value: requests.filter((r) => r.status === 'PENDING').length,
      tone: 'amber',
      icon: 'requests',
    },
    {
      label: 'Currently Issued',
      value: requests.filter((r) => r.status === 'ISSUED').length,
      tone: 'emerald',
      icon: 'issued',
    },
    {
      label: 'Approved, Pending Pickup',
      value: requests.filter((r) => r.status === 'APPROVED').length,
      tone: 'cyan',
      icon: 'inventory',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStock.length,
      tone: 'red',
      icon: 'alerts',
    },
  ]

  const pendingRequests = requests.filter((r) => r.status === 'PENDING').slice(0, 4)

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 font-body">
              Admin Dashboard
            </div>
            <h1 className="mt-4 font-heading text-3xl sm:text-4xl font-semibold text-slate-950">
              CIPD Lab Administration
            </h1>
            <p className="mt-3 max-w-xl text-sm sm:text-base leading-7 text-slate-600 font-body">
              Oversee student requests, issued equipment, and stock alerts for the electronics lab.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 font-body">Workspace</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 font-body">CIPD Electronics Lab</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 font-body">Role</p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 font-body">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Authorized Admin
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const tone = statTones[stat.tone]
          return (
            <div key={stat.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tone.panel}`}>
                  <DashboardIcon type={stat.icon} className="h-5 w-5" />
                </div>
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tone.accent}`} />
              </div>
              <p className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
                {loading ? '—' : stat.value}
              </p>
              <p className="mt-2 text-sm text-slate-500 font-body">{stat.label}</p>
            </div>
          )
        })}
      </section>

      {/* Pending requests + low stock + quick links */}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

        {/* Pending requests — real data */}
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="font-heading text-xl font-semibold text-slate-950">Pending Requests</h2>
              <p className="mt-1 text-sm text-slate-500 font-body">Submissions awaiting your action</p>
            </div>
            <Link to="/admin/requests" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 font-body">
              View all
            </Link>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-cyan-500 border-t-transparent rounded-full" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-10 h-10 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-500 font-body">No pending requests — all clear!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => {
                  const itemSummary = req.items.map((ri) => `${ri.item.name} ×${ri.quantity}`).join(', ')
                  return (
                    <div key={req.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-700 text-sm font-bold font-body">
                            {req.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 font-body">{req.user.name}</p>
                            <p className="text-xs text-slate-600 font-body truncate">{itemSummary}</p>
                            <p className="text-xs text-slate-400 font-body mt-0.5">{timeAgo(req.createdAt)}</p>
                          </div>
                        </div>
                        <Link
                          to="/admin/requests"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors font-body shrink-0 cursor-pointer"
                        >
                          Review
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Low stock alerts — real data */}
          <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="font-heading text-xl font-semibold text-slate-950">Low Stock Alerts</h2>
                <p className="mt-1 text-sm text-slate-500 font-body">Items needing replenishment</p>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin h-5 w-5 border-4 border-cyan-500 border-t-transparent rounded-full" />
                </div>
              ) : lowStock.length === 0 ? (
                <p className="text-sm text-slate-500 font-body text-center py-6">All items are well stocked</p>
              ) : (
                <div className="space-y-3">
                  {lowStock.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 font-body truncate">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500 font-body">{item.category.name}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${
                        item.quantity === 0
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : item.quantity <= 2
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}>
                        {item.quantity === 0 ? 'Out of stock' : `${item.quantity} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick access */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <h2 className="font-heading text-xl font-semibold text-slate-950">Quick Access</h2>
            <p className="mt-1 text-sm text-slate-500 font-body mb-5">Common lab administration actions</p>
            <div className="space-y-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition-colors hover:border-cyan-200 hover:bg-cyan-50/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 group-hover:border-cyan-200 group-hover:text-cyan-700">
                      <DashboardIcon type={item.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 font-body">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 font-body">{item.description}</p>
                    </div>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
