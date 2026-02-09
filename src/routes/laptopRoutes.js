/**
 * Laptop Inventory Routes
 * Admin-only routes for managing laptop inventory
 * Students can view active laptops via GET /api/laptops
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  getActiveLaptops,
  getAllLaptops,
  createLaptop,
  updateLaptop,
  deactivateLaptop,
  activateLaptop,
  adjustStock,
  getInventorySummary,
} from '../controllers/laptopController.js';

const router = express.Router();

// ========== STUDENT ROUTES ==========

// GET /api/laptops - Get all active laptops (public for authenticated users)
router.get('/', authenticate, getActiveLaptops);

// ========== ADMIN ROUTES ==========

// GET /api/admin/laptops - Get all laptops including inactive
router.get(
  '/admin/all',
  authenticate,
  requireRole('ADMIN'),
  getAllLaptops
);

// GET /api/admin/laptops/inventory/summary - Get inventory summary
router.get(
  '/admin/summary',
  authenticate,
  requireRole('ADMIN'),
  getInventorySummary
);

// POST /api/admin/laptops - Create new laptop
router.post(
  '/admin',
  authenticate,
  requireRole('ADMIN'),
  createLaptop
);

// PATCH /api/admin/laptops/:id - Update laptop details
router.patch(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN'),
  updateLaptop
);

// DELETE /api/admin/laptops/:id - Deactivate laptop (soft delete)
router.delete(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN'),
  deactivateLaptop
);

// POST /api/admin/laptops/:id/activate - Reactivate laptop
router.post(
  '/admin/:id/activate',
  authenticate,
  requireRole('ADMIN'),
  activateLaptop
);

// POST /api/admin/laptops/:id/adjust-stock - Adjust stock quantity
router.post(
  '/admin/:id/adjust-stock',
  authenticate,
  requireRole('ADMIN'),
  adjustStock
);

export default router;
