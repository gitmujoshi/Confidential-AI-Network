/**
 * Notifications Routes
 * 
 * This module handles notification management endpoints.
 * Users can view their notifications, mark them as read, and delete them.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, logAuthEvent } = require('../middleware/auth');
const db = require('../models');

/**
 * GET /api/notifications/:userId
 * Get notifications for a specific user
 */
router.get('/:userId', authenticateToken, logAuthEvent('GET_NOTIFICATIONS'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, type, isRead } = req.query;
    const localUser = req.user.localUser;

    // Check if user is requesting their own notifications or is AppAdmin
    if (localUser.id !== parseInt(userId) && localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. You can only view your own notifications.',
        code: 'ACCESS_DENIED'
      });
    }

    // Build where clause
    const whereClause = { userId: parseInt(userId) };
    
    // Add optional filters
    if (type) {
      whereClause.type = type;
    }
    
    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    // Get notifications with pagination
    const notifications = await db.Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Get total count for pagination
    const totalCount = await db.Notification.count({
      where: whereClause
    });

    // Get unread count
    const unreadCount = await db.Notification.count({
      where: { ...whereClause, isRead: false }
    });

    res.json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      })),
      pagination: {
        total: totalCount,
        unread: unreadCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });

  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      code: 'FETCH_NOTIFICATIONS_FAILED',
      details: error.message
    });
  }
});

/**
 * PUT /api/notifications/:notificationId/read
 * Mark a notification as read
 */
router.put('/:notificationId/read', authenticateToken, logAuthEvent('MARK_NOTIFICATION_READ'), async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    const localUser = req.user.localUser;

    // Find the notification
    const notification = await db.Notification.findByPk(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    // Check if user owns the notification or is AppAdmin
    if (notification.userId !== localUser.id && localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. You can only modify your own notifications.',
        code: 'ACCESS_DENIED'
      });
    }

    // Update notification
    await notification.update({
      isRead: true,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: {
        id: notification.id,
        isRead: notification.isRead,
        updatedAt: notification.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Mark notification as read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      code: 'MARK_READ_FAILED',
      details: error.message
    });
  }
});

/**
 * PUT /api/notifications/:userId/mark-all-read
 * Mark all notifications as read for a user
 */
router.put('/:userId/mark-all-read', authenticateToken, logAuthEvent('MARK_ALL_NOTIFICATIONS_READ'), async (req, res) => {
  try {
    const { userId } = req.params;
    const localUser = req.user.localUser;

    // Check if user is updating their own notifications or is AppAdmin
    if (localUser.id !== parseInt(userId) && localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. You can only modify your own notifications.',
        code: 'ACCESS_DENIED'
      });
    }

    // Update all unread notifications for the user
    const [updatedCount] = await db.Notification.update(
      { 
        isRead: true,
        updatedAt: new Date()
      },
      {
        where: {
          userId: parseInt(userId),
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      updatedCount
    });

  } catch (error) {
    console.error('❌ Mark all notifications as read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      code: 'MARK_ALL_READ_FAILED',
      details: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:notificationId
 * Delete a notification
 */
router.delete('/:notificationId', authenticateToken, logAuthEvent('DELETE_NOTIFICATION'), async (req, res) => {
  try {
    const { notificationId } = req.params;
    const localUser = req.user.localUser;

    // Find the notification
    const notification = await db.Notification.findByPk(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    // Check if user owns the notification or is AppAdmin
    if (notification.userId !== localUser.id && localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. You can only delete your own notifications.',
        code: 'ACCESS_DENIED'
      });
    }

    // Delete notification
    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
      code: 'DELETE_NOTIFICATION_FAILED',
      details: error.message
    });
  }
});

/**
 * POST /api/notifications
 * Create a new notification (AppAdmin only)
 */
router.post('/', authenticateToken, logAuthEvent('CREATE_NOTIFICATION'), async (req, res) => {
  try {
    const { userId, type, title, message, metadata = {} } = req.body;
    const localUser = req.user.localUser;

    // Check if user is AppAdmin
    if (localUser.partyType !== 'AppAdmin') {
      return res.status(403).json({
        error: 'Access denied. AppAdmin privileges required.',
        code: 'ACCESS_DENIED'
      });
    }

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: userId, type, title, message',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify target user exists
    const targetUser = await db.User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({
        error: 'Target user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Create notification
    const notification = await db.Notification.create({
      userId: parseInt(userId),
      type,
      title,
      message,
      metadata,
      isRead: false
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Create notification error:', error);
    res.status(500).json({
      error: 'Failed to create notification',
      code: 'CREATE_NOTIFICATION_FAILED',
      details: error.message
    });
  }
});

module.exports = router;
