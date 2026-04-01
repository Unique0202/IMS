import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'

/**
 * Student Inventory page — shows all 9 categories as a grid of cards.
 *
 * HOW IT WORKS:
 *   1. On mount, fetches GET /api/inventory/categories
 *   2. API returns each category with its item count
 *   3. Renders cards in a responsive grid (1 col mobile → 3 cols desktop)
 *   4. Each card links to /student/inventory/:categoryId
 *
 * SEARCH BAR:
 *   Searches items across ALL categories via GET /api/inventory/search?q=
 *   Results appear in a dropdown below the search input.
 *   Clicking a result navigates to the category page for that item.
 *
 * WHY useEffect WITH EMPTY DEPENDENCY ARRAY?
 *   useEffect(() => { ... }, []) runs ONCE after the first render.
 *   The empty array [] means "no dependencies" — it won't re-run.
 *   This is the React way to do "fetch data on page load".
 */

// Icons for each category — mapped by name
const categoryIcons = {
  'Basic Electronics': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'Integrated Circuits': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  'Development Boards': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  'Sensors & Modules': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  'Communication & RF': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  ),
  'Power Supply & Batteries': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'Tools & Equipment': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'Cables & Connectors': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  'Mechanical/Robotics/Miscellaneous': (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
}

// Accent colors for category cards
const categoryColors = [
  { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', iconBg: 'bg-blue-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', iconBg: 'bg-purple-100' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', iconBg: 'bg-emerald-100' },
  { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', iconBg: 'bg-amber-100' },
  { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', iconBg: 'bg-cyan-100' },
  { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', iconBg: 'bg-red-100' },
  { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', iconBg: 'bg-slate-100' },
  { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', iconBg: 'bg-orange-100' },
  { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100', iconBg: 'bg-teal-100' },
]

function StudentInventory() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/inventory/categories')
        if (res.data.success) {
          setCategories(res.data.data)
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load categories')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Debounced search — waits 300ms after user stops typing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get(`/api/inventory/search?q=${encodeURIComponent(searchQuery.trim())}`)
        if (res.data.success) {
          setSearchResults(res.data.data.items)
          setShowResults(true)
        }
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    // Cleanup: if user types again within 300ms, cancel the previous timer
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Total items across all categories
  const totalItems = categories.reduce((sum, cat) => sum + cat.itemCount, 0)

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 font-heading">Browse Inventory</h1>
        <p className="text-slate-500 mt-1 font-body">
          {categories.length} categories, {totalItems} items available in the CIPD Lab
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search items across all categories... (e.g. Arduino, resistor, HDMI)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm font-body bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder:text-slate-400 transition-all"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              {searchResults.map((item) => (
                <Link
                  key={item.id}
                  to={`/student/inventory/${item.category.id}?highlight=${item.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 font-body">{item.name}</p>
                    <p className="text-xs text-slate-500 font-body">{item.category.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.type === 'RETURNABLE' ? 'bg-blue-50 text-blue-600' :
                      item.type === 'CONSUMABLE' ? 'bg-amber-50 text-amber-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-500 font-body">Qty: {item.quantity}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !searching && (
          <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-lg z-20 p-6 text-center">
            <p className="text-sm text-slate-500 font-body">No items found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-700 font-body">{error}</p>
        </div>
      )}

      {/* Categories grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((category, index) => {
          const color = categoryColors[index % categoryColors.length]
          const icon = categoryIcons[category.name]

          return (
            <Link
              key={category.id}
              to={`/student/inventory/${category.id}`}
              className={`group block border ${color.border} rounded-2xl p-6 hover:shadow-md transition-all duration-200 bg-white`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-2xl ${color.iconBg} ${color.text} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {icon || (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>

              {/* Name */}
              <h3 className="text-base font-semibold text-slate-900 font-heading mb-1 group-hover:text-cyan-700 transition-colors">
                {category.name}
              </h3>

              {/* Item count */}
              <p className="text-sm text-slate-500 font-body">
                {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'} available
              </p>

              {/* Arrow indicator */}
              <div className="mt-4 flex items-center text-sm text-slate-400 group-hover:text-cyan-600 transition-colors font-body">
                <span>Browse items</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default StudentInventory
