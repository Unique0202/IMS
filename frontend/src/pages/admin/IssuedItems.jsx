import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'

/**
 * Admin Issued Items page — /admin/issued
 *
 * Shows all requests currently in ISSUED state.
 * Highlights overdue items (expectedReturnAt is in the past).
 * Allows admin to mark any of them as returned via the ReturnModal
 * (imported inline here to keep it self-contained).
 */

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

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

function timeUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - Date.now()
  if (diff < 0) return null // overdue
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(hours / 24)
  if (hours < 1)  return 'less than 1h'
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

// ─── RETURN MODAL (inline) ────────────────────────────────────────────────────
function ReturnModal({ request, onClose, onSuccess }) {
  const [conditionOnReturn, setConditionOnReturn] = useState('')
  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().slice(0, 16))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [returnedQtys, setReturnedQtys] = useState(() => {
    const init = {}
    request.items.forEach((ri) => {
      init[ri.item.id] = ri.issuedQuantity ?? ri.quantity
    })
    return init
  })

  const setQty = (itemId, val) => setReturnedQtys((prev) => ({ ...prev, [itemId]: val }))

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="font-heading text-base font-semibold text-slate-900">Mark as Returned</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">
              Returning from {request.user.name} — set actual quantities returned
            </p>
            <div className="space-y-2">
              {request.items.map((ri) => {
                const issued = ri.issuedQuantity ?? ri.quantity
                const qty = returnedQtys[ri.item.id] ?? 0
                const notReturned = qty === 0
                return (
                  <div key={ri.item.id} className={`rounded-xl border p-3 ${notReturned ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
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
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => setQty(ri.item.id, Math.max(0, qty - 1))} className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-body cursor-pointer">−</button>
                        <input
                          type="number" min={0} max={issued} value={qty}
                          onChange={(e) => setQty(ri.item.id, Math.max(0, Math.min(issued, parseInt(e.target.value) || 0)))}
                          className="w-10 text-center text-sm font-semibold font-body border border-slate-200 rounded-lg py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                        <button onClick={() => setQty(ri.item.id, Math.min(issued, qty + 1))} className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-body cursor-pointer">+</button>
                      </div>
                    </div>
                    {notReturned && <p className="text-xs text-amber-700 font-body mt-1.5 font-medium">Not returned — stock will not be restored</p>}
                    {!notReturned && qty < issued && <p className="text-xs text-emerald-700 font-body mt-1.5">Partial return: {qty} of {issued}</p>}
                  </div>
                )
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">Date & Time of Return <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={returnedAt} onChange={(e) => setReturnedAt(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">Condition on Return (optional)</label>
              <input type="text" value={conditionOnReturn} onChange={(e) => setConditionOnReturn(e.target.value)}
                placeholder="e.g. Good condition, minor scratch on casing"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {error && <p className="text-xs text-red-600 font-body">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2.5 text-sm rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60">
                {submitting ? 'Marking...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function IssuedItems() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [returning, setReturning] = useState(null) // request being returned

  const fetchIssued = useCallback(async () => {
    setError('')
    try {
      const res = await api.get('/api/requests/all?status=ISSUED')
      if (res.data.success) setRequests(res.data.data.requests)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load issued items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchIssued() }, [fetchIssued])

  const overdue   = requests.filter((r) => r.transaction?.expectedReturnAt && new Date(r.transaction.expectedReturnAt) < new Date())
  const dueToday  = requests.filter((r) => {
    if (!r.transaction?.expectedReturnAt) return false
    const due = new Date(r.transaction.expectedReturnAt)
    const now = new Date()
    return due >= now && due - now < 24 * 3600000
  })

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-heading">Issued Items</h1>
        <p className="text-slate-500 mt-1 font-body text-sm">
          {requests.length} active loan{requests.length !== 1 ? 's' : ''}
          {overdue.length > 0 && (
            <span className="ml-2 text-red-600 font-semibold">{overdue.length} overdue</span>
          )}
        </p>
      </div>

      {/* Summary pills */}
      {(overdue.length > 0 || dueToday.length > 0) && (
        <div className="flex gap-3 mb-5 flex-wrap">
          {overdue.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-700 font-body">{overdue.length} overdue</span>
            </div>
          )}
          {dueToday.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold text-amber-700 font-body">{dueToday.length} due within 24h</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-slate-500 font-body">No items currently issued. All clear!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isOverdue = req.transaction?.expectedReturnAt && new Date(req.transaction.expectedReturnAt) < new Date()
            const remaining = timeUntil(req.transaction?.expectedReturnAt)

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border p-5 transition-colors ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left — student + items */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isOverdue && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium font-body uppercase tracking-wider">Overdue</span>
                      )}
                      {!isOverdue && remaining && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium font-body">Due in {remaining}</span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-slate-900 font-body">{req.user.name}</p>
                    <p className="text-xs text-slate-500 font-body mb-2">{req.user.email}</p>

                    {/* Items */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {req.items.map((ri) => (
                        <span key={ri.item.id} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-body">
                          {ri.item.name}
                          <span className="text-slate-400 ml-1">
                            ×{ri.issuedQuantity ?? ri.quantity}
                            {ri.issuedQuantity != null && ri.issuedQuantity < ri.quantity && (
                              <span className="text-amber-500"> (req {ri.quantity})</span>
                            )}
                          </span>
                        </span>
                      ))}
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-body">
                      <span>Issued {timeAgo(req.transaction?.issuedAt || req.updatedAt)}</span>
                      <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                        Return by: {formatDate(req.transaction?.expectedReturnAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right — action */}
                  <button
                    onClick={() => setReturning(req)}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl cursor-pointer transition-colors font-body ${
                      isOverdue
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    Mark Returned
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {returning && (
        <ReturnModal
          request={returning}
          onClose={() => setReturning(null)}
          onSuccess={() => { setReturning(null); fetchIssued() }}
        />
      )}
    </div>
  )
}
