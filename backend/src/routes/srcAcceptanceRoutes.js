/**
 * SRC Acceptance Routes
 * 
 * REST API routes for SRC officers to view and accept partnership agreements
 * These are PUBLIC routes - token-based authentication only
 * No admin role required
 * 
 * Routes:
 * GET  /api/src/invitations/:token   - Get invitation details and agreement
 * POST /api/src/accept                - Accept partnership agreement
 * GET  /api/src/status/:inviteId      - Check invitation acceptance status
 */

import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import * as srcAcceptanceController from '../controllers/srcAcceptanceController.js';

const router = express.Router();

/**
 * GET /api/src/invitations/:token
 * PUBLIC ENDPOINT - No authentication required
 * 
 * Get invitation details for displaying the partnership agreement page
 * The token is passed in the URL and validated server-side
 * 
 * Path parameters:
 * - token: Secure invitation token (64-character hex string)
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   data: {
 *     invitation: {
 *       id: string (UUID),
 *       firstName: string,
 *       lastName: string,
 *       email: string,
 *       phone: string,
 *       universityName: string,
 *       tokenExpiry: ISO8601 datetime,
 *       agreementAccepted: boolean
 *     }
 *   }
 * }
 * 
 * Error responses:
 * 400: Invalid token format (less than 64 characters)
 * 404: Token not found, invalid, or expired
 *       Response includes helpMessage about requesting new invitation
 * 500: Server error
 * 
 * Security notes:
 * - Token is validated in database
 * - Expired tokens (token_expiry < NOW) are rejected
 * - Already-accepted invitations are still returnable (for status check)
 * - No rate limiting enforced on this endpoint
 */
router.get('/invitations/:token', srcAcceptanceController.getInvitationDetails);

/**
 * POST /api/src/accept
 * PUBLIC ENDPOINT - No authentication required
 * 
 * Accept the partnership agreement for an invited SRC officer
 * Sets agreementAccepted=true and agreementAcceptedAt=NOW()
 * 
 * Request body:
 * {
 *   token: string (64-character hex - the invite token),
 *   agree: true (boolean - MUST be true to proceed)
 * }
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   message: "Partnership agreement accepted successfully",
 *   data: {
 *     inviteId: string (UUID),
 *     email: string,
 *     nextSteps: "Admin will review your information and contact you within 24 hours..."
 *   }
 * }
 * 
 * Error responses:
 * 400: Invalid request
 *      - agree is not true (must explicitly agree)
 *      - token/agree missing from request body
 * 404: Token not found, invalid, or expired
 *      Response includes message about requesting new invitation
 * 409: Agreement already accepted by this token
 * 500: Server error
 * 
 * Security notes:
 * - Requires agree: true to prevent accidental acceptance
 * - Token is validated and checked for expiry
 * - Sets agreementAcceptedAt timestamp for audit trail
 * - Account creation is gated by agreementAccepted flag in separate flow
 * - Email confirmation logged for compliance
 * 
 * Workflow:
 * 1. SRC views /src/accept/:token page
 * 2. Page calls GET /api/src/invitations/:token to display agreement
 * 3. SRC reviews 7-section partnership agreement
 * 4. SRC checks "I agree" checkbox
 * 5. SRC clicks "Accept Agreement" button
 * 6. Frontend calls POST /api/src/accept with {token, agree: true}
 * 7. Backend updates agreementAccepted=true, agreementAcceptedAt=NOW()
 * 8. Frontend shows success screen with "Admin will contact you" message
 * 9. Admin then creates account via separate admin endpoint
 */
router.post('/accept', srcAcceptanceController.acceptAgreement);

/**
 * GET /api/src/status/:inviteId
 * AUTHENTICATED ENDPOINT - Requires valid JWT token
 * 
 * Check the acceptance status of an invitation
 * Can be used by admin to verify acceptance before creating account
 * Can be used by SRC to check their own status
 * 
 * Path parameters:
 * - inviteId: UUID of the invitation
 * 
 * Response: 200 OK
 * {
 *   success: true,
 *   data: {
 *     status: {
 *       agreementAccepted: boolean,
 *       acceptedAt: ISO8601 datetime or null,
 *       accountCreated: boolean,
 *       isExpired: boolean
 *     }
 *   }
 * }
 * 
 * Error responses:
 * 401: Unauthorized - JWT token missing or invalid
 * 404: Invitation not found
 * 500: Server error
 * 
 * Use cases:
 * - Admin dashboard: Before creating account, verify agreement accepted
 * - SRC portal: Self-check status before contacting admin
 * - System validation: Prevent account creation without agreement
 */
router.get('/status/:inviteId', authenticate, srcAcceptanceController.checkStatus);

export default router;
