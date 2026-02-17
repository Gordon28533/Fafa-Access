/**
 * Admin Analytics Routes
 * 
 * Protected routes for admin to view system analytics
 * Requires: ADMIN role + authentication
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  getAnalyticsOverview,
  getApplicationTrends,
  getReviewTimes,
  getPaymentAnalytics,
  getDeliveryAnalytics,
  getUniversityMetrics,
  getUniversityDetail,
  getUnderperformingUniversities,
  getSrcAccountability,
  getFinancialAnalytics,
  getDeliveryPerformanceAnalytics,
} from '../controllers/adminAnalyticsController.js';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/analytics/overview
 * Get overview metrics for the dashboard
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * Returns:
 *   - Total applications by status
 *   - Payment collection rates
 *   - Delivery completion rates
 */
router.get('/overview', getAnalyticsOverview);

/**
 * GET /api/admin/analytics/trends
 * Get application approval/rejection/pending trends
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * Returns:
 *   - Daily trend data with pending, approved, rejected counts
 */
router.get('/trends', getApplicationTrends);

/**
 * GET /api/admin/analytics/review-times
 * Get average review times for SRC and Admin stages
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * Returns:
 *   - Average hours/days for SRC review
 *   - Average hours/days for Admin review
 *   - Number of applications reviewed
 */
router.get('/review-times', getReviewTimes);

/**
 * GET /api/admin/analytics/payments
 * Get payment completion analytics
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * Returns:
 *   - Total payments collected
 *   - Payment status breakdown with percentages
 *   - Daily payment trend with amounts
 */
router.get('/payments', getPaymentAnalytics);

/**
 * GET /api/admin/analytics/deliveries
 * Get delivery completion analytics
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * Returns:
 *   - Total deliveries and completion rate
 *   - Daily delivery trend
 */
router.get('/deliveries', getDeliveryAnalytics);

/**
 * GET /api/admin/analytics/universities
 * Get performance metrics for all universities
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * Returns:
 *   - University-level aggregated metrics
 *   - Application counts by status per university
 *   - SRC and overall approval/rejection rates
 *   - Performance scores and tiers
 *   - Summary of universities by performance tier
 */
router.get('/universities', getUniversityMetrics);

/**
 * GET /api/admin/analytics/universities/:universityId
 * Get detailed metrics for a specific university
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * Returns:
 *   - University details
 *   - SRC officer count
 *   - Daily trend data by application status
 */
router.get('/universities/:universityId', getUniversityDetail);

/**
 * GET /api/admin/analytics/universities/underperforming
 * Get universities with performance issues
 * Identifies universities with:
 *   - High backlog (>50% pending)
 *   - Slow reviews (>72 hours average)
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 * Returns:
 *   - List of underperforming universities
 *   - Count by issue type (backlog, slow reviews)
 */
router.get('/universities/underperforming', getUnderperformingUniversities);

/**
 * GET /api/admin/analytics/src-accountability
 * Get SRC officer performance and SLA compliance metrics
 * Query params:
 *   - days: Number of days to analyze (default: 30)
 *   - slaHours: SLA threshold in hours (default: 72)
 * Returns:
 *   - Pending applications per SRC officer
 *   - Review times and SLA breach counts
 *   - Summary of SLA violations
 */
router.get('/src-accountability', getSrcAccountability);

/**
 * GET /api/admin/analytics/financial
 * Get financial and revenue analytics in Ghana Cedis (GHS)
 * Query params:
 *   - days: Number of days to analyze (default: 30, range: 7-90)
 *   - universityId: Filter by university (optional)
 *   - productId: Filter by laptop/product ID (optional)
 * Returns:
 *   - Total revenue (all verified payments)
 *   - 70% initial vs 30% final payment breakdown
 *   - Unpaid delivered laptops (delivered but no final payment)
 *   - Revenue by university
 *   - Revenue by product/laptop model
 *   - Payment completion rate
 */
router.get('/financial', getFinancialAnalytics);

/**
 * GET /api/admin/analytics/delivery-performance
 * Get delivery performance and risk monitoring analytics
 * Query params:
 *   - days: Number of days to analyze (default: 30, range: 7-90)
 * Returns:
 *   - Delivery completion status per application
 *   - Unpaid deliveries (delivered but no final payment)
 *   - Delivery staff performance metrics
 *   - Operational risks (delays, payment collection issues)
 *   - High-risk items requiring attention
 */
router.get('/delivery-performance', getDeliveryPerformanceAnalytics);

export default router;
