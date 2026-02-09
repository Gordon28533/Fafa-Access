/**
 * Student University Routes
 * 
 * Read-only routes for students to view available universities
 * Requires: Authentication (STUDENT role)
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  getAvailableUniversities,
  getUniversityForApplication
} from '../controllers/studentUniversityController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/universities
 * Get list of active universities available for student applications
 * Query params:
 *   - search: search by name or code (optional)
 * Returns: Only universities with active = true
 */
router.get('/', getAvailableUniversities);

/**
 * GET /api/universities/:id
 * Get a specific university for viewing details (if active)
 * Returns: 200 if university is active and available
 * Returns: 410 Gone if university is inactive or not accepting applications
 */
router.get('/:id', getUniversityForApplication);

export default router;
