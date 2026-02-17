import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  exportApplicationsCSV,
  exportPaymentsCSV,
  exportDeliveriesCSV,
  exportAnalyticsJSON,
  exportComprehensivePDF,
} from '../controllers/exportController.js';

const router = express.Router();

// All export routes require ADMIN authentication
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * GET /api/admin/export/applications/csv
 * Export applications data as CSV
 * Query params:
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - universityId: UUID (optional)
 *   - status: APPLICATION_STATUS (optional)
 */
router.get('/applications/csv', exportApplicationsCSV);

/**
 * GET /api/admin/export/payments/csv
 * Export payments data as CSV
 * Query params:
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - universityId: UUID (optional)
 *   - paymentStatus: PAYMENT_STATUS (optional)
 */
router.get('/payments/csv', exportPaymentsCSV);

/**
 * GET /api/admin/export/deliveries/csv
 * Export deliveries data as CSV
 * Query params:
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - universityId: UUID (optional)
 *   - deliveryStatus: DELIVERY_STATUS (optional)
 */
router.get('/deliveries/csv', exportDeliveriesCSV);

/**
 * GET /api/admin/export/analytics/json
 * Export analytics summary as JSON
 * Query params:
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - universityId: UUID (optional)
 */
router.get('/analytics/json', exportAnalyticsJSON);

/**
 * GET /api/admin/export/comprehensive/pdf
 * Export comprehensive report as PDF (HTML format)
 * Query params:
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - universityId: UUID (optional)
 */
router.get('/comprehensive/pdf', exportComprehensivePDF);

export default router;
