import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  getRevenueSummary,
  getRevenueApplications,
  getRevenuePayouts
} from '../controllers/srcRevenueController.js';

const router = express.Router();

// All revenue routes require authentication and SRC or ADMIN role
router.use(authenticate);
router.use(requireRole('SRC', 'ADMIN'));

/**
 * GET /src/revenue/summary
 * Get revenue summary for SRC's university or all universities (admin)
 * 
 * Query params (Admin only):
 * - universityId: Filter by specific university
 * 
 * Response:
 * - universities: Array of university wallet summaries
 * - overall: Aggregated totals
 * - commissionStats: Status breakdown
 */
router.get(
  '/summary',
  getRevenueSummary
);

/**
 * GET /src/revenue/applications
 * Get per-application commission breakdown
 * 
 * Query params:
 * - universityId: Filter by university (Admin only)
 * - status: Filter by commission status (PENDING, EARNED, PAID, CANCELLED)
 * - limit: Results per page (default: 50)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * - applications: Array of application commission details
 * - pagination: Pagination metadata
 */
router.get(
  '/applications',
  getRevenueApplications
);

/**
 * GET /src/revenue/payouts
 * Get payout history
 * 
 * Query params:
 * - universityId: Filter by university (Admin only)
 * - status: Filter by payout status (PENDING, SCHEDULED, PROCESSING, COMPLETED, FAILED, CANCELLED)
 * - limit: Results per page (default: 20)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * - payouts: Array of payout details
 * - pagination: Pagination metadata
 */
router.get(
  '/payouts',
  getRevenuePayouts
);

export default router;
