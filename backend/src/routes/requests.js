const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate, authorizeAdmin } = require('../middleware/auth')
const { createError } = require('../middleware/errorHandler')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * POST /api/requests
 * Student submits a new borrowing request.
 *
 * HOW THIS WORKS:
 *   1. Student selects items in cart and writes a reason
 *   2. Frontend sends: { items: [{itemId, quantity}], reason }
 *   3. We validate each item: does it exist? Is requested qty <= available?
 *   4. If all valid: create Request + RequestItems in one DB transaction
 *   5. We do NOT reduce item.quantity here — that only happens when admin marks ISSUED
 *
 * WHY NOT REDUCE QUANTITY NOW?
 *   Because the request might get declined. We only commit the quantity
 *   when the admin physically hands the item to the student (ISSUED status).
 *
 * DB TRANSACTION:
 *   prisma.$transaction([...]) runs multiple DB operations atomically.
 *   If any one fails, all are rolled back. Prevents partial data.
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { items, reason } = req.body
    const userId = req.user.id

    // Only students can submit requests
    if (req.user.role !== 'STUDENT') {
      throw createError(403, 'Only students can submit requests', 'FORBIDDEN')
    }

    // Validate required fields
    if (!reason || reason.trim().length === 0) {
      throw createError(400, 'Reason for issue is required', 'MISSING_REASON')
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError(400, 'At least one item is required', 'NO_ITEMS')
    }

    // Validate each item
    const validationErrors = []
    const itemChecks = await Promise.all(
      items.map(async ({ itemId, quantity }) => {
        if (!itemId || !quantity || quantity < 1) {
          validationErrors.push(`Invalid item entry: itemId=${itemId}, quantity=${quantity}`)
          return null
        }
        const item = await prisma.item.findFirst({
          where: { id: itemId, deletedAt: null, status: 'ACTIVE' },
        })
        if (!item) {
          validationErrors.push(`Item ID ${itemId} not found or inactive`)
          return null
        }
        if (quantity > item.quantity) {
          validationErrors.push(
            `"${item.name}": requested ${quantity} but only ${item.quantity} available`
          )
          return null
        }
        return { item, requestedQty: quantity }
      })
    )

    if (validationErrors.length > 0) {
      throw createError(400, validationErrors.join('. '), 'STOCK_VALIDATION_FAILED')
    }

    // Create Request + RequestItems in a single transaction
    const request = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.request.create({
        data: {
          reason: reason.trim(),
          userId,
          status: 'PENDING',
          items: {
            create: itemChecks.map(({ item, requestedQty }) => ({
              itemId: item.id,
              quantity: requestedQty,
            })),
          },
        },
        include: {
          items: {
            include: {
              item: {
                select: { id: true, name: true, type: true, quantity: true },
              },
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      })
      return newRequest
    })

    res.status(201).json({
      success: true,
      data: { request },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/requests/mine
 * Returns all requests made by the currently logged-in student.
 *
 * WHAT IS RETURNED:
 *   Each request includes:
 *   - status (PENDING / APPROVED / DECLINED / ISSUED / RETURNED)
 *   - the list of items requested (with names and quantities)
 *   - reason, declineReason, collectionDeadline
 *   - the linked transaction (if ISSUED/RETURNED)
 *
 * ORDERING:
 *   Newest requests first (createdAt desc).
 */
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id

    const requests = await prisma.request.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            item: {
              select: { id: true, name: true, type: true },
            },
          },
        },
        transaction: {
          select: {
            issuedAt: true,
            expectedReturnAt: true,
            returnedAt: true,
            conditionOnReturn: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: { requests },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/requests/all  (admin only)
 * Returns ALL requests from all students, sorted newest first.
 * Used by the admin Requests page in Phase 7.
 */
router.get('/all', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const { status } = req.query

    const where = status ? { status } : {}

    const requests = await prisma.request.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            item: {
              select: { id: true, name: true, type: true, quantity: true },
            },
          },
        },
        transaction: true,
      },
    })

    res.json({
      success: true,
      data: { requests },
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
