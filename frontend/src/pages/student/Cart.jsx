import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import api from '../../utils/api'

const TYPE_BADGE = {
  RETURNABLE: 'bg-blue-50 text-blue-700',
  CONSUMABLE: 'bg-amber-50 text-amber-700',
  NA:         'bg-slate-100 text-slate-500',
}
const TYPE_LABEL = {
  RETURNABLE: 'Returnable',
  CONSUMABLE: 'Consumable',
  NA:         'N/A',
}

export default function Cart() {
  const { cart, removeFromCart, updateQty, clearCart } = useCart()
  const navigate = useNavigate()

  const [reason, setReason]         = useState('')
  const [reasonError, setReasonError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted]   = useState(false)

  const totalItems = cart.reduce((s, e) => s + e.requestedQty, 0)

  const handleSubmit = async () => {
    if (!reason.trim()) { setReasonError('Reason is required'); return }
    if (reason.trim().length < 10) { setReasonError('Reason must be at least 10 characters'); return }

    setReasonError('')
    setSubmitting(true)
    setSubmitError('')
    try {
      await api.post('/api/requests', {
        items: cart.map((e) => ({ itemId: e.item.id, quantity: e.requestedQty })),
        reason: reason.trim(),
      })
      clearCart()
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center px-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-heading mb-2">Request Submitted!</h2>
        <p className="text-slate-500 font-body text-sm mb-8">
          Your request has been sent to the lab admin. You'll be notified once it's reviewed.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/student/requests"
            className="px-5 py-2.5 text-sm rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 font-semibold font-body transition-colors"
          >
            View My Requests
          </Link>
          <Link
            to="/student/inventory"
            className="px-5 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-body transition-colors"
          >
            Browse More
          </Link>
        </div>
      </div>
    )
  }

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center px-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-heading mb-2">Your cart is empty</h2>
        <p className="text-slate-500 font-body text-sm mb-6">
          Browse the inventory and add items you want to borrow.
        </p>
        <Link
          to="/student/inventory"
          className="inline-block px-6 py-2.5 text-sm rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 font-semibold font-body transition-colors"
        >
          Browse Inventory
        </Link>
      </div>
    )
  }

  // ── Cart with items ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">My Cart</h1>
          <p className="text-slate-500 mt-1 font-body text-sm">
            {cart.length} item type{cart.length !== 1 ? 's' : ''} · {totalItems} total unit{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { if (window.confirm('Clear all items from cart?')) clearCart() }}
          className="text-xs text-red-500 hover:text-red-700 font-body cursor-pointer transition-colors"
        >
          Clear cart
        </button>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 mb-5">
        {cart.map(({ item, requestedQty }) => (
          <div key={item.id} className="flex items-center gap-4 p-4">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 font-body truncate">{item.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium font-body ${TYPE_BADGE[item.type] || TYPE_BADGE.NA}`}>
                  {TYPE_LABEL[item.type] || 'N/A'}
                </span>
                <span className={`text-xs font-body ${item.quantity === 0 ? 'text-red-500' : 'text-slate-400'}`}>
                  {item.quantity} in stock
                </span>
              </div>
            </div>

            {/* Qty stepper */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => updateQty(item.id, requestedQty - 1)}
                disabled={requestedQty <= 1}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-body transition-colors cursor-pointer text-base"
              >
                −
              </button>
              <span className="w-9 text-center text-sm font-bold text-slate-900 font-body">{requestedQty}</span>
              <button
                onClick={() => updateQty(item.id, requestedQty + 1)}
                disabled={requestedQty >= item.quantity}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-body transition-colors cursor-pointer text-base"
              >
                +
              </button>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-slate-300 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Reason + Submit */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
            Reason for Issue <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); if (reasonError) setReasonError('') }}
            placeholder="e.g. Project work for Embedded Systems course, Lab assignment 3..."
            rows={3}
            maxLength={300}
            className={`w-full text-sm border rounded-xl px-3 py-2.5 font-body resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
              reasonError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
            }`}
          />
          <div className="flex justify-between mt-1">
            {reasonError
              ? <p className="text-xs text-red-600 font-body">{reasonError}</p>
              : <span />
            }
            <p className="text-xs text-slate-400 font-body">{reason.length}/300</p>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700 font-body">{submitError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/student/inventory')}
            className="flex-1 py-3 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-body cursor-pointer transition-colors"
          >
            Add More Items
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 text-sm rounded-xl font-semibold font-body cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
