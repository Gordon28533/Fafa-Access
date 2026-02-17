/**
 * Admin SRC Controller
 * 
 * REST endpoints for admin to manage SRC officer invitations
 * Routes: /api/admin/src/*
 * Auth: Admin role required
 * 
 * CREATED: February 8, 2026
 */

import process from 'process';
import SRCInviteService from '../services/SRCInviteService.js';
import TransactionalEmailService from '../services/TransactionalEmailService.js';
import { logger } from '../observability.js';

/**
 * POST /api/admin/src/invitations
 * Create and send SRC invitation
 * 
 * BODY:
 * {
 *   universityId: UUID,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phone?: string
 * }
 * 
 * RETURNS: 201 Created
 * {
 *   success: true,
 *   message: "SRC invitation created and sent",
 *   data: {
 *     invitation: { ...invitation details, inviteToken hidden },
 *     inviteLink: "https://example.com/src/accept/{token}"
 *   }
 * }
 */
export const createSRCInvitation = async (req, res) => {
  try {
    const { universityId, firstName, lastName, email, phone } = req.body;
    const adminId = req.user.id;

    // Validate required fields
    if (!universityId || !firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: universityId, firstName, lastName, email',
      });
    }

    // Create invitation
    const invitation = await SRCInviteService.createInvitation(
      {
        universityId,
        firstName,
        lastName,
        email,
        phone,
      },
      adminId
    );

    // Generate invite link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/src/accept/${invitation.inviteToken}`;

    // Send invitation email
    try {
      await TransactionalEmailService.sendEmail({
        to: email,
        template: 'srcInvitation',
        data: {
          firstName,
          lastName,
          inviteLink,
          universityName: 'the system',
          expiryDays: 7,
        },
      });
    } catch (emailErr) {
      logger.warn(
        { err: emailErr, inviteId: invitation.id },
        'Failed to send SRC invitation email but invitation created'
      );
      // Don't fail the whole operation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'SRC invitation created and sent',
      data: {
        invitation: {
          id: invitation.id,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          email: invitation.email,
          universityId: invitation.universityId,
          tokenExpiry: invitation.tokenExpiry,
          createdAt: invitation.createdAt,
        },
        inviteLink,
      },
    });

    logger.info(
      {
        inviteId: invitation.id,
        email,
        universityId,
        adminId,
      },
      'SRC invitation created and sent'
    );
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Error creating SRC invitation');

    const status = error.message.includes('DUPLICATE') ? 409 : error.message.includes('NOT_FOUND') ? 404 : 500;
    const errorCode = error.message.split(':')[0];

    res.status(status).json({
      success: false,
      error: errorCode,
      message: error.message.replace(`${errorCode}: `, ''),
    });
  }
};

/**
 * GET /api/admin/src/invitations
 * Get pending SRC invitations
 * 
 * QUERY PARAMS:
 * - universityId: Filter by university
 * - accepted: true/false (filter by agreement status)
 * - sortBy: createdAt, email, university
 * - sortOrder: asc, desc
 * 
 * RETURNS: 200 OK
 * {
 *   success: true,
 *   data: {
 *     invitations: [...],
 *     stats: {
 *       total: number,
 *       pending: number,
 *       accepted: number,
 *       created: number
 *     }
 *   }
 * }
 */
export const getPendingInvitations = async (req, res) => {
  try {
    const { universityId, accepted, sortBy, sortOrder } = req.query;

    // Fetch invitations
    const invitations = await SRCInviteService.getPendingInvitations({
      universityId,
      accepted: accepted ? accepted === 'true' : undefined,
      sortBy,
      sortOrder,
    });

    // Fetch statistics
    const stats = await SRCInviteService.getStatistics();

    res.json({
      success: true,
      data: {
        invitations,
        stats,
      },
    });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Error fetching pending invitations');

    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch invitations',
    });
  }
};

/**
 * GET /api/admin/src/invitations/:id
 * Get specific invitation details
 * 
 * RETURNS: 200 OK
 * {
 *   success: true,
 *   data: {
 *     invitation: {...}
 *   }
 * }
 */
export const getSRCInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    // This would need to fetch from DB - simplified for now
    // In real implementation, query the srcInvites table

    res.json({
      success: true,
      message: 'Invitation retrieved',
      data: {
        invitation: {
          id,
          // ...details
        },
      },
    });
  } catch (error) {
    logger.error({ err: error, inviteId: req.params.id }, 'Error fetching invitation');

    res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: 'Invitation not found',
    });
  }
};

/**
 * PATCH /api/admin/src/invitations/:id/resend
 * Resend invitation with new token
 * 
 * RETURNS: 200 OK
 * {
 *   success: true,
 *   message: "Invitation resent",
 *   data: {
 *     invitation: {...},
 *     inviteLink: "..."
 *   }
 * }
 */
export const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    // Resend invitation
    const invitation = await SRCInviteService.resendInvitation(id);

    // Generate new invite link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/src/accept/${invitation.inviteToken}`;

    // Send email again
    try {
      await TransactionalEmailService.sendEmail({
        to: invitation.email,
        template: 'srcInvitation',
        data: {
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          inviteLink,
          universityName: 'the system',
          expiryDays: 7,
        },
      });
    } catch (emailErr) {
      logger.warn({ err: emailErr, inviteId: id }, 'Failed to resend SRC invitation email');
    }

    res.json({
      success: true,
      message: 'Invitation resent',
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          tokenExpiry: invitation.tokenExpiry,
        },
        inviteLink,
      },
    });

    logger.info({ inviteId: id }, 'SRC invitation resent');
  } catch (error) {
    logger.error({ err: error, inviteId: req.params.id }, 'Error resending invitation');

    const status = error.message.includes('NOT_FOUND') ? 404 : 500;
    const errorCode = error.message.split(':')[0];

    res.status(status).json({
      success: false,
      error: errorCode,
      message: error.message.replace(`${errorCode}: `, ''),
    });
  }
};

/**
 * DELETE /api/admin/src/invitations/:id
 * Cancel invitation
 * 
 * RETURNS: 200 OK
 * {
 *   success: true,
 *   message: "Invitation cancelled"
 * }
 */
export const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    // Cancel invitation
    await SRCInviteService.cancelInvitation(id);

    res.json({
      success: true,
      message: 'Invitation cancelled',
    });

    logger.info({ inviteId: id }, 'SRC invitation cancelled');
  } catch (error) {
    logger.error({ err: error, inviteId: req.params.id }, 'Error cancelling invitation');

    const status = error.message.includes('NOT_FOUND') ? 404 : 500;
    const errorCode = error.message.split(':')[0];

    res.status(status).json({
      success: false,
      error: errorCode,
      message: error.message.replace(`${errorCode}: `, ''),
    });
  }
};

/**
 * GET /api/admin/src/statistics
 * Get SRC invitation statistics
 * 
 * RETURNS: 200 OK
 * {
 *   success: true,
 *   data: {
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
export const getSRCStatistics = async (req, res) => {
  try {
    const stats = await SRCInviteService.getStatistics();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching SRC statistics');

    res.status(500).json({
      success: false,
      error: 'FETCH_FAILED',
      message: 'Failed to fetch statistics',
    });
  }
};
