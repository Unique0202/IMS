import { useState, useEffect } from 'react'
import api from '../../utils/api'

const STATUS_COLORS = {
  PENDING:   { bg: 'bg-amber-400',  text: 'text-amber-700',  label: 'Pending' },
  APPROVED:  { bg: 'bg-emerald-400', text: 'text-emerald-700', label: 'Approved' },
  ISSUED:    { bg: 'bg-blue-400',   text: 'text-blue-700',   label: 'Issued' },
  DECLINED:  { bg: 'bg-red-400',    text: 'text-red-700',    label: 'Declined' },
  RETURNED:  { bg: 'bg-slate-400',  text: 'text-slate-600',  label: 'Returned' },
  CANCELLED: { bg: 'bg-gray-400',   text: 'text-gray-600',   label: 'Cancelled' },
}

function exportCSV(rows, headers, filename) {
  const csvRows = [headers, ...rows.map((r) => headers.map((h) => `"${r[h] ?? ''}"`))]
  const csv = csvRows.map((r) => (Array.isArray(r) ? r.join(',') : r.join(','))).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function getMonthlyBuckets(recentRequests) {
  const buckets = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      count: 0,
    })
  }
  recentRequests.forEach((r) => {
    const d     = new Date(r.createdAt)
    const mDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (mDiff >= 0 && mDiff <= 5) {
      buckets[5 - mDiff].count++
    }
  })
  return buckets
}

export default function Reports() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    api.get('/api/reports/summary')
      .then((res) => { if (res.data.success) setData(res.data.data) })
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async (type) => {
    setExporting(type)
    try {
      const res = await api.get(`/api/reports/export/${type}`)
      if (!res.data.success) return

      const rows = res.data.data.rows
      if (type === 'inventory') {
        exportCSV(
          rows,
          ['id','name','category','type','status','quantity','location','costOfPurchase','billNo','vendorDetails','purchaseDate','receivingDate'],
          `cipd_inventory_${new Date().toISOString().slice(0,10)}.csv`
        )
      } else {
        exportCSV(
          rows,
          ['id','student','email','status','items','reason','createdAt','issuedAt','returnedAt','expectedReturnAt'],
          `cipd_requests_${new Date().toISOString().slice(0,10)}.csv`
        )
      }
    } catch {
      // silent fail
    } finally {
      setExporting('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <p className="text-sm text-red-700 font-body">{error}</p>
      </div>
    )
  }

  const { statusCounts, recentRequests, topItems, inventoryValue, totalItems, totalStudents } = data
  const totalRequests = statusCounts.reduce((s, c) => s + c._count.id, 0)
  const months        = getMonthlyBuckets(recentRequests)
  const maxMonth      = Math.max(...months.map((m) => m.count), 1)

  const statusMap = {}
  statusCounts.forEach((s) => { statusMap[s.status] = s._count.id })

  const maxTop = Math.max(...topItems.map((t) => t.totalRequested), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading">Reports & Analytics</h1>
        <p className="text-slate-500 mt-1 font-body text-sm">Lab usage overview and data export</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: totalRequests, color: 'text-slate-900' },
          { label: 'Active Students', value: totalStudents, color: 'text-cyan-700' },
          { label: 'Inventory Items', value: totalItems, color: 'text-emerald-700' },
          {
            label: 'Inventory Value',
            value: inventoryValue > 0 ? `₹${Number(inventoryValue).toLocaleString('en-IN')}` : '—',
            color: 'text-amber-700',
          },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <p className="text-xs text-slate-500 font-body uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold font-heading mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown + Monthly chart */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Request status breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-base font-bold text-slate-900 font-heading mb-4">Requests by Status</h2>
          <div className="space-y-3">
            {Object.entries(STATUS_COLORS).map(([status, style]) => {
              const count = statusMap[status] || 0
              const pct   = totalRequests > 0 ? (count / totalRequests) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs font-semibold font-body ${style.text}`}>{style.label}</span>
                    <span className="text-xs text-slate-500 font-body">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${style.bg} transition-all duration-500`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly bar chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-base font-bold text-slate-900 font-heading mb-4">Requests — Last 6 Months</h2>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-slate-400 font-body text-center py-8">No requests in the last 6 months</p>
          ) : (
            <div className="flex items-end gap-2 h-36">
              {months.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-600 font-body">{m.count > 0 ? m.count : ''}</span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max((m.count / maxMonth) * 100, m.count > 0 ? 8 : 4)}%`,
                      backgroundColor: m.count > 0 ? 'var(--color-accent)' : '#e2e8f0',
                      minHeight: '4px',
                    }}
                  />
                  <span className="text-[10px] text-slate-400 font-body whitespace-nowrap">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top requested items */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-base font-bold text-slate-900 font-heading mb-4">Top 5 Most Requested Items</h2>
        {topItems.length === 0 ? (
          <p className="text-sm text-slate-400 font-body text-center py-6">No request data yet</p>
        ) : (
          <div className="space-y-3">
            {topItems.map((t, idx) => (
              <div key={t.itemId} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 font-body w-4 shrink-0">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-slate-800 font-body truncate block">
                        {t.item?.name || `Item #${t.itemId}`}
                      </span>
                      <span className="text-xs text-slate-400 font-body">{t.item?.category?.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-600 font-body ml-2 shrink-0">{t.totalRequested} units</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(t.totalRequested / maxTop) * 100}%`,
                        backgroundColor: 'var(--color-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSV Export */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-base font-bold text-slate-900 font-heading mb-1">Export Data</h2>
        <p className="text-sm text-slate-500 font-body mb-4">Download records as CSV spreadsheets</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleExport('inventory')}
            disabled={exporting === 'inventory'}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-body cursor-pointer disabled:opacity-60 transition-colors"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting === 'inventory' ? 'Exporting…' : 'Export Inventory'}
          </button>
          <button
            onClick={() => handleExport('requests')}
            disabled={exporting === 'requests'}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-body cursor-pointer disabled:opacity-60 transition-colors"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting === 'requests' ? 'Exporting…' : 'Export All Requests'}
          </button>
        </div>
      </div>
    </div>
  )
}
