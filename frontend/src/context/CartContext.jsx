import { createContext, useContext, useState, useCallback, useEffect } from 'react'

/**
 * CartContext — manages the student's cart across all pages.
 *
 * WHY CONTEXT FOR CART?
 *   The cart icon lives in Navbar, the "Add to Cart" button lives in
 *   CategoryItems, and the CartSidebar renders inside Layout.
 *   All three are in completely different parts of the component tree.
 *   Context lets all of them share the same cart state without prop drilling.
 *
 * CART DATA SHAPE:
 *   cart = [
 *     {
 *       item: { id, name, type, quantity },  ← the full item from API
 *       requestedQty: 2                       ← how many the student wants
 *     },
 *     ...
 *   ]
 *
 * NOTE ON PERSISTENCE:
 *   The cart lives only in React state — it resets on page refresh.
 *   This is intentional: a cart is a temporary session thing.
 *   Requests, once submitted, are stored in the database permanently.
 */
const CartContext = createContext(null)

const CART_KEY = 'cipd_cart'

export function CartProvider({ children }) {
  // Load cart from localStorage on first render
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart))
    } catch { /* storage full or unavailable */ }
  }, [cart])

  /**
   * addToCart — adds an item to the cart or updates its quantity if already present.
   * @param {object} item    - full item object from the API
   * @param {number} qty     - how many the student wants (default 1)
   */
  const addToCart = useCallback((item, qty = 1) => {
    setCart((prev) => {
      const exists = prev.find((entry) => entry.item.id === item.id)
      if (exists) {
        // Update quantity — cap at available stock
        return prev.map((entry) =>
          entry.item.id === item.id
            ? { ...entry, requestedQty: Math.min(entry.requestedQty + qty, item.quantity) }
            : entry
        )
      }
      // Add new entry
      return [...prev, { item, requestedQty: Math.min(qty, item.quantity) }]
    })
  }, [])

  /**
   * removeFromCart — removes an item by its ID.
   */
  const removeFromCart = useCallback((itemId) => {
    setCart((prev) => prev.filter((entry) => entry.item.id !== itemId))
  }, [])

  /**
   * updateQty — sets the quantity for a specific item.
   * @param {number} itemId  - item's DB id
   * @param {number} newQty  - the new quantity (clamped between 1 and available stock)
   */
  const updateQty = useCallback((itemId, newQty) => {
    setCart((prev) =>
      prev.map((entry) => {
        if (entry.item.id !== itemId) return entry
        const clamped = Math.max(1, Math.min(newQty, entry.item.quantity))
        return { ...entry, requestedQty: clamped }
      })
    )
  }, [])

  /**
   * clearCart — empties the cart completely (called after successful submission).
   */
  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  /**
   * isInCart — returns true if an item is already in the cart.
   */
  const isInCart = useCallback(
    (itemId) => cart.some((entry) => entry.item.id === itemId),
    [cart]
  )

  /**
   * cartTotal — total number of individual items across all entries.
   * e.g. Arduino ×2 + ESP32 ×3 = 5
   */
  const cartTotal = cart.reduce((sum, entry) => sum + entry.requestedQty, 0)

  const value = {
    cart,
    cartOpen,
    setCartOpen,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    isInCart,
    cartTotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/**
 * Custom hook to use cart context.
 * Usage: const { cart, addToCart, cartTotal, cartOpen, setCartOpen } = useCart()
 */
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
