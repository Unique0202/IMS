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
const { authenticate, authorizeAdmin } = require('../middleware/auth')
const { createError } = require('../middleware/errorHandler')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * POST /api/categories  (admin only)
 * Creates a new category.
 */
router.post('/categories', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) throw createError(400, 'Category name is required', 'MISSING_NAME')

    const existing = await prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    })
    if (existing) throw createError(409, 'A category with this name already exists', 'DUPLICATE_NAME')

    const category = await prisma.category.create({ data: { name: name.trim() } })
    res.status(201).json({ success: true, data: { category } })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/categories/:id  (admin only)
 * Renames an existing category.
 */
router.patch('/categories/:id', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) throw createError(400, 'Invalid category ID', 'INVALID_ID')

    const { name } = req.body
    if (!name || !name.trim()) throw createError(400, 'Category name is required', 'MISSING_NAME')

    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) throw createError(404, 'Category not found', 'NOT_FOUND')

    const duplicate = await prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' }, id: { not: id } },
    })
    if (duplicate) throw createError(409, 'A category with this name already exists', 'DUPLICATE_NAME')

    const category = await prisma.category.update({ where: { id }, data: { name: name.trim() } })
    res.json({ success: true, data: { category } })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/categories/:id  (admin only)
 * Deletes a category only if it has no items.
 */
router.delete('/categories/:id', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) throw createError(400, 'Invalid category ID', 'INVALID_ID')

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    })
    if (!existing) throw createError(404, 'Category not found', 'NOT_FOUND')
    if (existing._count.items > 0) {
      throw createError(400, 'Cannot delete a category that has items. Remove or move all items first.', 'HAS_ITEMS')
    }

    await prisma.category.delete({ where: { id } })
    res.json({ success: true, data: { message: 'Category deleted' } })
  } catch (error) {
    next(error)
  }
})

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

/**
 * GET /api/inventory/admin/items  (admin only)
 * Returns ALL items (including inactive & soft-deleted) with full fields.
 * Supports ?categoryId=, ?status=, ?deleted=true, ?q= filters.
 */
router.get('/admin/items', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const { categoryId, status, deleted, q } = req.query
    const where = {}
    if (categoryId) where.categoryId = parseInt(categoryId)
    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) where.status = status
    if (deleted === 'true') {
      where.deletedAt = { not: null }
    } else if (deleted === 'false') {
      where.deletedAt = null
    }
    if (q && q.trim().length >= 1) {
      where.name = { contains: q.trim(), mode: 'insensitive' }
    }

    const items = await prisma.item.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ deletedAt: 'asc' }, { name: 'asc' }],
    })
    res.json({ success: true, data: { items } })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/inventory/items  (admin only)
 * Creates a new item. Required: name, categoryId, quantity.
 */
router.post('/items', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const {
      name, categoryId, quantity, type, purpose, status,
      location, imageUrl, rfid, vendorDetails, costOfPurchase,
      billNo, purchaseDate, receivingDate,
    } = req.body

    if (!name || !name.trim()) throw createError(400, 'Item name is required', 'MISSING_NAME')
    if (!categoryId) throw createError(400, 'Category is required', 'MISSING_CATEGORY')
    if (quantity == null || isNaN(parseInt(quantity))) throw createError(400, 'Quantity is required', 'MISSING_QTY')

    const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } })
    if (!category) throw createError(404, 'Category not found', 'CAT_NOT_FOUND')

    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        categoryId: parseInt(categoryId),
        quantity: parseInt(quantity),
        type: type || 'NA',
        purpose: purpose || 'ISSUE',
        status: status || 'ACTIVE',
        location: location?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        rfid: rfid?.trim() || null,
        vendorDetails: vendorDetails?.trim() || null,
        costOfPurchase: costOfPurchase ? parseFloat(costOfPurchase) : null,
        billNo: billNo?.trim() || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        receivingDate: receivingDate ? new Date(receivingDate) : null,
      },
      include: { category: { select: { id: true, name: true } } },
    })
    res.status(201).json({ success: true, data: { item } })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/inventory/items/:id  (admin only)
 * Updates any field on an item.
 */
router.patch('/items/:id', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id)
    if (isNaN(itemId)) throw createError(400, 'Invalid item ID', 'INVALID_ID')

    const existing = await prisma.item.findUnique({ where: { id: itemId } })
    if (!existing) throw createError(404, 'Item not found', 'NOT_FOUND')

    const {
      name, categoryId, quantity, type, purpose, status,
      location, imageUrl, rfid, vendorDetails, costOfPurchase,
      billNo, purchaseDate, receivingDate,
    } = req.body

    const data = {}
    if (name !== undefined) data.name = name.trim()
    if (categoryId !== undefined) data.categoryId = parseInt(categoryId)
    if (quantity !== undefined) data.quantity = parseInt(quantity)
    if (type !== undefined) data.type = type
    if (purpose !== undefined) data.purpose = purpose
    if (status !== undefined) data.status = status
    if (location !== undefined) data.location = location?.trim() || null
    if (imageUrl !== undefined) data.imageUrl = imageUrl?.trim() || null
    if (rfid !== undefined) data.rfid = rfid?.trim() || null
    if (vendorDetails !== undefined) data.vendorDetails = vendorDetails?.trim() || null
    if (costOfPurchase !== undefined) data.costOfPurchase = costOfPurchase ? parseFloat(costOfPurchase) : null
    if (billNo !== undefined) data.billNo = billNo?.trim() || null
    if (purchaseDate !== undefined) data.purchaseDate = purchaseDate ? new Date(purchaseDate) : null
    if (receivingDate !== undefined) data.receivingDate = receivingDate ? new Date(receivingDate) : null

    const item = await prisma.item.update({
      where: { id: itemId },
      data,
      include: { category: { select: { id: true, name: true } } },
    })
    res.json({ success: true, data: { item } })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/inventory/items/:id  (admin only)
 * Soft-deletes an item (sets deletedAt). Does not remove from DB.
 */
router.delete('/items/:id', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id)
    if (isNaN(itemId)) throw createError(400, 'Invalid item ID', 'INVALID_ID')

    const existing = await prisma.item.findUnique({ where: { id: itemId } })
    if (!existing) throw createError(404, 'Item not found', 'NOT_FOUND')
    if (existing.deletedAt) throw createError(400, 'Item is already deleted', 'ALREADY_DELETED')

    await prisma.item.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    })
    res.json({ success: true, data: { message: 'Item soft-deleted' } })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/inventory/items/:id/restore  (admin only)
 * Restores a soft-deleted item (clears deletedAt).
 */
router.patch('/items/:id/restore', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id)
    if (isNaN(itemId)) throw createError(400, 'Invalid item ID', 'INVALID_ID')

    const existing = await prisma.item.findUnique({ where: { id: itemId } })
    if (!existing) throw createError(404, 'Item not found', 'NOT_FOUND')
    if (!existing.deletedAt) throw createError(400, 'Item is not deleted', 'NOT_DELETED')

    const item = await prisma.item.update({
      where: { id: itemId },
      data: { deletedAt: null },
      include: { category: { select: { id: true, name: true } } },
    })
    res.json({ success: true, data: { item } })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/inventory/items/:id/history  (admin only)
 * Returns the full borrowing history for a specific item.
 */
router.get('/items/:id/history', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const itemId = parseInt(req.params.id)
    if (isNaN(itemId)) throw createError(400, 'Invalid item ID', 'INVALID_ID')

    const item = await prisma.item.findFirst({
      where: { id: itemId },
      select: { id: true, name: true, quantity: true, type: true, category: { select: { name: true } } },
    })
    if (!item) throw createError(404, 'Item not found', 'NOT_FOUND')

    const requestItems = await prisma.requestItem.findMany({
      where: { itemId },
      include: {
        request: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            transaction: {
              select: { issuedAt: true, returnedAt: true, expectedReturnAt: true, conditionOnReturn: true },
            },
          },
        },
      },
      orderBy: { request: { createdAt: 'desc' } },
    })

    const history = requestItems.map((ri) => ({
      requestId: ri.request.id,
      status: ri.request.status,
      quantity: ri.quantity,
      issuedQuantity: ri.issuedQuantity,
      reason: ri.request.reason,
      createdAt: ri.request.createdAt,
      user: ri.request.user,
      transaction: ri.request.transaction,
    }))

    res.json({ success: true, data: { item, history } })
  } catch (error) {
    next(error)
  }
})

module.exports = router
