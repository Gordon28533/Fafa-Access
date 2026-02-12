/**
 * SRC Invite Service
 * 
 * Business logic for managing SRC officer invitations
 * Features:
 * - Create time-limited invitations
 * - Generate secure tokens
 * - Validate and accept agreements
 * - Track account creation
 * - Manage invite lifecycle
 * 
 * CREATED: February 8, 2026
 */

import crypto from 'crypto';
import { db } from '../db/connection.js';
import { srcInvites } from '../schemas/srcInvitesSchema.js';
import { universities } from '../schemas/universitiesSchema.js';
import { eq, and, gt, sql } from 'drizzle-orm';
import { logger } from '../observability.js';

class SRCInviteService {
  /**
   * Generate secure random token
   * @returns {string} 64-character hex token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Calculate token expiry (7 days from now)
   * @return {Date} Expiry timestamp
   */
  getTokenExpiry() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    return expiry;
  }

  /**
   * Create SRC invitation
   * 
   * @param {Object} data - Invitation data
   * @param {string} data.universityId - University UUID
   * @param {string} data.firstName - SRC officer first name
   * @param {string} data.lastName - SRC officer last name
   * @param {string} data.email - SRC officer email (unique)
   * @param {string} data.phone - SRC officer phone (optional)
   * @param {string} adminId - Admin ID creating the invitation
   * 
   * @returns {Promise<Object>} Created invitation
   * @throws {Error} If validation fails
   * 
   * VALIDATION:
   * - Email is unique (no duplicate invites)
   * - University exists and is active
   * - Required fields provided
   * - Email format valid
   */
  async createInvitation(data, adminId) {
    try {
      // Validate inputs
      if (!data.universityId || !data.firstName || !data.lastName || !data.email) {
        throw new Error('VALIDATION_ERROR: Missing required fields (universityId, firstName, lastName, email)');
      }

      // Validate email format
      // Add length check to prevent ReDoS attacks
      if (data.email.length > 254) {
        throw new Error('VALIDATION_ERROR: Email too long');
      }
      
      // Use safer regex without catastrophic backtracking
      // This pattern is more specific and avoids nested quantifiers
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('VALIDATION_ERROR: Invalid email format');
      }

      // Check if university exists and is active
      const university = await db
        .select()
        .from(universities)
        .where(and(eq(universities.id, data.universityId), eq(universities.active, true)));

      if (university.length === 0) {
        throw new Error('NOT_FOUND: University not found or not active');
      }

      // Check if email already has a pending invitation
      const existingInvite = await db
        .select()
        .from(srcInvites)
        .where(
          and(
            eq(srcInvites.email, data.email),
            eq(srcInvites.accountCreated, false)
          )
        );

      if (existingInvite.length > 0) {
        throw new Error('DUPLICATE_ENTRY: Email already has a pending invitation');
      }

      // Generate token and expiry
      const inviteToken = this.generateToken();
      const tokenExpiry = this.getTokenExpiry();

      // Create invitation
      const result = await db
        .insert(srcInvites)
        .values({
          universityId: data.universityId,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.toLowerCase().trim(),
          phone: data.phone?.trim() || null,
          inviteToken,
          tokenExpiry,
          invitedBy: adminId,
        })
        .returning();

      logger.info({
        inviteId: result[0].id,
        email: data.email,
        universityId: data.universityId,
        adminId,
      }, 'SRC invitation created');

      return result[0];
    } catch (error) {
      logger.error({ err: error, data }, 'Error creating SRC invitation');
      throw error;
    }
  }

  /**
   * Get invitation by token
   * 
   * @param {string} token - Invite token
   * @returns {Promise<Object|null>} Invitation or null if not found/invalid
   * 
   * VALIDATION:
   * - Token exists
   * - Token not expired
   * - Token not already marked as expired
   * - Account not already created
   */
  async getInvitationByToken(token) {
    try {
      const result = await db
        .select({
          id: srcInvites.id,
          universityId: srcInvites.universityId,
          firstName: srcInvites.firstName,
          lastName: srcInvites.lastName,
          email: srcInvites.email,
          phone: srcInvites.phone,
          inviteToken: srcInvites.inviteToken,
          tokenExpiry: srcInvites.tokenExpiry,
          isExpired: srcInvites.isExpired,
          agreementAccepted: srcInvites.agreementAccepted,
          agreementAcceptedAt: srcInvites.agreementAcceptedAt,
          accountCreated: srcInvites.accountCreated,
          createdAt: srcInvites.createdAt,
          universityName: universities.name,
        })
        .from(srcInvites)
        .innerJoin(universities, eq(srcInvites.universityId, universities.id))
        .where(
          and(
            eq(srcInvites.inviteToken, token),
            eq(srcInvites.isExpired, false),
            eq(srcInvites.accountCreated, false),
            gt(srcInvites.tokenExpiry, sql`NOW()`)
          )
        );

      return result[0] || null;
    } catch (error) {
      logger.error({ err: error, token }, 'Error fetching invitation by token');
      throw error;
    }
  }

  /**
   * Accept agreement
   * 
   * @param {string} token - Invite token
   * @returns {Promise<Object>} Updated invitation
   * @throws {Error} If token invalid/expired or already accepted
   * 
   * VALIDATION:
   * - Token valid and not expired
   * - Agreement not already accepted
   * - Account not created yet
   * 
   * UPDATES:
   * - Sets agreementAccepted = true
   * - Sets agreementAcceptedAt = NOW()
   */
  async acceptAgreement(token) {
    try {
      // Get valid invitation
      const invite = await this.getInvitationByToken(token);

      if (!invite) {
        throw new Error('INVALID_TOKEN: Invitation token is invalid, expired, or already used');
      }

      if (invite.agreementAccepted) {
        throw new Error('ALREADY_ACCEPTED: Agreement was already accepted');
      }

      // Update to mark agreement as accepted
      const result = await db
        .update(srcInvites)
        .set({
          agreementAccepted: true,
          agreementAcceptedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(srcInvites.id, invite.id))
        .returning();

      logger.info({
        inviteId: invite.id,
        email: invite.email,
        universityId: invite.universityId,
      }, 'SRC agreement accepted');

      return result[0];
    } catch (error) {
      logger.error({ err: error, token }, 'Error accepting agreement');
      throw error;
    }
  }

  /**
   * Record account creation
   * 
   * @param {string} inviteId - Invitation ID
   * @param {string} userId - New SRC user ID
   * @returns {Promise<Object>} Updated invitation
   * @throws {Error} If invitation not found or already used
   * 
   * VALIDATION:
   * - Invitation exists
   * - Agreement was accepted
   * - Account not already created
   * 
   * UPDATES:
   * - Sets accountCreated = true
   * - Sets createdUserId = userId
   */
  async recordAccountCreation(inviteId, userId) {
    try {
      // Get invitation
      const invite = await db
        .select()
        .from(srcInvites)
        .where(eq(srcInvites.id, inviteId));

      if (invite.length === 0) {
        throw new Error('NOT_FOUND: Invitation not found');
      }

      const inv = invite[0];

      if (!inv.agreementAccepted) {
        throw new Error('VALIDATION_ERROR: Agreement not accepted yet');
      }

      if (inv.accountCreated) {
        throw new Error('ALREADY_CREATED: Account already created for this invitation');
      }

      // Record account creation
      const result = await db
        .update(srcInvites)
        .set({
          accountCreated: true,
          createdUserId: userId,
          updatedAt: new Date(),
        })
        .where(eq(srcInvites.id, inviteId))
        .returning();

      logger.info({
        inviteId,
        userId,
        email: inv.email,
      }, 'SRC account created');

      return result[0];
    } catch (error) {
      logger.error({ err: error, inviteId }, 'Error recording account creation');
      throw error;
    }
  }

  /**
   * Get pending invitations
   * 
   * @param {Object} options - Query options
   * @param {string} options.universityId - Filter by university (optional)
   * @param {boolean} options.accepted - Filter by agreement status (optional)
   * @param {string} options.sortBy - Sort field (createdAt, email, university)
   * @param {string} options.sortOrder - asc or desc
   * 
   * @returns {Promise<Array>} List of pending invitations
   */
  async getPendingInvitations(options = {}) {
    try {
      let query = db
        .select({
          id: srcInvites.id,
          firstName: srcInvites.firstName,
          lastName: srcInvites.lastName,
          email: srcInvites.email,
          universityName: universities.name,
          universityId: srcInvites.universityId,
          agreementAccepted: srcInvites.agreementAccepted,
          agreementAcceptedAt: srcInvites.agreementAcceptedAt,
          accountCreated: srcInvites.accountCreated,
          tokenExpiry: srcInvites.tokenExpiry,
          isExpired: srcInvites.isExpired,
          createdAt: srcInvites.createdAt,
        })
        .from(srcInvites)
        .innerJoin(universities, eq(srcInvites.universityId, universities.id));

      // Apply filters
      const conditions = [eq(srcInvites.accountCreated, false)];

      if (options.universityId) {
        conditions.push(eq(srcInvites.universityId, options.universityId));
      }

      if (options.accepted !== undefined) {
        conditions.push(eq(srcInvites.agreementAccepted, options.accepted));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortBy = options.sortBy || 'createdAt';
      const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

      if (sortBy === 'email') {
        query = sortOrder === 'asc'
          ? query.orderBy(srcInvites.email)
          : query.orderBy(sql`${srcInvites.email} DESC`);
      } else if (sortBy === 'university') {
        query = sortOrder === 'asc'
          ? query.orderBy(universities.name)
          : query.orderBy(sql`${universities.name} DESC`);
      } else {
        query = sortOrder === 'asc'
          ? query.orderBy(srcInvites.createdAt)
          : query.orderBy(sql`${srcInvites.createdAt} DESC`);
      }

      return await query;
    } catch (error) {
      logger.error({ err: error, options }, 'Error fetching pending invitations');
      throw error;
    }
  }

  /**
   * Resend invitation
   * 
   * @param {string} inviteId - Invitation ID
   * @returns {Promise<Object>} Updated invitation with new token
   * @throws {Error} If invite already used
   * 
   * UPDATES:
   * - Generates new token
   * - Resets token expiry to 7 days
   * - Clears isExpired flag
   */
  async resendInvitation(inviteId) {
    try {
      const invite = await db
        .select()
        .from(srcInvites)
        .where(eq(srcInvites.id, inviteId));

      if (invite.length === 0) {
        throw new Error('NOT_FOUND: Invitation not found');
      }

      if (invite[0].accountCreated) {
        throw new Error('VALIDATION_ERROR: Cannot resend invitation for already created account');
      }

      const newToken = this.generateToken();
      const newExpiry = this.getTokenExpiry();

      const result = await db
        .update(srcInvites)
        .set({
          inviteToken: newToken,
          tokenExpiry: newExpiry,
          isExpired: false,
          updatedAt: new Date(),
        })
        .where(eq(srcInvites.id, inviteId))
        .returning();

      logger.info({
        inviteId,
        email: invite[0].email,
      }, 'SRC invitation resent');

      return result[0];
    } catch (error) {
      logger.error({ err: error, inviteId }, 'Error resending invitation');
      throw error;
    }
  }

  /**
   * Cancel invitation
   * 
   * @param {string} inviteId - Invitation ID
   * @returns {Promise<Object>} Updated invitation
   * @throws {Error} If invite already used
   * 
   * UPDATES:
   * - Sets isExpired = true
   * - Prevents further acceptance
   */
  async cancelInvitation(inviteId) {
    try {
      const invite = await db
        .select()
        .from(srcInvites)
        .where(eq(srcInvites.id, inviteId));

      if (invite.length === 0) {
        throw new Error('NOT_FOUND: Invitation not found');
      }

      if (invite[0].accountCreated) {
        throw new Error('VALIDATION_ERROR: Cannot cancel invitation for already created account');
      }

      const result = await db
        .update(srcInvites)
        .set({
          isExpired: true,
          updatedAt: new Date(),
        })
        .where(eq(srcInvites.id, inviteId))
        .returning();

      logger.info({
        inviteId,
        email: invite[0].email,
      }, 'SRC invitation cancelled');

      return result[0];
    } catch (error) {
      logger.error({ err: error, inviteId }, 'Error cancelling invitation');
      throw error;
    }
  }

  /**
   * Get invitation statistics
   * 
   * @returns {Promise<Object>} Statistics across all invitations
   * 
   * RETURNS:
   * - total: Total invitations sent
   * - pending: Not yet accepted
   * - accepted: Agreement accepted but no account
   * - created: Accounts created
   * - expired: Expired invitations
   */
  async getStatistics() {
    try {
      const result = await db
        .select({
          total: sql`COUNT(*)`,
          pending: sql`SUM(CASE WHEN ${srcInvites.agreementAccepted} = false THEN 1 ELSE 0 END)`,
          accepted: sql`SUM(CASE WHEN ${srcInvites.agreementAccepted} = true AND ${srcInvites.accountCreated} = false THEN 1 ELSE 0 END)`,
          created: sql`SUM(CASE WHEN ${srcInvites.accountCreated} = true THEN 1 ELSE 0 END)`,
          expired: sql`SUM(CASE WHEN ${srcInvites.isExpired} = true THEN 1 ELSE 0 END)`,
        })
        .from(srcInvites);

      return {
        total: parseInt(result[0].total) || 0,
        pending: parseInt(result[0].pending) || 0,
        accepted: parseInt(result[0].accepted) || 0,
        created: parseInt(result[0].created) || 0,
        expired: parseInt(result[0].expired) || 0,
      };
    } catch (error) {
      logger.error({ err: error }, 'Error fetching invitation statistics');
      throw error;
    }
  }
}

export default new SRCInviteService();
