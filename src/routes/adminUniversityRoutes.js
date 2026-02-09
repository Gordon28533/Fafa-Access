/**
 * Admin University Routes
 * 
 * Protected routes for admin university management
 * Requires: ADMIN role + authentication
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  createUniversity,
  getAllUniversities,
  getUniversity,
  updateUniversity,
  activateUniversity,
  deactivateUniversity,
  deleteUniversity,
  getUniversityStats
} from '../controllers/adminUniversityController.js';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * POST /api/admin/universities
 * Create a new university
 * Body: {
 *   name: string (required),
 *   code: string (required, unique),
 *   email: string (required, unique),
 *   phone: string (required),
 *   address: string (optional)
 * }
 */
router.post('/', createUniversity);

/**
 * GET /api/admin/universities
 * Get all universities with filtering and sorting
 * Query params:
 *   - activeOnly: boolean (show only active universities)
 *   - sortBy: field to sort by (name, code, createdAt)
 *   - sortOrder: asc or desc
 */
router.get('/', getAllUniversities);

/**
 * GET /api/admin/universities/stats
 * Get university statistics
 * Returns: { total, active, inactive, percentageActive }
 */
router.get('/stats', getUniversityStats);

/**
 * GET /api/admin/universities/:id
 * Get a specific university by ID
 */
router.get('/:id', getUniversity);

/**
 * PUT /api/admin/universities/:id
 * Update university information
 * Body: Partial object with fields to update
 */
router.put('/:id', updateUniversity);

/**
 * PATCH /api/admin/universities/:id/activate
 * Activate a university (allow applications)
 */
router.patch('/:id/activate', activateUniversity);

/**
 * PATCH /api/admin/universities/:id/deactivate
 * Deactivate a university (block applications)
 */
router.patch('/:id/deactivate', deactivateUniversity);

/**
 * DELETE /api/admin/universities/:id
 * Delete a university permanently
 */
router.delete('/:id', deleteUniversity);

export default router;
