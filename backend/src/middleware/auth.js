const { verifyToken } = require('../utils/jwt')
const { PrismaClient } = require('@prisma/client')
const { createError } = require('./errorHandler')

const prisma = new PrismaClient()

/**
 * Authentication middleware — verifies the JWT token.
 *
 * WHERE THE TOKEN COMES FROM:
 *   The frontend sends the token in the Authorization header:
 *   Authorization: Bearer eyJhbGciOi...
 *
 *   We also check cookies as a fallback (for httpOnly cookie auth).
 *
 * WHAT THIS MIDDLEWARE DOES:
 *   1. Extract token from header or cookie
 *   2. Verify the token signature and expiry
 *   3. Look up the user in the database
 *   4. Attach user to req.user so routes can access it
 *   5. If anything fails → 401 Unauthorized
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header or cookie
    let token = null

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    if (!token) {
      throw createError(401, 'No authentication token provided', 'NO_TOKEN')
    }

    // Verify token
    const decoded = verifyToken(token)

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!user) {
      throw createError(401, 'User not found', 'USER_NOT_FOUND')
    }

    // Attach user to request object — available in all subsequent middleware/routes
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token', 'INVALID_TOKEN'))
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired', 'TOKEN_EXPIRED'))
    }
    next(error)
  }
}

/**
 * Authorization middleware — checks if user has ADMIN role.
 * Must be used AFTER authenticate middleware.
 *
 * Usage in routes:
 *   router.get('/admin-only', authenticate, authorizeAdmin, handler)
 */
function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return next(createError(403, 'Admin access required', 'FORBIDDEN'))
  }
  next()
}

module.exports = { authenticate, authorizeAdmin }
