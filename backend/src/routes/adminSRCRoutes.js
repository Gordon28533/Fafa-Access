/**
 * Admin SRC Routes
 * 
 * REST API routes for admin management of SRC officer invitations
 * All routes require authentication and admin role
 * 
 * Routes:
 * POST   /api/admin/src/invitations              - Create new SRC invitation
 * GET    /api/admin/src/invitations              - Get pending invitations with filters
 * GET    /api/admin/src/invitations/:id          - Get single invitation
 * PATCH  /api/admin/src/invitations/:id/resend   - Resend invitation with new token
 * DELETE /api/admin/src/invitations/:id          - Cancel invitation
 * GET    /api/admin/src/statistics               - Get SRC statistics
 */

import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import * as adminSRCController from '../controllers/adminSRCController.js';

const router = express.Router();

/**
 * Middleware: Verify admin authentication on all routes
 */
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * POST /api/admin/src/invitations
 * Create and send a new SRC officer invitation
 * 
 * Request body:
 * {
 *   universityId: string (UUID),
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phone?: string
 * }
 * 
 * Response: 201 Created
 * {
 *   success: true,
 *   message: "SRC invitation created successfully",
 *   data: {
 *     invitation: { ... },
 *     inviteLink: "https://app.com/src/accept/{token}"
 *   }
 * }
 * 
 * Error responses:
 * 400: Invalid input or email already invited
 * 404: University not found
 * 500: Server error
 */
router.post('/invitations', adminSRCController.createSRCInvitation);

/**
 * GET /api/admin/src/invitations
 * Get list of pending SRC invitations with filters and sorting
 * 
 * Query parameters:
 * - universityId (optional): Filter by university
 * - accepted (optional): true|false - Filter by agreement acceptance status
 * - sortBy (optional): email|createdAt|university - Sort field
 * - sortOrder (optional): asc|desc - Sort direction
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   data: {
 *     invitations: [
 *       {
 *         id, universityId, firstName, lastName, email, phone,
 *         status: "active"|"expired", agreementAccepted, agreementAcceptedAt,
 *         accountCreated, tokenExpiry
 *       }
 *     ],
 *     stats: {
 *       total: number,
 *       pending: number,
 *       accepted: number,
 *       created: number,
 *       expired: number
 *     }
 *   }
 * }
 */
router.get('/invitations', adminSRCController.getPendingInvitations);

/**
 * GET /api/admin/src/invitations/:id
 * Get a single SRC invitation by ID
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   data: { invitation object }
 * }
 * 
 * Error responses:
 * 404: Invitation not found
 */
router.get('/invitations/:id', adminSRCController.getSRCInvitation);

/**
 * PATCH /api/admin/src/invitations/:id/resend
 * Resend invitation with a new secure token
 * Generates new token, resets expiry to 7 days, and sends email again
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   message: "Invitation resent successfully",
 *   data: {
 *     invitation: { ... },
 *     inviteLink: "https://app.com/src/accept/{newToken}"
 *   }
 * }
 * 
 * Error responses:
 * 404: Invitation not found or already expired
 * 409: Invitation already created an account
 */
router.patch('/invitations/:id/resend', adminSRCController.resendInvitation);

/**
 * DELETE /api/admin/src/invitations/:id
 * Cancel an active invitation
 * Sets isExpired flag to prevent further acceptance
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   message: "Invitation cancelled successfully"
 * }
 * 
 * Error responses:
 * 404: Invitation not found
 * 409: Invitation already expired or account created
 */
router.delete('/invitations/:id', adminSRCController.cancelInvitation);

/**
 * GET /api/admin/src/statistics
 * Get overall SRC program statistics
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   data: {
 *     stats: {
 *       total: number,         // Total invitations ever sent
 *       pending: number,       // Awaiting agreement acceptance
 *       accepted: number,      // Agreement accepted
 *       created: number,       // Accounts created
 *       expired: number        // Tokens expired
 *     }
 *   }
 * }
 */
router.get('/statistics', adminSRCController.getSRCStatistics);

export default router;
