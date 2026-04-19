import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'

/**
 * MyRequests page — shows all requests the student has ever submitted.
 * Route: /student/requests
 *
 * HOW IT WORKS:
 *   1. On mount, fetches GET /api/requests/mine
 *   2. Shows all requests, filterable by status tab
 *   3. Each request card shows items, status badge, and relevant info
 *
 * STATUS FLOW:
 *   PENDING → student submitted, waiting for admin review
 *   APPROVED → admin approved, student must collect within deadline
 *   ISSUED → admin physically handed over items, clock is running
 *   DECLINED → admin rejected (reason shown)
 *   RETURNED → student returned items, transaction complete
 *
 * TIME FORMATTING:
 *   We use Intl.RelativeTimeFormat for "2 hours ago" style dates.
 *   This is a built-in browser API — no library needed.
 */

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'ISSUED', 'DECLINED', 'RETURNED', 'CANCELLED']

const STATUS_STYLES = {
  PENDING:   { badge: 'bg-amber-100 text-amber-700 border-amber-200',     label: 'Pending' },
  APPROVED:  { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
  ISSUED:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',    label: 'Issued' },
  DECLINED:  { badge: 'bg-red-100 text-red-700 border-red-200',       label: 'Declined' },
  RETURNED:  { badge: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Returned' },
  CANCELLED: { badge: 'bg-gray-100 text-gray-500 border-gray-200',    label: 'Cancelled' },
}

/**
 * Converts a date to a human-readable relative string.
 * e.g. "2 hours ago", "3 days ago", "just now"
 */
function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Formats an absolute date nicely.
 * e.g. "12 Jan 2026, 5:00 PM"
 */
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Computes the countdown to a deadline date.
 * Returns a string like "4 hours left" or "Overdue by 2 days"
 */
function deadlineText(deadlineStr) {
  if (!deadlineStr) return null
  const deadline = new Date(deadlineStr)
  const now = new Date()
  const diffMs = deadline - now
  const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffMs < 0) {
    return diffDays > 0 ? `Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}` : `Overdue by ${diffHours}h`
  }
  if (diffHours < 1) return 'Collect now!'
  if (diffHours < 24) return `${diffHours}h left to collect`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} left to collect`
}

const PAGE_SIZE = 15

const TIMELINE_STEPS = ['Submitted', 'Approved', 'Issued', 'Returned']
const STATUS_STEP = { PENDING: 0, APPROVED: 1, ISSUED: 2, RETURNED: 3 }

function StatusTimeline({ status }) {
  if (status === 'DECLINED' || status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 py-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium font-body ${
          status === 'DECLINED' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {status === 'DECLINED' ? '✕ Declined' : '✕ Cancelled'}
        </span>
      </div>
    )
  }

  const currentStep = STATUS_STEP[status] ?? 0

  return (
    <div className="flex items-center gap-0 py-2">
      {TIMELINE_STEPS.map((label, idx) => {
        const done    = idx < currentStep
        const active  = idx === currentStep
        const future  = idx > currentStep
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                done   ? 'bg-emerald-500' :
                active ? 'bg-cyan-600' :
                         'bg-slate-200'
              }`}>
                {done ? (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-slate-400'}`} />
                )}
              </div>
              <span className={`text-[9px] mt-1 font-body whitespace-nowrap ${
                done ? 'text-emerald-600 font-semibold' :
                active ? 'text-cyan-700 font-semibold' :
                         'text-slate-400'
              }`}>{label}</span>
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-3 rounded ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }
  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}
        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-body cursor-pointer transition-colors">
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-2 text-xs text-slate-400 font-body">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 text-xs rounded-lg font-body cursor-pointer transition-colors ${
              p === currentPage ? 'bg-slate-900 text-white font-semibold' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages}
        className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-body cursor-pointer transition-colors">
        Next →
      </button>
    </div>
  )
}

function MyRequests() {
  const navigate = useNavigate()
  const { addToCart, clearCart } = useCart()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [expandedReasons, setExpandedReasons] = useState({})
  const [cancellingId, setCancellingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/api/requests/mine')
        if (res.data.success) {
          setRequests(res.data.data.requests)
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load requests')
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  useEffect(() => { setCurrentPage(1) }, [activeTab])

  // Filter by selected status tab
  const filtered = activeTab === 'ALL'
    ? requests
    : requests.filter((r) => r.status === activeTab)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safePage   = Math.min(currentPage, totalPages || 1)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Count per status for tab badges
  const countByStatus = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  // Summarize items as a readable string: "Arduino UNO ×2, ESP32 ×1"
  const summarizeItems = (items) =>
    items.map((ri) => `${ri.item.name} ×${ri.quantity}`).join(', ')

  const toggleReason = (id) =>
    setExpandedReasons((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleCancel = async (request) => {
    if (!window.confirm('Cancel this request?')) return
    setCancellingId(request.id)
    try {
      await api.patch(`/api/requests/${request.id}/cancel`)
      setRequests((prev) => prev.map((r) => r.id === request.id ? { ...r, status: 'CANCELLED' } : r))
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel request')
    } finally {
      setCancellingId(null)
    }
  }

  const handleReRequest = (request) => {
    clearCart()
    request.items.forEach((ri) => addToCart(ri.item, ri.quantity))
    navigate('/student/cart')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-heading">My Requests</h1>
        <p className="text-slate-500 mt-1 font-body text-sm">
          {requests.length} total request{requests.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {/* Status tabs — scrollable on mobile */}
      <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-2xl p-1.5 overflow-x-auto scrollbar-none">

        {STATUS_TABS.map((tab) => {
          const count = tab === 'ALL' ? requests.length : (countByStatus[tab] || 0)
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all font-body cursor-pointer whitespace-nowrap flex-shrink-0 ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {tab === 'ALL' ? 'All' : STATUS_STYLES[tab].label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {activeTab === 'ALL' ? (
            <>
              <p className="text-slate-600 font-body font-medium mb-1">No requests yet</p>
              <p className="text-slate-400 font-body text-sm mb-4">Browse the inventory and add items to your cart to get started</p>
              <Link
                to="/student/inventory"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white font-body"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Browse Inventory
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </>
          ) : (
            <p className="text-slate-500 font-body text-sm">No {STATUS_STYLES[activeTab]?.label.toLowerCase()} requests</p>
          )}
        </div>
      )}

      {/* Result count */}
      {filtered.length > 0 && (
        <p className="text-xs text-slate-400 font-body mb-3">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Request cards */}
      <div className="flex flex-col gap-4">
        {paginated.map((request) => {
          const style = STATUS_STYLES[request.status]
          const isLongReason = request.reason.length > 120
          const showFull = expandedReasons[request.id]
          const deadline = deadlineText(request.collectionDeadline)
          const isDeadlineOverdue = deadline?.startsWith('Overdue')

          return (
            <div
              key={request.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              {/* Card header — status + time */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border font-body ${style.badge}`}>
                  {style.label}
                </span>
                <span className="text-xs text-slate-400 font-body">{timeAgo(request.createdAt)}</span>
              </div>

              {/* Status timeline */}
              <div className="px-5 pt-3 pb-0">
                <StatusTimeline status={request.status} />
              </div>

              {/* Card body */}
              <div className="px-5 py-4 space-y-3">
                {/* Items list */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-body mb-1">Items Requested</p>
                  <p className="text-sm text-slate-900 font-body">{summarizeItems(request.items)}</p>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-body mb-1">Reason</p>
                  <p className="text-sm text-slate-600 font-body italic">
                    {isLongReason && !showFull
                      ? request.reason.slice(0, 120) + '...'
                      : request.reason}
                  </p>
                  {isLongReason && (
                    <button
                      onClick={() => toggleReason(request.id)}
                      className="text-xs text-cyan-600 hover:text-cyan-700 font-medium font-body mt-1 cursor-pointer"
                    >
                      {showFull ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {/* Status-specific info */}
                {request.status === 'APPROVED' && request.collectionDeadline && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body font-medium ${
                    isDeadlineOverdue ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {deadline} — Collect by {formatDate(request.collectionDeadline)}
                  </div>
                )}

                {request.status === 'ISSUED' && request.transaction && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl text-xs font-body font-medium text-blue-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Return by {formatDate(request.transaction.expectedReturnAt)}
                  </div>
                )}

                {request.status === 'DECLINED' && request.declineReason && (
                  <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-semibold text-red-700 font-body mb-0.5">Reason for Decline</p>
                    <p className="text-xs text-red-600 font-body">{request.declineReason}</p>
                  </div>
                )}

                {request.status === 'RETURNED' && request.transaction && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-xs font-body text-slate-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Returned on {formatDate(request.transaction.returnedAt)}
                    {request.transaction.conditionOnReturn && (
                      <span className="text-slate-400">— Condition: {request.transaction.conditionOnReturn}</span>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  {request.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(request)}
                      disabled={cancellingId === request.id}
                      className="text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-body cursor-pointer disabled:opacity-60 transition-colors"
                    >
                      {cancellingId === request.id ? 'Cancelling…' : 'Cancel Request'}
                    </button>
                  )}
                  {(request.status === 'RETURNED' || request.status === 'DECLINED' || request.status === 'CANCELLED') && (
                    <button
                      onClick={() => handleReRequest(request)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Request Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Pagination currentPage={safePage} totalPages={totalPages} onChange={setCurrentPage} />
    </div>
  )
}

export default MyRequests
