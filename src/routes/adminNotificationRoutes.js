import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { listNotificationLogs, resendNotification, notificationMetrics } from '../controllers/adminNotificationController.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.get('/notifications/logs', listNotificationLogs);
router.post('/notifications/resend', resendNotification);
router.get('/notifications/metrics', notificationMetrics);

export default router;
