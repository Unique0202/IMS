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

/**
 * PATCH /api/requests/:id/approve  (admin only)
 *
 * Approves a PENDING request.
 * Sets collectionDeadline — the window in which the student must collect the items.
 * Default: 24 hours from now. Admin can pass a custom ISO datetime in the body.
 *
 * WHY SET A DEADLINE?
 *   If the student never collects, the slot stays "approved" forever blocking
 *   inventory. A deadline lets the admin auto-expire or manually decline later.
 */
router.patch('/:id/approve', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id)
    if (isNaN(requestId)) throw createError(400, 'Invalid request ID', 'INVALID_ID')

    const existing = await prisma.request.findUnique({ where: { id: requestId } })
    if (!existing) throw createError(404, 'Request not found', 'NOT_FOUND')
    if (existing.status !== 'PENDING') {
      throw createError(400, `Cannot approve a request with status ${existing.status}`, 'INVALID_STATUS')
    }

    // Default deadline: 24 hours from now. Admin can override.
    const collectionDeadline = req.body.collectionDeadline
      ? new Date(req.body.collectionDeadline)
      : new Date(Date.now() + 24 * 60 * 60 * 1000)

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status: 'APPROVED', collectionDeadline },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { item: { select: { id: true, name: true, type: true } } } },
      },
    })

    res.json({ success: true, data: { request: updated } })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/requests/:id/decline  (admin only)
 *
 * Declines a PENDING or APPROVED request.
 * Requires a reason — students will see this on their Requests page.
 */
router.patch('/:id/decline', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id)
    if (isNaN(requestId)) throw createError(400, 'Invalid request ID', 'INVALID_ID')

    const { declineReason } = req.body
    if (!declineReason || declineReason.trim().length === 0) {
      throw createError(400, 'Decline reason is required', 'MISSING_REASON')
    }

    const existing = await prisma.request.findUnique({ where: { id: requestId } })
    if (!existing) throw createError(404, 'Request not found', 'NOT_FOUND')
    if (!['PENDING', 'APPROVED'].includes(existing.status)) {
      throw createError(400, `Cannot decline a request with status ${existing.status}`, 'INVALID_STATUS')
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status: 'DECLINED', declineReason: declineReason.trim() },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { item: { select: { id: true, name: true, type: true } } } },
      },
    })

    res.json({ success: true, data: { request: updated } })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/requests/:id/issue  (admin only)
 *
 * Marks an APPROVED request as ISSUED — admin physically hands items to student.
 *
 * PARTIAL ISSUE SUPPORT:
 *   The frontend sends issuedItems: [{ itemId, quantity }] with the actual
 *   quantities the admin is handing over. This can be less than requested
 *   (e.g. breadboard out of stock → admin sets quantity 0 for it).
 *
 *   Rules:
 *     - issuedQty must be >= 0 (can issue 0 = item not available)
 *     - issuedQty must be <= available stock (can't issue more than you have)
 *     - issuedQty must be <= requested qty (can't give more than asked)
 *   No error is thrown just because an item has 0 quantity — admin decides.
 *
 *   Items with issuedQty = 0 are still part of the request record (for history)
 *   but their stock is not touched.
 */
router.patch('/:id/issue', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id)
    if (isNaN(requestId)) throw createError(400, 'Invalid request ID', 'INVALID_ID')

    const { expectedReturnAt, conditionOnIssue, issuedItems } = req.body

    const existing = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { item: true } },
      },
    })
    if (!existing) throw createError(404, 'Request not found', 'NOT_FOUND')
    if (existing.status !== 'APPROVED') {
      throw createError(400, `Cannot issue a request with status ${existing.status}`, 'INVALID_STATUS')
    }

    // Build a map of itemId → actualIssuedQty from the frontend submission.
    // Falls back to the requested quantity if admin didn't send issuedItems
    // (backward-compatible with old frontend calls).
    const issuedMap = {}
    if (Array.isArray(issuedItems)) {
      for (const { itemId, quantity } of issuedItems) {
        issuedMap[itemId] = quantity
      }
    }

    // Validate each item's issued quantity
    for (const ri of existing.items) {
      const issuedQty = issuedMap[ri.itemId] ?? ri.quantity
      if (issuedQty < 0) {
        throw createError(400, `Issued quantity cannot be negative for "${ri.item.name}"`, 'INVALID_QTY')
      }
      if (issuedQty > ri.quantity) {
        throw createError(400, `Cannot issue more than requested for "${ri.item.name}" (requested: ${ri.quantity})`, 'EXCEEDS_REQUEST')
      }
      if (issuedQty > ri.item.quantity) {
        throw createError(400, `Not enough stock for "${ri.item.name}": ${ri.item.quantity} available, ${issuedQty} to issue`, 'INSUFFICIENT_STOCK')
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Decrement each item by the ACTUAL issued quantity (not the requested qty)
      for (const ri of existing.items) {
        const issuedQty = issuedMap[ri.itemId] ?? ri.quantity
        if (issuedQty > 0) {
          await tx.item.update({
            where: { id: ri.itemId },
            data: { quantity: { decrement: issuedQty } },
          })
        }
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          requestId,
          issuedTo: existing.user.name,
          conditionOnIssue: conditionOnIssue?.trim() || null,
          expectedReturnAt: expectedReturnAt ? new Date(expectedReturnAt) : null,
        },
      })

      // Update request status
      return tx.request.update({
        where: { id: requestId },
        data: { status: 'ISSUED' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { item: { select: { id: true, name: true, type: true, quantity: true } } } },
          transaction: true,
        },
      })
    })

    res.json({ success: true, data: { request: updated } })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/requests/:id/return  (admin only)
 *
 * Marks an ISSUED request as RETURNED — student brought items back.
 *
 * WHAT HAPPENS IN THE TRANSACTION:
 *   1. Each RETURNABLE item's quantity is RESTORED (incremented back)
 *      Note: CONSUMABLE items are NOT restored — they were kept by the student.
 *   2. Transaction is updated with returnedAt and condition notes
 *   3. Request status is set to RETURNED
 */
router.patch('/:id/return', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.id)
    if (isNaN(requestId)) throw createError(400, 'Invalid request ID', 'INVALID_ID')

    const { conditionOnReturn, returnedAt, returnedItems } = req.body

    const existing = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        items: { include: { item: true } },
        transaction: true,
      },
    })
    if (!existing) throw createError(404, 'Request not found', 'NOT_FOUND')
    if (existing.status !== 'ISSUED') {
      throw createError(400, `Cannot return a request with status ${existing.status}`, 'INVALID_STATUS')
    }

    // Build a map of itemId → actualReturnedQty from the frontend submission.
    // Falls back to the full requested quantity if admin didn't send returnedItems.
    const returnedMap = {}
    if (Array.isArray(returnedItems)) {
      for (const { itemId, quantity } of returnedItems) {
        returnedMap[itemId] = quantity
      }
    }

    // Validate: returned qty must be 0 ≤ qty ≤ requested qty
    for (const ri of existing.items) {
      const returnedQty = returnedMap[ri.itemId] ?? ri.quantity
      if (returnedQty < 0) {
        throw createError(400, `Returned quantity cannot be negative for "${ri.item.name}"`, 'INVALID_QTY')
      }
      if (returnedQty > ri.quantity) {
        throw createError(400, `Cannot return more than was requested for "${ri.item.name}"`, 'EXCEEDS_REQUEST')
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Restore quantity by the ACTUAL returned amount per item.
      // Items with returnedQty = 0 are not touched (kept by student / lost).
      for (const ri of existing.items) {
        const returnedQty = returnedMap[ri.itemId] ?? ri.quantity
        if (returnedQty > 0) {
          await tx.item.update({
            where: { id: ri.itemId },
            data: { quantity: { increment: returnedQty } },
          })
        }
      }

      // Update transaction record
      await tx.transaction.update({
        where: { requestId },
        data: {
          returnedAt: returnedAt ? new Date(returnedAt) : new Date(),
          conditionOnReturn: conditionOnReturn?.trim() || null,
        },
      })

      // Update request status
      return tx.request.update({
        where: { id: requestId },
        data: { status: 'RETURNED' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { item: { select: { id: true, name: true, type: true, quantity: true } } } },
          transaction: true,
        },
      })
    })

    res.json({ success: true, data: { request: updated } })
  } catch (error) {
    next(error)
  }
})

module.exports = router
