/**
 * Global error handling middleware.
 *
 * HOW IT WORKS:
 *   Express treats any middleware with 4 parameters (err, req, res, next)
 *   as an error handler. When any route throws an error or calls next(error),
 *   Express skips all normal middleware and jumps to this one.
 *
 * WHY A GLOBAL HANDLER?
 *   Without this, every route would need its own try/catch with
 *   res.status(500).json({ error: '...' }). That is repetitive.
 *   With a global handler, routes just throw errors and this catches them all.
 *
 * CONSISTENT RESPONSE FORMAT:
 *   All errors return: { success: false, error: { message, code } }
 *   All successes return: { success: true, data: {...} }
 *   This makes it easy for the frontend to handle responses uniformly.
 */

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`)
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack)
  }

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
    },
  })
}

/**
 * Helper to create an error with a status code.
 * Usage: throw createError(404, 'User not found', 'NOT_FOUND')
 */
function createError(statusCode, message, code) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

module.exports = { errorHandler, createError }
