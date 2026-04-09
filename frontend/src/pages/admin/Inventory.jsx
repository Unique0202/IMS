import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const ITEM_TYPES    = ['NA', 'RETURNABLE', 'CONSUMABLE']
const PURPOSES      = ['ISSUE', 'COURSE', 'HACKATHON']
const ITEM_STATUSES = ['ACTIVE', 'INACTIVE']

const TYPE_BADGE = {
  RETURNABLE: 'bg-blue-100 text-blue-700',
  CONSUMABLE: 'bg-amber-100 text-amber-700',
  NA:         'bg-slate-100 text-slate-500',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:           item.name,
    categoryId:     item.category.id,
    quantity:       String(item.quantity),
    type:           item.type,
    purpose:        item.purpose,
    status:         item.status,
    location:       item.location || '',
    imageUrl:       item.imageUrl || '',
    rfid:           item.rfid || '',
    vendorDetails:  item.vendorDetails || '',
    costOfPurchase: item.costOfPurchase != null ? String(item.costOfPurchase) : '',
    billNo:         item.billNo || '',
    purchaseDate:   item.purchaseDate ? item.purchaseDate.slice(0, 10) : '',
    receivingDate:  item.receivingDate ? item.receivingDate.slice(0, 10) : '',
  })
  const [categories, setCategories] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/inventory/categories').then((res) => {
      if (res.data.success) setCategories(res.data.data)
    })
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSubmitting(true)
    setError('')
    try {
      await api.patch(`/api/inventory/items/${item.id}`, {
        ...form,
        quantity:       parseInt(form.quantity),
        categoryId:     parseInt(form.categoryId),
        costOfPurchase: form.costOfPurchase ? parseFloat(form.costOfPurchase) : null,
        purchaseDate:   form.purchaseDate || null,
        receivingDate:  form.receivingDate || null,
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  function Input({ className = '', ...props }) {
    return (
      <input
        {...props}
        className={`w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 ${className}`}
      />
    )
  }
  function Sel({ children, ...props }) {
    return (
      <select
        {...props}
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
      >
        {children}
      </select>
    )
  }
  function Label({ children }) {
    return <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-body mb-1">{children}</label>
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h3 className="font-heading text-base font-semibold text-slate-900">Edit Item</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input value={form.name} onChange={set('name')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Sel value={form.categoryId} onChange={set('categoryId')}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Sel>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Input type="number" min={0} value={form.quantity} onChange={set('quantity')} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <Sel value={form.type} onChange={set('type')}>
                  {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Sel>
              </div>
              <div>
                <Label>Purpose</Label>
                <Sel value={form.purpose} onChange={set('purpose')}>
                  {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                </Sel>
              </div>
              <div>
                <Label>Status</Label>
                <Sel value={form.status} onChange={set('status')}>
                  {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Sel>
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={set('location')} placeholder="Cabinet A, Shelf 2" />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
            </div>
            <div>
              <Label>RFID</Label>
              <Input value={form.rfid} onChange={set('rfid')} />
            </div>
            <div>
              <Label>Vendor</Label>
              <Input value={form.vendorDetails} onChange={set('vendorDetails')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cost (₹)</Label>
                <Input type="number" min={0} step="0.01" value={form.costOfPurchase} onChange={set('costOfPurchase')} />
              </div>
              <div>
                <Label>Bill No.</Label>
                <Input value={form.billNo} onChange={set('billNo')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
              </div>
              <div>
                <Label>Receiving Date</Label>
                <Input type="date" value={form.receivingDate} onChange={set('receivingDate')} />
              </div>
            </div>

            {error && <p className="text-xs text-red-600 font-body">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex-1 py-2.5 text-sm rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── CONFIRM DELETE MODAL ─────────────────────────────────────────────────────
function DeleteModal({ item, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false)

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await api.delete(`/api/inventory/items/${item.id}`)
      onDeleted()
    } catch {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 font-heading mb-1">Remove Item?</h3>
          <p className="text-sm text-slate-500 font-body mb-1">
            <span className="font-semibold text-slate-700">{item.name}</span> will be hidden from students.
          </p>
          <p className="text-xs text-slate-400 font-body mb-5">This is a soft delete — you can restore it later.</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 py-2.5 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60"
            >
              {submitting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminInventory() {
  const navigate = useNavigate()
  const [items, setItems]         = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [editItem, setEditItem]   = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  // Filters
  const [search, setSearch]           = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)

  const fetchItems = useCallback(async () => {
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterCat)    params.set('categoryId', filterCat)
      if (filterStatus) params.set('status', filterStatus)
      if (showDeleted)  params.set('deleted', 'true')
      else              params.set('deleted', 'false')
      if (search.trim().length >= 1) params.set('q', search.trim())

      const res = await api.get(`/api/inventory/admin/items?${params}`)
      if (res.data.success) setItems(res.data.data.items)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }, [filterCat, filterStatus, showDeleted, search])

  useEffect(() => { fetchItems() }, [fetchItems])

  useEffect(() => {
    api.get('/api/inventory/categories').then((res) => {
      if (res.data.success) setCategories(res.data.data)
    })
  }, [])

  const handleRestore = async (item) => {
    try {
      await api.patch(`/api/inventory/items/${item.id}/restore`)
      fetchItems()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to restore')
    }
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
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Inventory</h1>
          <p className="text-slate-500 mt-1 font-body text-sm">{items.length} item{items.length !== 1 ? 's' : ''} shown</p>
        </div>
        <button
          onClick={() => navigate('/admin/add-item')}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors cursor-pointer font-body"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 flex-1 min-w-40"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-body text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show removed
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-body">
          No items found. Try adjusting filters or{' '}
          <button onClick={() => navigate('/admin/add-item')} className="text-cyan-600 underline cursor-pointer">add a new item</button>.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Added</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider font-body">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const deleted = !!item.deletedAt
                  const inactive = item.status === 'INACTIVE'
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${deleted ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 font-body">{item.name}</span>
                          {inactive && !deleted && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-body font-medium">Inactive</span>
                          )}
                          {deleted && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-body font-medium">Removed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-body">{item.category.name}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold font-body ${item.quantity === 0 ? 'text-red-600' : item.quantity <= 5 ? 'text-amber-600' : 'text-slate-800'}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium font-body ${TYPE_BADGE[item.type]}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-body text-xs">{item.location || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 font-body text-xs">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {deleted ? (
                            <button
                              onClick={() => handleRestore(item)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-body cursor-pointer transition-colors font-medium"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditItem(item)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-body cursor-pointer transition-colors font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteItem(item)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-body cursor-pointer transition-colors font-medium"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); fetchItems() }}
        />
      )}
      {deleteItem && (
        <DeleteModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onDeleted={() => { setDeleteItem(null); fetchItems() }}
        />
      )}
    </div>
  )
}
