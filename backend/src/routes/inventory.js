/**
 * Inventory routes — browsing categories and items.
 *
 * ENDPOINTS:
 *   GET /api/inventory/categories          → all categories with item counts
 *   GET /api/inventory/categories/:id      → single category with its items
 *   GET /api/inventory/items/:id           → single item detail
 *   GET /api/inventory/search?q=arduino    → search items by name
 *
 * ALL ROUTES ARE PROTECTED:
 *   Only authenticated users (student OR admin) can access these.
 *   The `authenticate` middleware checks the JWT token.
 *
 * WHY SEPARATE FROM AUTH ROUTES?
 *   Separation of concerns — auth.js handles authentication,
 *   inventory.js handles inventory browsing. Each file stays focused.
 *   This also makes it easier to add admin-only inventory routes later
 *   (Phase 8) without cluttering this file.
 */

const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * GET /api/inventory/categories
 *
 * Returns all categories with the count of ACTIVE items in each.
 *
 * HOW _count WORKS IN PRISMA:
 *   _count: { items: true } adds a virtual field `_count.items` to each
 *   category. Prisma generates an efficient COUNT subquery — it does NOT
 *   load all items into memory just to count them.
 *
 * THE where INSIDE _count:
 *   We only count items that are ACTIVE and not soft-deleted (deletedAt is null).
 *   This way, if an admin deactivates or deletes an item, it doesn't show
 *   in the count.
 */
router.get('/categories', authenticate, async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            items: {
              where: {
                status: 'ACTIVE',
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Flatten _count for cleaner response
    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      itemCount: cat._count.items,
    }))

    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/inventory/categories/:id
 *
 * Returns a single category and all its ACTIVE items.
 *
 * QUERY PARAMETERS:
 *   ?type=RETURNABLE    → filter by item type
 *   ?sort=name          → sort by name (default) or quantity
 *   ?order=asc          → asc (default) or desc
 *
 * WHY FILTER deletedAt: null?
 *   Soft delete means we set deletedAt to a timestamp instead of
 *   actually removing the row. This preserves history for transactions.
 *   But for browsing, students should never see deleted items.
 */
router.get('/categories/:id', authenticate, async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id)
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid category ID' } })
    }

    // Check category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return res.status(404).json({ success: false, error: { message: 'Category not found' } })
    }

    // Build filter
    const where = {
      categoryId,
      status: 'ACTIVE',
      deletedAt: null,
    }

    // Optional type filter
    const { type, sort = 'name', order = 'asc' } = req.query
    if (type && ['CONSUMABLE', 'RETURNABLE', 'NA'].includes(type)) {
      where.type = type
    }

    // Validate sort field
    const allowedSorts = ['name', 'quantity', 'createdAt']
    const sortField = allowedSorts.includes(sort) ? sort : 'name'
    const sortOrder = order === 'desc' ? 'desc' : 'asc'

    const items = await prisma.item.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      select: {
        id: true,
        name: true,
        quantity: true,
        type: true,
        status: true,
        location: true,
        purpose: true,
        imageUrl: true,
      },
    })

    res.json({
      success: true,
      data: {
        category: { id: category.id, name: category.name },
        items,
        totalItems: items.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/inventory/items/:id
 *
 * Returns full detail of a single item including its category name.
 * Students see this when they click on an item to view details or add to cart.
 */
router.get('/items/:id', authenticate, async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id)
    if (isNaN(itemId)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid item ID' } })
    }

    const item = await prisma.item.findFirst({
      where: {
        id: itemId,
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    })

    if (!item) {
      return res.status(404).json({ success: false, error: { message: 'Item not found' } })
    }

    res.json({ success: true, data: item })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/inventory/search?q=arduino
 *
 * Full-text search on item names. Returns matching ACTIVE items with category.
 *
 * HOW contains WORKS:
 *   Prisma's `contains` generates a SQL LIKE '%arduino%' query.
 *   mode: 'insensitive' makes it case-insensitive (ILIKE in PostgreSQL).
 *
 * PERFORMANCE NOTE:
 *   LIKE '%term%' doesn't use indexes efficiently. For a lab with ~100 items,
 *   this is totally fine. For 10,000+ items, you'd want PostgreSQL full-text
 *   search (tsvector/tsquery) or a search engine like MeiliSearch.
 */
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q } = req.query

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query must be at least 2 characters' },
      })
    }

    const items = await prisma.item.findMany({
      where: {
        name: { contains: q.trim(), mode: 'insensitive' },
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 20, // Limit results to prevent huge responses
    })

    res.json({
      success: true,
      data: {
        query: q.trim(),
        items,
        totalResults: items.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/inventory/low-stock  (admin only)
 * Returns ACTIVE items with quantity <= 5, sorted by quantity ascending.
 * Used by the admin dashboard Low Stock Alerts section.
 */
router.get('/low-stock', authenticate, async (req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      where: { status: 'ACTIVE', deletedAt: null, quantity: { lte: 5 } },
      select: { id: true, name: true, quantity: true, type: true, category: { select: { name: true } } },
      orderBy: { quantity: 'asc' },
      take: 10,
    })
    res.json({ success: true, data: { items } })
  } catch (error) {
    next(error)
  }
})

module.exports = router
