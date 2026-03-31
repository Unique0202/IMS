import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../utils/api'
import { useCart } from '../../context/CartContext'

function CategoryItems() {
  const { categoryId } = useParams()
  const { addToCart, isInCart, setCartOpen } = useCart()

  const [category, setCategory] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Which item's qty picker is open
  const [pickerOpenId, setPickerOpenId] = useState(null)
  const [pickerQty, setPickerQty] = useState({})

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      setError('')
      try {
        let url = `/api/inventory/categories/${categoryId}?sort=${sortField}&order=${sortOrder}`
        if (typeFilter !== 'ALL') url += `&type=${typeFilter}`
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

  const typeBadge = (type) => {
    switch (type) {
      case 'RETURNABLE': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'CONSUMABLE': return 'bg-amber-50 text-amber-700 border-amber-200'
      default:           return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const qtyColor = (qty) => {
    if (qty === 0)  return 'text-red-600'
    if (qty <= 5)   return 'text-amber-600'
    return 'text-emerald-600'
  }

  // Placeholder icon inside the image area when no imageUrl
  const PlaceholderImage = ({ type }) => {
    const styles = {
      RETURNABLE: { bg: 'bg-blue-50',   icon: 'text-blue-300' },
      CONSUMABLE: { bg: 'bg-amber-50',  icon: 'text-amber-300' },
      NA:         { bg: 'bg-slate-100', icon: 'text-slate-300' },
    }
    const s = styles[type] || styles.NA
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${s.bg}`}>
        {type === 'RETURNABLE' ? (
          <svg className={`w-10 h-10 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        ) : type === 'CONSUMABLE' ? (
          <svg className={`w-10 h-10 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ) : (
          <svg className={`w-10 h-10 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )}
        <span className={`text-xs font-medium font-body ${s.icon}`}>No Image</span>
      </div>
    )
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
          <p className="text-slate-500 mt-1 font-body text-sm">
            {items.length} {items.length === 1 ? 'item' : 'items'} available
          </p>
        </div>
        <Link
          to="/student/inventory"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-body w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Categories
        </Link>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-body uppercase tracking-wider">Type:</span>
          {['ALL', 'RETURNABLE', 'CONSUMABLE'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer font-body ${
                typeFilter === type ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

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

      {/* Empty state */}
      {items.length === 0 && !loading ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-slate-500 font-body">No items found with the current filters</p>
          {typeFilter !== 'ALL' && (
            <button onClick={() => setTypeFilter('ALL')} className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 font-medium font-body cursor-pointer">
              Clear filter
            </button>
          )}
        </div>
      ) : (
        /* Product card grid — 2 cols on mobile, 3 on md, 4 on xl */
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const inCart = isInCart(item.id)
            const pickerOpen = pickerOpenId === item.id
            const outOfStock = item.quantity === 0

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md ${
                  outOfStock ? 'border-slate-200 opacity-70' : 'border-slate-200'
                }`}
              >
                {/* Image area — square, fixed height */}
                <div className="relative w-full aspect-square overflow-hidden bg-slate-50">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain p-3"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentNode.querySelector('.placeholder-fallback').style.display = 'flex'
                      }}
                    />
                  ) : null}
                  {/* Placeholder — shown when no imageUrl or image fails */}
                  <div
                    className="placeholder-fallback w-full h-full absolute inset-0"
                    style={{ display: item.imageUrl ? 'none' : 'flex' }}
                  >
                    <PlaceholderImage type={item.type} />
                  </div>

                  {/* Out of stock overlay */}
                  {outOfStock && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full font-body border border-red-200">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Type badge — top left corner */}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium font-body ${typeBadge(item.type)}`}>
                      {item.type === 'RETURNABLE' ? 'Returnable' : item.type === 'CONSUMABLE' ? 'Consumable' : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 p-3 gap-2">
                  {/* Item name */}
                  <p className="text-sm font-semibold text-slate-800 font-body leading-snug line-clamp-2">
                    {item.name}
                  </p>

                  {/* Quantity + location row */}
                  <div className="flex items-center justify-between text-xs font-body mt-auto">
                    <span className={`font-semibold ${qtyColor(item.quantity)}`}>
                      {item.quantity} in stock
                    </span>
                    {item.location && (
                      <span className="text-slate-400 truncate ml-1">{item.location}</span>
                    )}
                  </div>

                  {/* Add to Cart / In Cart / Qty picker */}
                  {inCart ? (
                    <button
                      onClick={() => setCartOpen(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-body cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      In Cart
                    </button>
                  ) : pickerOpen ? (
                    <div className="flex flex-col gap-2">
                      {/* Qty selector */}
                      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-2 py-1">
                        <button
                          onClick={() => setPickerQty((p) => ({ ...p, [item.id]: Math.max(1, (p[item.id] || 1) - 1) }))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-body cursor-pointer shadow-sm"
                        >−</button>
                        <span className="text-sm font-semibold text-slate-900 font-body w-8 text-center">
                          {pickerQty[item.id] || 1}
                        </span>
                        <button
                          onClick={() => setPickerQty((p) => ({ ...p, [item.id]: Math.min(item.quantity, (p[item.id] || 1) + 1) }))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-body cursor-pointer shadow-sm"
                        >+</button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            addToCart(item, pickerQty[item.id] || 1)
                            setPickerOpenId(null)
                          }}
                          className="flex-1 py-2 text-xs font-semibold rounded-xl text-white transition-colors font-body cursor-pointer"
                          style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setPickerOpenId(null)}
                          className="px-3 py-2 text-xs rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors font-body cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      disabled={outOfStock}
                      onClick={() => {
                        setPickerOpenId(item.id)
                        setPickerQty((p) => ({ ...p, [item.id]: 1 }))
                      }}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-colors font-body ${
                        outOfStock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-cyan-600 text-white hover:bg-cyan-700 cursor-pointer'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                      {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CategoryItems
