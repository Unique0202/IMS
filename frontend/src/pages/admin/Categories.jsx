import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

function ModalShell({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 font-heading">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CategoryModal({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSubmitting(true)
    setError('')
    try {
      if (category) {
        await api.patch(`/api/inventory/categories/${category.id}`, { name: name.trim() })
      } else {
        await api.post('/api/inventory/categories', { name: name.trim() })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title={category ? 'Edit Category' : 'New Category'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            placeholder="e.g. Microcontrollers"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500"
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-red-600 font-body">{error}</p>}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm rounded-xl font-semibold text-white font-body cursor-pointer disabled:opacity-60 transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {submitting ? 'Saving…' : category ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function DeleteModal({ category, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setSubmitting(true)
    setError('')
    try {
      await api.delete(`/api/inventory/categories/${category.id}`)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell title="Delete Category" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-800 font-body">
            Are you sure you want to delete <span className="font-semibold">"{category.name}"</span>?
            This cannot be undone.
          </p>
          {error && <p className="mt-2 text-xs text-red-700 font-body font-semibold">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 font-body cursor-pointer disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // { type: 'create'|'edit'|'delete', category? }

  const fetchCategories = useCallback(async () => {
    setError('')
    try {
      const res = await api.get('/api/inventory/categories')
      if (res.data.success) setCategories(res.data.data)
    } catch {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleSaved = () => { setModal(null); fetchCategories() }
  const handleDeleted = () => { setModal(null); fetchCategories() }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Categories</h1>
          <p className="text-slate-500 mt-1 font-body text-sm">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white font-body cursor-pointer transition-colors"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-slate-500 font-body text-sm">No categories yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-shell)' }}>
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 font-body truncate">{cat.name}</p>
                  <p className="text-xs text-slate-400 font-body">
                    {cat.itemCount} item{cat.itemCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <Link
                  to={`/admin/inventory?categoryId=${cat.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 font-body transition-colors"
                >
                  View items
                </Link>
                <button
                  onClick={() => setModal({ type: 'edit', category: cat })}
                  className="text-xs px-3 py-1.5 rounded-lg text-cyan-700 hover:bg-cyan-50 font-body transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => setModal({ type: 'delete', category: cat })}
                  disabled={cat.itemCount > 0}
                  className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-body transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={cat.itemCount > 0 ? 'Remove all items before deleting' : 'Delete category'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'create' && (
        <CategoryModal onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'edit' && (
        <CategoryModal category={modal.category} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal category={modal.category} onClose={() => setModal(null)} onDeleted={handleDeleted} />
      )}
    </div>
  )
}
