// applicationRoutes.js
import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  createApplication,
  getMyApplications,
  getApplicationById,
  getSRCPendingApplications,
  srcDecision,
  getAdminPendingApplications,
  getAllApplications,
  adminDecision,
  updateVerificationStatus,
  updateApplicationLaptop,
  updateApplication,
  withdrawApplication,
  assignDelivery
} from '../controllers/applicationController.js';

const router = express.Router();

// ========== STUDENT ROUTES ==========

// POST / - Student submits application
router.post(
  '/',
  authenticate,
  requireRole('STUDENT'),
  createApplication
);

// GET /my - Student views their applications
router.get(
  '/my',
  authenticate,
  requireRole('STUDENT'),
  getMyApplications
);

// GET /:id - Student views a specific application (ownership check in controller)
router.get(
  '/:id',
  authenticate,
  requireRole('STUDENT'),
  getApplicationById
);

// PATCH /:id - Student updates their application (ownership check in controller)
router.patch(
  '/:id',
  authenticate,
  requireRole('STUDENT'),
  updateApplication
);

// POST /:id/withdraw - Student withdraws their application (ownership check in controller)
router.post(
  '/:id/withdraw',
  authenticate,
  requireRole('STUDENT'),
  withdrawApplication
);

// PATCH /:id/laptop - Student updates laptop choice (ownership check in controller)
router.patch(
  '/:id/laptop',
  authenticate,
  requireRole('STUDENT'),
  updateApplicationLaptop
);

// ========== SRC ROUTES ==========

// GET /src/pending - SRC gets pending applications
router.get(
  '/src/pending',
  authenticate,
  requireRole('SRC'),
  getSRCPendingApplications
);

// PUT /:id/src-decision - SRC approves/rejects (university check in controller)
router.put(
  '/:id/src-decision',
  authenticate,
  requireRole('SRC'),
  srcDecision
);

// ========== ADMIN ROUTES ==========

// GET /admin/pending - Admin gets SRC-approved applications
router.get(
  '/admin/pending',
  authenticate,
  requireRole('ADMIN'),
  getAdminPendingApplications
);

// GET /admin/all - Admin gets all applications
router.get(
  '/admin/all',
  authenticate,
  requireRole('ADMIN'),
  getAllApplications
);

// PUT /:id/admin-decision - Admin approves/rejects
router.put(
  '/:id/admin-decision',
  authenticate,
  requireRole('ADMIN'),
  adminDecision
);

// PUT /:id/verification - Admin updates verification status
router.put(
  '/:id/verification',
  authenticate,
  requireRole('ADMIN'),
  updateVerificationStatus
);

// POST /:id/assign-delivery - Admin assigns delivery
router.post(
  '/:id/assign-delivery',
  authenticate,
  requireRole('ADMIN'),
  assignDelivery
);

export default router;
