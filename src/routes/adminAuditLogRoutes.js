/**
 * Admin Audit Log Routes
 * Provides endpoints for administrators to view audit logs
 */

import express from 'express';
import {
  getAuditLogs,
  getApplicationAuditLogs,
  getRecentAuditLogs,
  getAuditLogStats
} from '../controllers/adminAuditLogController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/audit-logs
 * Get audit logs with optional filters
 * Query params: actorId, actorRole, action, applicationId, startDate, endDate, limit, offset
 */
router.get('/', getAuditLogs);

/**
 * GET /api/admin/audit-logs/recent
 * Get recent audit logs (last N hours)
 * Query params: hours (default 24), limit (default 50)
 */
router.get('/recent', getRecentAuditLogs);

/**
 * GET /api/admin/audit-logs/stats
 * Get audit log statistics
 * Query params: startDate, endDate
 */
router.get('/stats', getAuditLogStats);

/**
 * GET /api/admin/audit-logs/application/:id
 * Get all audit logs for a specific application
 */
router.get('/application/:id', getApplicationAuditLogs);

export default router;
