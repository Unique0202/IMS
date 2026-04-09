import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

const ITEM_TYPES   = ['NA', 'RETURNABLE', 'CONSUMABLE']
const PURPOSES     = ['ISSUE', 'COURSE', 'HACKATHON']
const ITEM_STATUSES = ['ACTIVE', 'INACTIVE']

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 font-body mt-1">{hint}</p>}
    </div>
  )
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 ${className}`}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
    >
      {children}
    </select>
  )
}

export default function AddItem() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]  = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    quantity: '',
    type: 'NA',
    purpose: 'ISSUE',
    status: 'ACTIVE',
    location: '',
    imageUrl: '',
    rfid: '',
    vendorDetails: '',
    costOfPurchase: '',
    billNo: '',
    purchaseDate: '',
    receivingDate: '',
  })

  useEffect(() => {
    api.get('/api/inventory/categories').then((res) => {
      if (res.data.success) setCategories(res.data.data)
    })
  }, [])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Item name is required'); return }
    if (!form.categoryId) { setError('Please select a category'); return }
    if (!form.quantity || isNaN(parseInt(form.quantity))) { setError('Quantity is required'); return }

    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/inventory/items', {
        ...form,
        quantity: parseInt(form.quantity),
        categoryId: parseInt(form.categoryId),
        costOfPurchase: form.costOfPurchase ? parseFloat(form.costOfPurchase) : undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create item')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-heading mb-2">Item Added!</h2>
        <p className="text-slate-500 font-body text-sm mb-6">The item has been added to the inventory.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(false); setForm({ name:'',categoryId:'',quantity:'',type:'NA',purpose:'ISSUE',status:'ACTIVE',location:'',imageUrl:'',rfid:'',vendorDetails:'',costOfPurchase:'',billNo:'',purchaseDate:'',receivingDate:'' }) }}
            className="px-5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-body cursor-pointer transition-colors"
          >
            Add Another
          </button>
          <button
            onClick={() => navigate('/admin/inventory')}
            className="px-5 py-2.5 text-sm rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 font-semibold font-body cursor-pointer transition-colors"
          >
            Go to Inventory
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 font-heading">Add New Item</h1>
        <p className="text-slate-500 mt-1 font-body text-sm">Add a new item to the lab inventory</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Core info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-body">Basic Info</p>

          <Field label="Item Name" required>
            <Input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Arduino UNO R3"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category" required>
              <Select value={form.categoryId} onChange={set('categoryId')}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Quantity" required>
              <Input
                type="number"
                min={0}
                value={form.quantity}
                onChange={set('quantity')}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Type">
              <Select value={form.type} onChange={set('type')}>
                {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Purpose">
              <Select value={form.purpose} onChange={set('purpose')}>
                {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={set('status')}>
                {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>

          <Field label="Location" hint="Cabinet, shelf, or lab name">
            <Input
              type="text"
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. Cabinet A, Shelf 2"
            />
          </Field>

          <Field label="Image URL" hint="Direct link to item image (optional)">
            <Input
              type="url"
              value={form.imageUrl}
              onChange={set('imageUrl')}
              placeholder="https://..."
            />
          </Field>

          <Field label="RFID Tag">
            <Input
              type="text"
              value={form.rfid}
              onChange={set('rfid')}
              placeholder="RFID code (if tagged)"
            />
          </Field>
        </div>

        {/* Purchase details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-body">Purchase Details (optional)</p>

          <Field label="Vendor / Supplier">
            <Input
              type="text"
              value={form.vendorDetails}
              onChange={set('vendorDetails')}
              placeholder="e.g. Robu.in, Amazon"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Cost of Purchase (₹)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.costOfPurchase}
                onChange={set('costOfPurchase')}
                placeholder="0.00"
              />
            </Field>
            <Field label="Bill / Invoice No.">
              <Input
                type="text"
                value={form.billNo}
                onChange={set('billNo')}
                placeholder="e.g. INV-2024-0042"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Purchase Date">
              <Input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
            </Field>
            <Field label="Receiving Date">
              <Input type="date" value={form.receivingDate} onChange={set('receivingDate')} />
            </Field>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700 font-body">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/admin/inventory')}
            className="flex-1 py-3 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 text-sm rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60"
          >
            {submitting ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </form>
    </div>
  )
}
