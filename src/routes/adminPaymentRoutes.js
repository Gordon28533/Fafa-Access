/**
 * Admin Payment Routes
 * 
 * Protected routes for admin payment oversight
 * Requires: ADMIN role + authentication
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  getAllPayments,
  getPaymentById,
  getPaymentSummary
} from '../controllers/adminPaymentController.js';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/payments
 * Get all payments with optional filtering and pagination
 * Query params:
 *   - status: pending, completed, failed, refunded
 *   - applicationId: Filter by application
 *   - studentId: Filter by student
 *   - sortBy: createdAt, amount, status
 *   - sortOrder: asc, desc
 *   - page: page number (default 1)
 *   - limit: items per page (default 20)
 */
router.get('/', getAllPayments);

/**
 * GET /api/admin/payments/summary
 * Get payment statistics and summary
 * Returns: total, pending, completed, failed, revenue
 */
router.get('/summary', getPaymentSummary);

/**
 * GET /api/admin/payments/:id
 * Get specific payment details
 */
router.get('/:id', getPaymentById);


export default router;
