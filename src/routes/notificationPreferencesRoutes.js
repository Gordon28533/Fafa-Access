import express from 'express';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
  toggleAllEmailNotifications,
  toggleAllInAppNotifications
} from '../controllers/notificationPreferencesController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// All notification preference routes require authentication
router.use(authenticate);
// Notification preferences are per-user and accessible to all authenticated users
router.use(requireRole('STUDENT', 'SRC', 'ADMIN', 'DELIVERY'));

// GET /api/notifications/preferences - Get preferences
router.get('/preferences', asyncHandler(getNotificationPreferences));

// PUT /api/notifications/preferences - Update preferences
router.put('/preferences', asyncHandler(updateNotificationPreferences));

// POST /api/notifications/preferences/reset - Reset to defaults
router.post('/preferences/reset', asyncHandler(resetNotificationPreferences));

// POST /api/notifications/preferences/toggle-all-email - Toggle all email
router.post('/preferences/toggle-all-email', toggleAllEmailNotifications);

// POST /api/notifications/preferences/toggle-all-inapp - Toggle all in-app
router.post('/preferences/toggle-all-inapp', toggleAllInAppNotifications);

export default router;
