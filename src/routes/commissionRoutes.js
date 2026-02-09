import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  getUnpaidCommissionsForUniversity,
  getMyCommissionSummary,
  markCommissionPaid,
  markCommissionsReadyForPayout,
  getCommissionReport,
  createPayoutBatch,
  processPayoutBatch,
  getUniversityWallet,
  getUniversityPayouts,
  triggerCommissionManually,
  getCommissionStatusForApplication,
  exportCommissionsCSV,
  exportCommissionsPDF
} from '../controllers/commissionController.js';

const router = express.Router();

// GET /commissions/summary - SRC views their commission summary
router.get(
  '/summary',
  authenticate,
  requireRole('SRC'),
  getMyCommissionSummary
);

// GET /commissions/unpaid/:universityId - Get unpaid commissions for a university (SRC/ADMIN only)
router.get(
  '/unpaid/:universityId',
  authenticate,
  requireRole('SRC', 'ADMIN'),
  getUnpaidCommissionsForUniversity
);

// POST /commissions/mark-paid/:applicationId - Admin marks commission as paid
router.post(
  '/mark-paid/:applicationId',
  authenticate,
  requireRole('ADMIN'),
  markCommissionPaid
);

// POST /commissions/ready - Admin marks commissions READY_FOR_PAYOUT
router.post(
  '/ready',
  authenticate,
  requireRole('ADMIN'),
  markCommissionsReadyForPayout
);

// GET /commissions/report - Admin gets comprehensive commission report
router.get(
  '/report',
  authenticate,
  requireRole('ADMIN'),
  getCommissionReport
);

// POST /commissions/payout/create - Create a payout batch
router.post(
  '/payout/create',
  authenticate,
  requireRole('ADMIN'),
  createPayoutBatch
);

// POST /commissions/payout/process/:payoutId - Process a payout
router.post(
  '/payout/process/:payoutId',
  authenticate,
  requireRole('ADMIN'),
  processPayoutBatch
);

// GET /commissions/wallet/:universityId - Get university wallet (SRC/ADMIN only)
router.get(
  '/wallet/:universityId',
  authenticate,
  requireRole('SRC', 'ADMIN'),
  getUniversityWallet
);

// GET /commissions/payouts/:universityId - Get university payouts (SRC/ADMIN only)
router.get(
  '/payouts/:universityId',
  authenticate,
  requireRole('SRC', 'ADMIN'),
  getUniversityPayouts
);

// POST /commissions/trigger/:applicationId - Manually trigger commission (Admin only)
router.post(
  '/trigger/:applicationId',
  authenticate,
  requireRole('ADMIN'),
  triggerCommissionManually
);

// GET /commissions/status/:applicationId - Get commission status (authenticated users only)
router.get(
  '/status/:applicationId',
  authenticate,
  requireRole('STUDENT', 'SRC', 'ADMIN'),
  getCommissionStatusForApplication
);

// GET /commissions/export/csv - Export commissions CSV (Admin or SRC scoped)
router.get(
  '/export/csv',
  authenticate,
  requireRole('SRC', 'ADMIN'),
  exportCommissionsCSV
);

// GET /commissions/export/pdf - Stub PDF export (Admin or SRC scoped)
router.get(
  '/export/pdf',
  authenticate,
  requireRole('SRC', 'ADMIN'),
  exportCommissionsPDF
);

export default router;
