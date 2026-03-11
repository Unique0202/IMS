const jwt = require('jsonwebtoken')

/**
 * JWT (JSON Web Token) utility functions.
 *
 * WHAT IS A JWT?
 *   A JWT is a string like: xxxxx.yyyyy.zzzzz
 *   - xxxxx = Header (algorithm used)
 *   - yyyyy = Payload (your data: userId, role)
 *   - zzzzz = Signature (proves the token wasn't tampered with)
 *
 *   The server signs the token with a SECRET. When the client sends it back,
 *   the server verifies the signature. If someone changes the payload,
 *   the signature won't match and verification fails.
 *
 * WHY STATELESS?
 *   Unlike sessions (stored in a database), JWTs are self-contained.
 *   The server doesn't need to look anything up — it just verifies
 *   the signature. This makes it easy to scale horizontally.
 */

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

module.exports = { generateToken, verifyToken }
