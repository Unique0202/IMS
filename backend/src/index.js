/**
 * Express server — the backend entry point.
 *
 * MIDDLEWARE STACK (order matters!):
 *   1. CORS — allows frontend (localhost:5173) to talk to backend (localhost:5000)
 *   2. JSON parser — parses request bodies from JSON strings to JS objects
 *   3. Cookie parser — reads cookies from the request
 *   4. Routes — API endpoints
 *   5. Error handler — catches all errors (MUST be last)
 *
 * WHAT IS CORS?
 *   Browsers block requests from one origin (localhost:5173) to another
 *   (localhost:5000) by default. This is a security feature.
 *   CORS (Cross-Origin Resource Sharing) headers tell the browser:
 *   "Yes, this frontend is allowed to talk to me."
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { errorHandler } = require('./middleware/errorHandler')

const authRoutes = require('./routes/auth')
const inventoryRoutes = require('./routes/inventory')
const requestRoutes = require('./routes/requests')
const notificationRoutes = require('./routes/notifications')
const userRoutes = require('./routes/users')
const reportRoutes = require('./routes/reports')

const app = express()
const PORT = process.env.PORT || 5000

// ===== MIDDLEWARE =====

// CORS: allow frontend origin, include cookies
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true, // needed for cookies
}))

// Parse JSON request bodies
app.use(express.json())

// Parse cookies
app.use(cookieParser())

// ===== ROUTES =====

// Health check — quick way to verify the server is running
// Test with: curl http://localhost:5000/api/health
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

// Auth routes: signup, login, me, logout
app.use('/api/auth', authRoutes)

// Inventory routes: categories, items, search
app.use('/api/inventory', inventoryRoutes)

// Request routes: submit, mine, all (admin)
app.use('/api/requests', requestRoutes)

// Notification routes: mine, mark read
app.use('/api/notifications', notificationRoutes)

// User routes: admin sees all students
app.use('/api/users', userRoutes)

// Reports routes: analytics + CSV export
app.use('/api/reports', reportRoutes)

// ===== ERROR HANDLER (must be last) =====
app.use(errorHandler)

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`\n  CIPD IMS Backend running at http://localhost:${PORT}`)
  console.log(`  Health check: http://localhost:${PORT}/api/health`)
  console.log(`  Auth routes:  POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me`)
  console.log(`  Inventory:    GET /api/inventory/categories, /categories/:id, /items/:id, /search?q=`)
  console.log(`  Requests:     POST /api/requests, GET /api/requests/mine, GET /api/requests/all\n`)
})
