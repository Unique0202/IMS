import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'

/**
 * Category Items page — shows all items within a single category.
 *
 * HOW IT WORKS:
 *   1. Reads categoryId from the URL via useParams()
 *   2. Fetches GET /api/inventory/categories/:id
 *   3. Renders items as a table (desktop) or card list (mobile)
 *   4. Includes filters: item type (Consumable/Returnable) and sort
 *
 * useParams() EXPLAINED:
 *   React Router extracts the :categoryId part from the URL.
 *   URL: /student/inventory/3  →  useParams() returns { categoryId: "3" }
 *   Note: it's always a string, so we parseInt() it.
 *
 * ADD TO CART (Phase 6):
 *   Each item row has an "Add to Cart" button that currently shows an alert.
 *   Phase 6 will replace this with CartContext integration.
 */

function CategoryItems() {
  const { categoryId } = useParams()
  const { addToCart, isInCart, setCartOpen } = useCart()

  const [category, setCategory] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tracks which item's inline qty picker is open: itemId or null
  const [pickerOpenId, setPickerOpenId] = useState(null)
  // Tracks selected qty per item in the picker
  const [pickerQty, setPickerQty] = useState({})

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // Fetch items when category/filters change
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      setError('')
      try {
        let url = `/api/inventory/categories/${categoryId}?sort=${sortField}&order=${sortOrder}`
        if (typeFilter !== 'ALL') {
          url += `&type=${typeFilter}`
        }
        const res = await api.get(url)
        if (res.data.success) {
          setCategory(res.data.data.category)
          setItems(res.data.data.items)
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load items')
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [categoryId, typeFilter, sortField, sortOrder])

  // Type badge styling
  const typeBadge = (type) => {
    switch (type) {
      case 'RETURNABLE':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CONSUMABLE':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  // Quantity color (red if low stock)
  const qtyColor = (qty) => {
    if (qty === 0) return 'text-red-600 bg-red-50'
    if (qty <= 5) return 'text-amber-600 bg-amber-50'
    return 'text-emerald-600 bg-emerald-50'
  }

  if (loading && !category) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-body mb-6">
        <Link to="/student/inventory" className="hover:text-cyan-600 transition-colors">
          Inventory
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 font-medium">{category?.name || 'Category'}</span>
      </div>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">{category?.name}</h1>
          <p className="text-slate-500 mt-1 font-body">
            {items.length} {items.length === 1 ? 'item' : 'items'} found
          </p>
        </div>

        {/* Back button */}
        <Link
          to="/student/inventory"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-body"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Categories
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-slate-200 rounded-2xl p-4">
        {/* Type filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-body uppercase tracking-wider">Type:</span>
          {['ALL', 'RETURNABLE', 'CONSUMABLE'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer font-body ${
                typeFilter === type
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-body uppercase tracking-wider">Sort:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white font-body cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="name">Name</option>
            <option value="quantity">Quantity</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            <svg className={`w-4 h-4 text-slate-600 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {/* Items table (desktop) / card list (mobile) */}
      {items.length === 0 && !loading ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-slate-500 font-body">No items found with the current filters</p>
          {typeFilter !== 'ALL' && (
            <button
              onClick={() => setTypeFilter('ALL')}
              className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 font-medium font-body cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3.5 font-body">Item Name</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3.5 font-body">Type</th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3.5 font-body">Available</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3.5 font-body">Location</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3.5 font-body">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx === items.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900 font-body">{item.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium font-body ${typeBadge(item.type)}`}>
                        {item.type === 'RETURNABLE' ? 'Returnable' : item.type === 'CONSUMABLE' ? 'Consumable' : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center text-sm font-semibold font-body px-2.5 py-0.5 rounded-lg ${qtyColor(item.quantity)}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500 font-body">{item.location || 'CIPD Lab'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.quantity === 0 ? (
                        <span className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-xl bg-slate-100 text-slate-400 font-body">
                          Out of Stock
                        </span>
                      ) : isInCart(item.id) ? (
                        /* Already in cart — show green "In Cart" button that opens sidebar */
                        <button
                          onClick={() => setCartOpen(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-body cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          In Cart
                        </button>
                      ) : pickerOpenId === item.id ? (
                        /* Inline qty picker */
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setPickerQty((p) => ({ ...p, [item.id]: Math.max(1, (p[item.id] || 1) - 1) }))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 text-sm font-body cursor-pointer"
                          >−</button>
                          <span className="w-6 text-center text-sm font-semibold text-slate-900 font-body">
                            {pickerQty[item.id] || 1}
                          </span>
                          <button
                            onClick={() => setPickerQty((p) => ({ ...p, [item.id]: Math.min(item.quantity, (p[item.id] || 1) + 1) }))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 text-sm font-body cursor-pointer"
                          >+</button>
                          <button
                            onClick={() => {
                              addToCart(item, pickerQty[item.id] || 1)
                              setPickerOpenId(null)
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-colors font-body cursor-pointer"
                          >Add</button>
                          <button
                            onClick={() => setPickerOpenId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            aria-label="Cancel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        /* Default Add to Cart button — opens inline picker */
                        <button
                          onClick={() => {
                            setPickerOpenId(item.id)
                            setPickerQty((p) => ({ ...p, [item.id]: 1 }))
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-colors font-body cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add to Cart
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 font-body">{item.name}</p>
                    <p className="text-xs text-slate-500 font-body mt-0.5">{item.location || 'CIPD Lab'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium font-body ${typeBadge(item.type)}`}>
                    {item.type === 'RETURNABLE' ? 'Returnable' : item.type === 'CONSUMABLE' ? 'Consumable' : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold font-body px-2.5 py-0.5 rounded-lg ${qtyColor(item.quantity)}`}>
                    Qty: {item.quantity}
                  </span>
                  {item.quantity === 0 ? (
                    <span className="text-xs text-slate-400 font-body">Out of Stock</span>
                  ) : isInCart(item.id) ? (
                    <button
                      onClick={() => setCartOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-body cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      In Cart
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        addToCart(item, 1)
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-colors font-body cursor-pointer"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default CategoryItems
