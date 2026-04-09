/**
 * Users routes — admin only
 *
 * ENDPOINTS:
 *   GET /api/users          → all students with request counts
 *   GET /api/users/:id      → single student with full request history
 */

const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate, authorizeAdmin } = require('../middleware/auth')
const { createError } = require('../middleware/errorHandler')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * GET /api/users
 * Returns all STUDENT accounts with aggregated request stats.
 */
router.get('/', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { requests: true } },
        requests: {
          select: { status: true },
        },
      },
    })

    const data = users.map((u) => ({
      id:          u.id,
      name:        u.name,
      email:       u.email,
      createdAt:   u.createdAt,
      totalRequests: u._count.requests,
      issued:   u.requests.filter((r) => r.status === 'ISSUED').length,
      pending:  u.requests.filter((r) => r.status === 'PENDING').length,
    }))

    res.json({ success: true, data: { users: data } })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/users/:id
 * Returns a student's profile + full request history.
 */
router.get('/:id', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id)
    if (isNaN(userId)) throw createError(400, 'Invalid user ID', 'INVALID_ID')

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        requests: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: { item: { select: { id: true, name: true } } },
            },
            transaction: {
              select: { issuedAt: true, expectedReturnAt: true, returnedAt: true },
            },
          },
        },
      },
    })

    if (!user) throw createError(404, 'User not found', 'NOT_FOUND')
    if (user.role !== 'STUDENT') throw createError(403, 'Not a student account', 'FORBIDDEN')

    res.json({ success: true, data: { user } })
  } catch (error) {
    next(error)
  }
})

module.exports = router
