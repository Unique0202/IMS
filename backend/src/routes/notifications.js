/**
 * Notifications routes
 *
 * ENDPOINTS:
 *   GET  /api/notifications/mine          → student's own notifications (newest first)
 *   PATCH /api/notifications/:id/read     → mark one notification as read
 *   PATCH /api/notifications/read-all     → mark ALL of the user's notifications as read
 *
 * ALL ROUTES:
 *   Protected by authenticate. Students only see their own notifications.
 */

const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth')
const { createError } = require('../middleware/errorHandler')

const router = express.Router()
const prisma = new PrismaClient()

/**
 * GET /api/notifications/mine
 * Returns the logged-in user's notifications, newest first.
 * Also returns unreadCount so the frontend bell badge can show it immediately.
 */
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    res.json({ success: true, data: { notifications, unreadCount } })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/notifications/read-all
 * Marks every unread notification for the current user as read.
 * IMPORTANT: This route must be defined BEFORE /:id/read so Express
 * doesn't treat "read-all" as an :id parameter.
 */
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    })
    res.json({ success: true, data: { message: 'All notifications marked as read' } })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 * Ensures the notification belongs to the requesting user.
 */
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notifId = parseInt(req.params.id)
    if (isNaN(notifId)) throw createError(400, 'Invalid notification ID', 'INVALID_ID')

    const notif = await prisma.notification.findUnique({ where: { id: notifId } })
    if (!notif) throw createError(404, 'Notification not found', 'NOT_FOUND')
    if (notif.userId !== req.user.id) throw createError(403, 'Access denied', 'FORBIDDEN')

    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { read: true },
    })

    res.json({ success: true, data: { notification: updated } })
  } catch (error) {
    next(error)
  }
})

module.exports = router
