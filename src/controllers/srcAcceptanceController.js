/**
 * SRC Acceptance Controller
 * 
 * REST endpoints for SRC officer invitation acceptance
 * Routes: /api/src/*
 * Auth: PUBLIC (token-based)
 * 
 * Workflow:
 * 1. SRC receives email with link: /src/accept/{token}
 * 2. Frontend loads /api/src/invitations/{token} to display agreement
 * 3. SRC reviews and clicks "Accept Agreement"
 * 4. Frontend calls POST /api/src/accept with token
 * 5. After acceptance, admin creates account and notifies SRC
 * 
 * CREATED: February 8, 2026
 */

import SRCInviteService from '../services/SRCInviteService.js';
import { logger } from '../observability.js';

/**
 * GET /api/src/invitations/:token
 * Get invitation details and display agreement
 * 
 * PARAMS:
 * - token: Invite token from email link
 * 
 * RETURNS: 200 OK
 * {
 *   success: true,
 *   data: {
 *     invitation: {
 *       id: UUID,
 *       firstName: string,
 *       lastName: string,
 *       email: string,
 *       universityName: string,
 *       tokenExpiry: timestamp,
 *       agreementAccepted: boolean
 *     }
 *   }
 * }
 * 
 * ERRORS:
 * - 404: Token invalid/expired
 */
export const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 64) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid invitation token',
      });
    }

    // Fetch invitation details
    const invitation = await SRCInviteService.getInvitationByToken(token);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message:
          'Invitation token is invalid, expired, or already used. Please contact admin for a new invitation.',
      });
    }

    res.json({
      success: true,
      data: {
        invitation: {
          id: invitation.id,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          email: invitation.email,
          phone: invitation.phone,
          universityName: invitation.universityName,
          tokenExpiry: invitation.tokenExpiry,
          agreementAccepted: invitation.agreementAccepted,
        },
      },
    });

    logger.info(
      {
        inviteId: invitation.id,
        email: invitation.email,
      },
      'SRC invitation details viewed'
    );
  } catch (error) {
    logger.error({ err: error, token: req.params.token }, 'Error fetching invitation details');

    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve invitation. Please try again.',
    });
  }
};

/**
 * POST /api/src/accept
 * Accept partnership agreement
 * 
 * BODY:
 * {
 *   token: string (from email link),
 *   agree: boolean (must be true)
 * }
 * 
 * RETURNS: 200 OK
 * {
 *   success: true,
 *   message: "Partnership agreement accepted",
 *   data: {
 *     inviteId: UUID,
 *     nextSteps: "Admin will contact you to complete account setup"
 *   }
 * }
 * 
 * WORKFLOW:
 * 1. Validate token exists and is not expired
 * 2. Update invitation to mark agreement as accepted
 * 3. Admin receives notification to complete account setup
 * 4. SRC waits for account creation
 * 
 * ERRORS:
 * - 400: Invalid token or already accepted
 * - 404: Token not found/expired
 */
export const acceptAgreement = async (req, res) => {
  try {
    const { token, agree } = req.body;

    // Validate inputs
    if (!token || token.length < 64) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid invitation token',
      });
    }

    if (agree !== true) {
      return res.status(400).json({
        success: false,
        error: 'AGREEMENT_NOT_ACCEPTED',
        message: 'You must accept the partnership agreement to continue',
      });
    }

    // Accept agreement
    const invitation = await SRCInviteService.acceptAgreement(token);

    res.json({
      success: true,
      message: 'Partnership agreement accepted successfully',
      data: {
        inviteId: invitation.id,
        email: invitation.email,
        nextSteps: 'An admin will review your information and contact you to complete account setup within 24 hours.',
      },
    });

    logger.info(
      {
        inviteId: invitation.id,
        email: invitation.email,
        universityId: invitation.universityId,
      },
      'SRC agreement accepted'
    );

    // TODO: Send notification to admin about new SRC acceptance
    // TODO: Send confirmation email to SRC officer
  } catch (error) {
    logger.error({ err: error, token: req.body.token }, 'Error accepting agreement');

    let status = 500;
    if (error.message.includes('INVALID_TOKEN')) {
      status = 404;
    } else if (error.message.includes('ALREADY_ACCEPTED')) {
      status = 400;
    }

    const errorCode = error.message.split(':')[0];

    res.status(status).json({
      success: false,
      error: errorCode,
      message: error.message.replace(`${errorCode}: `, ''),
    });
  }
};

/**
 * GET /api/src/status/:inviteId
 * Check acceptance status (for admin dashboard)
 * 
 * PARAMS:
 * - inviteId: Invitation UUID
 * 
 * RETURNS: 200 OK
 * {
 *   success: true,
 *   data: {
 *     status: {
 *       agreementAccepted: boolean,
 *       acceptedAt: timestamp | null,
 *       accountCreated: boolean,
 *       isExpired: boolean
 *     }
 *   }
 * }
 */
export const checkStatus = async (req, res) => {
  try {
    const { inviteId } = req.params;

    if (!inviteId) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_INVITE_ID',
        message: 'Invite ID is required',
      });
    }

    // This would fetch from database
    // For now, return structure

    res.json({
      success: true,
      data: {
        status: {
          agreementAccepted: false,
          acceptedAt: null,
          accountCreated: false,
          isExpired: false,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error, inviteId: req.params.inviteId }, 'Error checking status');

    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to check status',
    });
  }
};
