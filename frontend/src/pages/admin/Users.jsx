import { useState, useEffect, useCallback } from 'react'
import api from '../../utils/api'

const STATUS_STYLES = {
  PENDING:  'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  ISSUED:   'bg-blue-100 text-blue-700',
  DECLINED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-slate-100 text-slate-500',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── STUDENT DETAIL DRAWER ────────────────────────────────────────────────────
function StudentDrawer({ userId, onClose }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/users/${userId}`)
      .then((res) => { if (res.data.success) setData(res.data.data.user) })
      .finally(() => setLoading(false))

    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [userId, onClose])

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-heading text-base font-semibold text-slate-900">Student History</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-6 w-6 border-4 border-cyan-500 border-t-transparent rounded-full" />
            </div>
          ) : !data ? (
            <p className="text-slate-400 font-body text-sm text-center py-10">Failed to load student data</p>
          ) : (
            <div className="space-y-5">
              {/* Identity */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold font-heading text-lg flex-shrink-0">
                    {data.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 font-body">{data.name}</p>
                    <p className="text-xs text-slate-500 font-body">{data.email}</p>
                    <p className="text-xs text-slate-400 font-body mt-0.5">Joined {formatDate(data.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Requests */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-body mb-3">
                  {data.requests.length} Request{data.requests.length !== 1 ? 's' : ''}
                </p>
                {data.requests.length === 0 ? (
                  <p className="text-sm text-slate-400 font-body text-center py-6">No requests yet</p>
                ) : (
                  <div className="space-y-3">
                    {data.requests.map((req) => (
                      <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs text-slate-400 font-body">#{req.id} · {formatDate(req.createdAt)}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium font-body ${STATUS_STYLES[req.status]}`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {req.items.map((ri) => (
                            <span key={ri.item.id} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg font-body">
                              {ri.item.name} ×{ri.issuedQuantity ?? ri.quantity}
                            </span>
                          ))}
                        </div>
                        {req.transaction && (
                          <div className="text-[10px] text-slate-400 font-body space-y-0.5">
                            <p>Issued: {formatDateTime(req.transaction.issuedAt)}</p>
                            {req.transaction.expectedReturnAt && (
                              <p>Return by: {formatDateTime(req.transaction.expectedReturnAt)}</p>
                            )}
                            {req.transaction.returnedAt && (
                              <p>Returned: {formatDateTime(req.transaction.returnedAt)}</p>
                            )}
                          </div>
                        )}
                        {req.declineReason && (
                          <p className="text-[10px] text-red-500 font-body mt-1">Declined: {req.declineReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null) // userId for drawer

  const fetchUsers = useCallback(async () => {
    setError('')
    try {
      const res = await api.get('/api/users')
      if (res.data.success) setUsers(res.data.data.users)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

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
        <h1 className="text-2xl font-bold text-slate-900 font-heading">Students</h1>
        <p className="text-slate-500 mt-1 font-body text-sm">{users.length} registered student{users.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-body">No students found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Joined</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Requests</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Issued</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Pending</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-sm font-heading flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 font-body">{u.name}</p>
                            <p className="text-xs text-slate-400 font-body">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-body text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3"><span className="font-semibold text-slate-800 font-body">{u.totalRequests}</span></td>
                      <td className="px-4 py-3">
                        {u.issued > 0 ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-body font-medium">{u.issued} issued</span> : <span className="text-slate-300 font-body">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {u.pending > 0 ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-body font-medium">{u.pending} pending</span> : <span className="text-slate-300 font-body">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelected(u.id)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-body cursor-pointer transition-colors font-medium">View History</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold font-heading flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 font-body text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 font-body truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-xs text-slate-500 font-body">{u.totalRequests} requests</span>
                  {u.issued > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-body font-medium">{u.issued} issued</span>}
                  {u.pending > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-body font-medium">{u.pending} pending</span>}
                  <span className="text-xs text-slate-400 font-body">Joined {formatDate(u.createdAt)}</span>
                </div>
                <button onClick={() => setSelected(u.id)} className="w-full text-xs py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-body cursor-pointer transition-colors font-medium">
                  View History
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selected && (
        <StudentDrawer userId={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
