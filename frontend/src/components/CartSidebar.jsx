import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

/**
 * CartSidebar — slide-in panel from the right side of the screen.
 *
 * HOW IT WORKS:
 *   - Controlled by cartOpen / setCartOpen in CartContext
 *   - Renders a dark overlay behind it (clicking overlay closes it)
 *   - Shows all cart items with quantity controls
 *   - Has a "Reason for Issue" textarea (required before submitting)
 *   - On submit: calls POST /api/requests, clears cart, shows success
 *
 * SLIDE ANIMATION:
 *   The sidebar has `translate-x-full` (off-screen right) when closed
 *   and `translate-x-0` when open. CSS transition handles the animation.
 *
 * TYPE BADGES:
 *   RETURNABLE = blue (must be returned)
 *   CONSUMABLE = amber (kept by student)
 *   NA         = gray
 */
function CartSidebar() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, clearCart, cartTotal } = useCart()
  const { user } = useAuth()

  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Reset state when sidebar opens
  useEffect(() => {
    if (cartOpen) {
      setSubmitSuccess(false)
      setSubmitError('')
      setReasonError('')
    }
  }, [cartOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setCartOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setCartOpen])

  const handleSubmit = async () => {
    // Validate reason
    if (!reason.trim()) {
      setReasonError('Please provide a reason for this request')
      return
    }
    if (reason.trim().length < 10) {
      setReasonError('Reason must be at least 10 characters')
      return
    }

    setReasonError('')
    setSubmitting(true)
    setSubmitError('')

    try {
      await api.post('/api/requests', {
        items: cart.map((entry) => ({
          itemId: entry.item.id,
          quantity: entry.requestedQty,
        })),
        reason: reason.trim(),
      })

      setSubmitSuccess(true)
      clearCart()
      setReason('')

      // Close sidebar after 2 seconds
      setTimeout(() => {
        setCartOpen(false)
        setSubmitSuccess(false)
      }, 2000)
    } catch (err) {
      setSubmitError(
        err.response?.data?.error?.message || 'Failed to submit request. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const typeBadge = (type) => {
    switch (type) {
      case 'RETURNABLE':
        return 'bg-blue-50 text-blue-700'
      case 'CONSUMABLE':
        return 'bg-amber-50 text-amber-700'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <>
      {/* Dark overlay — only rendered when open */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setCartOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Cart"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <h2 className="text-white font-semibold text-base font-body">
              My Cart
              {cartTotal > 0 && (
                <span className="ml-2 bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  {cartTotal} {cartTotal === 1 ? 'item' : 'items'}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {submitSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 font-heading mb-2">Request Submitted!</h3>
            <p className="text-slate-500 text-sm font-body">
              Your request has been sent to the lab admin. You'll be notified once it's reviewed.
            </p>
          </div>
        ) : (
          <>
            {/* Cart items — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  <p className="text-slate-500 font-body text-sm">Your cart is empty</p>
                  <p className="text-slate-400 font-body text-xs mt-1">Browse inventory and add items to request them</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 px-5">
                  {cart.map(({ item, requestedQty }) => (
                    <li key={item.id} className="py-4 flex items-start gap-3">
                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 font-body truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium font-body ${typeBadge(item.type)}`}>
                            {item.type === 'RETURNABLE' ? 'Returnable' : item.type === 'CONSUMABLE' ? 'Consumable' : 'N/A'}
                          </span>
                          <span className="text-xs text-slate-400 font-body">{item.quantity} in stock</span>
                        </div>
                      </div>

                      {/* Qty control */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => updateQty(item.id, requestedQty - 1)}
                          disabled={requestedQty <= 1}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-body text-sm transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-slate-900 font-body">
                          {requestedQty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, requestedQty + 1)}
                          disabled={requestedQty >= item.quantity}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-body text-sm transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer flex-shrink-0"
                        aria-label={`Remove ${item.name}`}
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer — reason + submit (only when cart has items) */}
            {cart.length > 0 && (
              <div className="border-t border-slate-200 p-5 flex-shrink-0 space-y-4">
                {/* Reason textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
                    Reason for Issue <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value)
                      if (reasonError) setReasonError('')
                    }}
                    placeholder="e.g. Project work for Embedded Systems course, Lab assignment 3..."
                    rows={3}
                    maxLength={300}
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 font-body resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                      reasonError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  <div className="flex justify-between mt-1">
                    {reasonError ? (
                      <p className="text-xs text-red-600 font-body">{reasonError}</p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-slate-400 font-body">{reason.length}/300</p>
                  </div>
                </div>

                {/* Submit error */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs text-red-700 font-body">{submitError}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm font-body transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default CartSidebar
