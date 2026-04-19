import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'

/**
 * Admin Requests page — /admin/requests
 *
 * THE FULL REQUEST LIFECYCLE (admin side):
 *   PENDING  → admin sees request → Approve or Decline
 *   APPROVED → student must collect → admin clicks "Issue" when student arrives
 *   ISSUED   → student has items → admin clicks "Return" when student brings back
 *   DECLINED → terminal, no further action
 *   RETURNED → terminal, no further action
 *
 * HOW MODALS WORK HERE:
 *   Instead of separate pages, we use inline modals controlled by `activeModal`
 *   state. Each modal has a `requestId` so we know which request to act on.
 *   The modal state shape: { type: 'approve'|'decline'|'issue'|'return', request: {...} }
 *
 * OPTIMISTIC UI vs REFETCH:
 *   After each action, we refetch all requests from the API to ensure consistency.
 *   This is simpler than manually updating local state and avoids stale data.
 */

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'ISSUED', 'DECLINED', 'RETURNED']

const STATUS_STYLES = {
  PENDING:  { badge: 'bg-amber-100 text-amber-700 border-amber-200',    label: 'Pending' },
  APPROVED: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
  ISSUED:   { badge: 'bg-blue-100 text-blue-700 border-blue-200',       label: 'Issued' },
  DECLINED: { badge: 'bg-red-100 text-red-700 border-red-200',          label: 'Declined' },
  RETURNED: { badge: 'bg-slate-100 text-slate-600 border-slate-200',    label: 'Returned' },
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

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Default collection deadline = 24h from now, formatted for datetime-local input
function defaultDeadline() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

// Default return date = 7 days from now
function defaultReturnDate() {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

// ─── APPROVE MODAL ────────────────────────────────────────────────────────────
function ApproveModal({ request, onClose, onSuccess }) {
  const [deadline, setDeadline] = useState(defaultDeadline())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/api/requests/${request.id}/approve`, {
        collectionDeadline: new Date(deadline).toISOString(),
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to approve request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Approve Request" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 font-body mb-1">Student</p>
          <p className="text-sm font-semibold text-slate-900 font-body">{request.user.name}</p>
          <p className="text-xs text-slate-500 font-body">{request.user.email}</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 font-body mb-2">Items</p>
          <div className="space-y-1">
            {request.items.map((ri) => (
              <p key={ri.item.id} className="text-sm font-body text-slate-800">
                {ri.item.name} <span className="text-slate-500">×{ri.quantity}</span>
              </p>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
            Collection Deadline
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-slate-400 font-body mt-1">Student must collect by this time</p>
        </div>

        {error && <p className="text-xs text-red-600 font-body">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60"
          >
            {submitting ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── DECLINE MODAL ────────────────────────────────────────────────────────────
function DeclineModal({ request, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Decline reason is required'); return }
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/api/requests/${request.id}/decline`, { declineReason: reason.trim() })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to decline request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Decline Request" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 font-body mb-1">Student — {request.user.name}</p>
          <p className="text-sm font-body text-slate-700">
            {request.items.map((ri) => `${ri.item.name} ×${ri.quantity}`).join(', ')}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
            Reason for Declining <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError('') }}
            placeholder="e.g. Item not available, insufficient stock for your request..."
            rows={3}
            className={`w-full text-sm border rounded-xl px-3 py-2.5 font-body resize-none focus:outline-none focus:ring-2 focus:ring-red-400 ${
              error ? 'border-red-300 bg-red-50' : 'border-slate-200'
            }`}
          />
          {error && <p className="text-xs text-red-600 font-body mt-1">{error}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60"
          >
            {submitting ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── ISSUE MODAL ──────────────────────────────────────────────────────────────
function IssueModal({ request, onClose, onSuccess }) {
  const [expectedReturnAt, setExpectedReturnAt] = useState(defaultReturnDate())
  const [conditionOnIssue, setConditionOnIssue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Per-item issued quantities — default to min(requested, available stock)
  const [issuedQtys, setIssuedQtys] = useState(() => {
    const init = {}
    request.items.forEach((ri) => {
      init[ri.item.id] = Math.min(ri.quantity, ri.item.quantity)
    })
    return init
  })

  const setQty = (itemId, val) => {
    setIssuedQtys((prev) => ({ ...prev, [itemId]: val }))
  }

  const handleSubmit = async () => {
    // Validate no qty is out of range
    for (const ri of request.items) {
      const qty = issuedQtys[ri.item.id] ?? 0
      if (qty < 0 || qty > ri.quantity || qty > ri.item.quantity) {
        setError(`Invalid quantity for "${ri.item.name}"`)
        return
      }
    }
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/api/requests/${request.id}/issue`, {
        expectedReturnAt: new Date(expectedReturnAt).toISOString(),
        conditionOnIssue: conditionOnIssue.trim() || null,
        issuedItems: request.items.map((ri) => ({
          itemId: ri.item.id,
          quantity: issuedQtys[ri.item.id] ?? 0,
        })),
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to issue request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Issue Items" onClose={onClose}>
      <div className="space-y-4">
        {/* Per-item qty editor */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-body mb-2">
            Issuing to {request.user.name} — set actual quantities
          </p>
          <div className="space-y-2">
            {request.items.map((ri) => {
              const qty = issuedQtys[ri.item.id] ?? 0
              const available = ri.item.quantity
              const notAvailable = available === 0
              const partial = qty < ri.quantity

              return (
                <div key={ri.item.id} className={`rounded-xl border p-3 ${
                  qty === 0 ? 'border-red-200 bg-red-50' : partial ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 font-body">{ri.item.name}</p>
                      <p className="text-xs font-body mt-0.5">
                        <span className="text-slate-500">Requested: {ri.quantity}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className={available === 0 ? 'text-red-600 font-medium' : 'text-emerald-600'}>
                          {available} in stock
                        </span>
                      </p>
                    </div>
                    {/* Qty stepper */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setQty(ri.item.id, Math.max(0, qty - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-body cursor-pointer"
                      >−</button>
                      <input
                        type="number"
                        min={0}
                        max={Math.min(ri.quantity, available)}
                        value={qty}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(Math.min(ri.quantity, available), parseInt(e.target.value) || 0))
                          setQty(ri.item.id, v)
                        }}
                        className="w-10 text-center text-sm font-semibold font-body border border-slate-200 rounded-lg py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <button
                        onClick={() => setQty(ri.item.id, Math.min(Math.min(ri.quantity, available), qty + 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-body cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                  {qty === 0 && (
                    <p className="text-xs text-red-600 font-body mt-1.5 font-medium">Not issuing — explain to student below</p>
                  )}
                  {partial && qty > 0 && (
                    <p className="text-xs text-amber-700 font-body mt-1.5">Partial issue: {qty} of {ri.quantity} requested</p>
                  )}
                  {notAvailable && qty === 0 && (
                    <p className="text-xs text-red-500 font-body mt-0.5">Out of stock</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
            Expected Return Date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={expectedReturnAt}
            onChange={(e) => setExpectedReturnAt(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-400 font-body mt-1">Student will see this deadline on their Requests page</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
            Notes / Condition (optional)
          </label>
          <input
            type="text"
            value={conditionOnIssue}
            onChange={(e) => setConditionOnIssue(e.target.value)}
            placeholder="e.g. Breadboard unavailable, will be given when restocked"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-xs text-red-600 font-body">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60"
          >
            {submitting ? 'Issuing...' : 'Confirm Issue'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── RETURN MODAL ─────────────────────────────────────────────────────────────
function ReturnModal({ request, onClose, onSuccess }) {
  const [conditionOnReturn, setConditionOnReturn] = useState('')
  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().slice(0, 16))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Per-item returned quantities — default to actual issued qty (not requested qty)
  const [returnedQtys, setReturnedQtys] = useState(() => {
    const init = {}
    request.items.forEach((ri) => {
      init[ri.item.id] = ri.issuedQuantity ?? ri.quantity
    })
    return init
  })

  const setQty = (itemId, val) => {
    setReturnedQtys((prev) => ({ ...prev, [itemId]: val }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/api/requests/${request.id}/return`, {
        conditionOnReturn: conditionOnReturn.trim() || null,
        returnedAt: new Date(returnedAt).toISOString(),
        returnedItems: request.items.map((ri) => ({
          itemId: ri.item.id,
          quantity: returnedQtys[ri.item.id] ?? 0,
        })),
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to mark as returned')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Mark as Returned" onClose={onClose}>
      <div className="space-y-4">
        {/* Per-item qty editor */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-body mb-2">
            Returning from {request.user.name} — set actual quantities returned
          </p>
          <div className="space-y-2">
            {request.items.map((ri) => {
              const issued = ri.issuedQuantity ?? ri.quantity
              const qty = returnedQtys[ri.item.id] ?? 0
              const notReturned = qty === 0

              return (
                <div key={ri.item.id} className={`rounded-xl border p-3 ${
                  notReturned ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 font-body">{ri.item.name}</p>
                      <p className="text-xs font-body mt-0.5 text-slate-500">
                        Issued: {issued}
                        {ri.issuedQuantity != null && ri.issuedQuantity < ri.quantity && (
                          <span className="ml-1 text-amber-600">(requested {ri.quantity})</span>
                        )}
                      </p>
                    </div>
                    {/* Qty stepper — capped at issued qty */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setQty(ri.item.id, Math.max(0, qty - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-body cursor-pointer"
                      >−</button>
                      <input
                        type="number"
                        min={0}
                        max={issued}
                        value={qty}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(issued, parseInt(e.target.value) || 0))
                          setQty(ri.item.id, v)
                        }}
                        className="w-10 text-center text-sm font-semibold font-body border border-slate-200 rounded-lg py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <button
                        onClick={() => setQty(ri.item.id, Math.min(issued, qty + 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-body cursor-pointer"
                      >+</button>
                    </div>
                  </div>
                  {notReturned && (
                    <p className="text-xs text-amber-700 font-body mt-1.5 font-medium">Not returned — stock will not be restored</p>
                  )}
                  {!notReturned && qty < issued && (
                    <p className="text-xs text-emerald-700 font-body mt-1.5">Partial return: {qty} of {issued}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
            Date & Time of Return <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={returnedAt}
            onChange={(e) => setReturnedAt(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
            Condition on Return (optional)
          </label>
          <input
            type="text"
            value={conditionOnReturn}
            onChange={(e) => setConditionOnReturn(e.target.value)}
            placeholder="e.g. Good condition, minor scratch on casing"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {error && <p className="text-xs text-red-600 font-body">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60"
          >
            {submitting ? 'Marking...' : 'Confirm Return'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── MODAL SHELL (shared wrapper) ─────────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="font-heading text-base font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [activeModal, setActiveModal] = useState(null) // { type, request }
  const [search, setSearch] = useState('')

  const fetchRequests = useCallback(async () => {
    setError('')
    try {
      const res = await api.get('/api/requests/all')
      if (res.data.success) setRequests(res.data.data.requests)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleActionSuccess = () => {
    setActiveModal(null)
    fetchRequests()
  }

  const filtered = requests
    .filter((r) => activeTab === 'ALL' || r.status === activeTab)
    .filter((r) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.user.name.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q) ||
        r.items.some((ri) => ri.item.name.toLowerCase().includes(q))
      )
    })

  const countByStatus = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Requests</h1>
          <p className="text-slate-500 mt-1 font-body text-sm">
            {requests.length} total request{requests.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="relative sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or item…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none mb-6 bg-white border border-slate-200 rounded-2xl p-1.5">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-500 font-body text-sm">
            {activeTab === 'ALL' ? 'No requests yet' : `No ${STATUS_STYLES[activeTab]?.label.toLowerCase()} requests`}
          </p>
        </div>
      )}

      {/* Request cards */}
      <div className="flex flex-col gap-4">
        {filtered.map((request) => {
          const style = STATUS_STYLES[request.status]
          const itemSummary = request.items.map((ri) => `${ri.item.name} ×${ri.quantity}`).join(', ')

          return (
            <div key={request.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50/70 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Student avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold font-body flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-primary)' }}>
                    {request.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 font-body leading-tight truncate">{request.user.name}</p>
                    <p className="text-xs text-slate-500 font-body truncate">{request.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-body hidden sm:block">{timeAgo(request.createdAt)}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border font-body ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-body mb-1">Items</p>
                    <p className="text-sm text-slate-800 font-body">{itemSummary}</p>
                  </div>
                  {/* Reason */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-body mb-1">Reason</p>
                    <p className="text-sm text-slate-600 font-body italic line-clamp-2">{request.reason}</p>
                  </div>
                </div>

                {/* Status-specific info */}
                {request.status === 'APPROVED' && request.collectionDeadline && (
                  <div className="mb-4 flex items-center gap-2 text-xs font-body text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Collect by: {formatDate(request.collectionDeadline)}
                  </div>
                )}

                {request.status === 'ISSUED' && request.transaction && (
                  <div className="mb-4 flex items-center gap-2 text-xs font-body text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Issued {formatDate(request.transaction.issuedAt)} · Return by {formatDate(request.transaction.expectedReturnAt)}
                  </div>
                )}

                {request.status === 'DECLINED' && request.declineReason && (
                  <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-semibold text-red-700 font-body">Decline reason: <span className="font-normal">{request.declineReason}</span></p>
                  </div>
                )}

                {request.status === 'RETURNED' && request.transaction && (
                  <div className="mb-4 flex items-center gap-2 text-xs font-body text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Returned {formatDate(request.transaction.returnedAt)}
                    {request.transaction.conditionOnReturn && ` · ${request.transaction.conditionOnReturn}`}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {request.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => setActiveModal({ type: 'approve', request })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-body cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => setActiveModal({ type: 'decline', request })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-body cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Decline
                      </button>
                    </>
                  )}

                  {request.status === 'APPROVED' && (
                    <>
                      <button
                        onClick={() => setActiveModal({ type: 'issue', request })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-body cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                        </svg>
                        Issue Items
                      </button>
                      <button
                        onClick={() => setActiveModal({ type: 'decline', request })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-body cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {request.status === 'ISSUED' && (
                    <button
                      onClick={() => setActiveModal({ type: 'return', request })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors font-body cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                      </svg>
                      Mark as Returned
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {activeModal?.type === 'approve' && (
        <ApproveModal request={activeModal.request} onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />
      )}
      {activeModal?.type === 'decline' && (
        <DeclineModal request={activeModal.request} onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />
      )}
      {activeModal?.type === 'issue' && (
        <IssueModal request={activeModal.request} onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />
      )}
      {activeModal?.type === 'return' && (
        <ReturnModal request={activeModal.request} onClose={() => setActiveModal(null)} onSuccess={handleActionSuccess} />
      )}
    </div>
  )
}

export default AdminRequests
