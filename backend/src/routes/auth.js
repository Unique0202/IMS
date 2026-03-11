const express = require('express')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const { generateToken } = require('../utils/jwt')
const { createError } = require('../middleware/errorHandler')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * POST /api/auth/signup
 * Creates a new student account.
 *
 * WHO CAN SIGN UP:
 *   Only students with @iiitd.ac.in emails. Admin accounts are
 *   pre-created in the database seed — no signup for admins.
 *
 * WHAT BCRYPT DOES:
 *   bcrypt.hash(password, 10) creates a one-way hash of the password.
 *   The "10" is the salt rounds — how many times the hashing algorithm
 *   runs. More rounds = slower = harder to brute-force.
 *   10 rounds takes ~100ms which is a good balance of security vs speed.
 *
 *   The result looks like: $2b$10$N9qo8uLOickgx2ZMRZoMye...
 *   It includes the salt INSIDE the hash, so bcrypt.compare() works
 *   without storing the salt separately.
 *
 * WHY WE NEVER STORE PLAIN TEXT PASSWORDS:
 *   If the database is stolen, the attacker gets every user's password.
 *   With bcrypt hashes, they'd need to brute-force each one individually,
 *   which takes billions of years for a good password.
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      throw createError(400, 'Name, email, and password are required', 'MISSING_FIELDS')
    }

    // Validate IIITD email
    if (!/^[a-zA-Z0-9._%+-]+@iiitd\.ac\.in$/i.test(email)) {
      throw createError(400, 'Must be an IIITD email address (@iiitd.ac.in)', 'INVALID_EMAIL')
    }

    // Validate password length
    if (password.length < 6) {
      throw createError(400, 'Password must be at least 6 characters', 'WEAK_PASSWORD')
    }

    // Check if email already taken
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw createError(409, 'An account with this email already exists', 'EMAIL_TAKEN')
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with STUDENT role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    res.status(201).json({
      success: true,
      data: { user },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/auth/login
 * Authenticates a user (student or admin) and returns a JWT token.
 *
 * SINGLE ENDPOINT FOR BOTH ROLES:
 *   Instead of separate /student/login and /admin/login, we use one endpoint.
 *   The server looks up the user by email and returns their role.
 *   This is simpler and doesn't leak information about which emails are admin.
 *
 * WHAT BCRYPT.COMPARE DOES:
 *   bcrypt.compare(plainPassword, hashedPassword)
 *   1. Extracts the salt from the stored hash
 *   2. Hashes the plain password with that same salt
 *   3. Compares the two hashes
 *   4. Returns true if they match, false otherwise
 *   The plain password is NEVER stored or logged.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw createError(400, 'Email and password are required', 'MISSING_FIELDS')
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw createError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Compare password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      throw createError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Generate JWT token
    const token = generateToken(user)

    // Set token as httpOnly cookie AND return in response body
    // The frontend can use either approach
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/auth/me
 * Returns the currently authenticated user from the JWT token.
 *
 * WHY THIS ENDPOINT?
 *   When the user refreshes the page, React state is lost. The frontend
 *   calls /api/auth/me on app load to restore the user from the JWT
 *   token stored in localStorage or cookie. If the token is valid,
 *   the user stays logged in. If expired, they get redirected to login.
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  })
})

/**
 * POST /api/auth/logout
 * Clears the httpOnly cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ success: true, data: { message: 'Logged out' } })
})

module.exports = router
