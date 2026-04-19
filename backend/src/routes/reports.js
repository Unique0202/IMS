const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate, authorizeAdmin } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * GET /api/reports/summary  (admin only)
 *
 * Returns aggregate stats for the Reports page:
 *   - statusCounts: count of requests per status
 *   - recentRequests: all requests in last 6 months (for monthly chart)
 *   - topItems: top 5 most-requested items by total quantity
 *   - inventoryValue: sum of costOfPurchase across all active items
 *   - totalItems: count of active non-deleted items
 *   - totalStudents: count of registered students
 */
router.get('/summary', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [statusCounts, recentRequests, topItems, inventoryAgg, totalItems, totalStudents] =
      await Promise.all([
        prisma.request.groupBy({
          by: ['status'],
          _count: { id: true },
        }),

        prisma.request.findMany({
          where: { createdAt: { gte: sixMonthsAgo } },
          select: { createdAt: true, status: true },
          orderBy: { createdAt: 'asc' },
        }),

        prisma.requestItem.groupBy({
          by: ['itemId'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),

        prisma.item.aggregate({
          _sum: { costOfPurchase: true },
          where: { deletedAt: null },
        }),

        prisma.item.count({ where: { deletedAt: null, status: 'ACTIVE' } }),

        prisma.user.count({ where: { role: 'STUDENT' } }),
      ])

    // Enrich top items with item name/category
    const topItemIds = topItems.map((t) => t.itemId)
    const topItemDetails = await prisma.item.findMany({
      where: { id: { in: topItemIds } },
      select: { id: true, name: true, category: { select: { name: true } } },
    })

    const topItemsEnriched = topItems.map((t) => ({
      itemId: t.itemId,
      totalRequested: t._sum.quantity || 0,
      item: topItemDetails.find((i) => i.id === t.itemId) || null,
    }))

    res.json({
      success: true,
      data: {
        statusCounts,
        recentRequests,
        topItems: topItemsEnriched,
        inventoryValue: inventoryAgg._sum.costOfPurchase || 0,
        totalItems,
        totalStudents,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/reports/export/requests  (admin only)
 * Returns all requests as a flat array suitable for CSV export.
 */
router.get('/export/requests', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const requests = await prisma.request.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: { item: { select: { name: true } } },
        },
        transaction: { select: { issuedAt: true, returnedAt: true, expectedReturnAt: true } },
      },
    })

    const rows = requests.map((r) => ({
      id: r.id,
      student: r.user.name,
      email: r.user.email,
      status: r.status,
      items: r.items.map((ri) => `${ri.item.name} x${ri.quantity}`).join('; '),
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      issuedAt: r.transaction?.issuedAt?.toISOString() || '',
      returnedAt: r.transaction?.returnedAt?.toISOString() || '',
      expectedReturnAt: r.transaction?.expectedReturnAt?.toISOString() || '',
    }))

    res.json({ success: true, data: { rows } })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/reports/export/inventory  (admin only)
 * Returns all active items as a flat array suitable for CSV export.
 */
router.get('/export/inventory', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      where: { deletedAt: null },
      include: { category: { select: { name: true } } },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    })

    const rows = items.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category.name,
      type: item.type,
      status: item.status,
      quantity: item.quantity,
      location: item.location || '',
      costOfPurchase: item.costOfPurchase ?? '',
      billNo: item.billNo || '',
      vendorDetails: item.vendorDetails || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.toISOString().slice(0, 10) : '',
      receivingDate: item.receivingDate ? item.receivingDate.toISOString().slice(0, 10) : '',
    }))

    res.json({ success: true, data: { rows } })
  } catch (error) {
    next(error)
  }
})

module.exports = router
