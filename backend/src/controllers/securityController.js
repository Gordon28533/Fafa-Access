/**
 * Security Controller
 * Handles password changes, login sessions, and security settings
 */

import { db } from '../db/connection.js';
import { users, refreshTokens, loginSessions } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../services/authService.js';
import { logger } from '../observability.js';

/**
 * POST /api/security/change-password
 * Change user password with current password verification
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        errors: ['currentPassword, newPassword, and confirmPassword are required']
      });
    }

    // Validate new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
        errors: ['New password and confirmation must match']
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password too weak',
        errors: ['Password must be at least 8 characters long']
      });
    }

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['User does not exist']
      });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user[0].passwordHash);
    if (!isValidPassword) {
      logger.warn({ userId }, 'Failed password change attempt - incorrect current password');
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password',
        errors: ['The current password you entered is incorrect']
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    logger.info({ userId }, 'Password changed successfully');

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error({ err: error }, 'Error changing password');
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/security/sessions
 * Get recent login sessions for the authenticated user
 */
export const getLoginSessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get recent login sessions (last 30 days, limit 20)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await db
      .select({
        id: loginSessions.id,
        deviceName: loginSessions.deviceName,
        deviceType: loginSessions.deviceType,
        browserName: loginSessions.browserName,
        osName: loginSessions.osName,
        ipAddress: loginSessions.ipAddress,
        location: loginSessions.location,
        isActive: loginSessions.isActive,
        lastActivityAt: loginSessions.lastActivityAt,
        createdAt: loginSessions.createdAt,
      })
      .from(loginSessions)
      .where(eq(loginSessions.userId, userId))
      .orderBy(desc(loginSessions.lastActivityAt))
      .limit(20);

    logger.info({ userId, sessionCount: sessions.length }, 'Retrieved login sessions');

    res.json({
      success: true,
      message: 'Login sessions retrieved successfully',
      data: {
        sessions,
        total: sessions.length
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching login sessions');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve login sessions',
      errors: [error.message]
    });
  }
};

/**
 * POST /api/security/logout-all
 * Logout from all devices by revoking all refresh tokens
 */
export const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    // Require password confirmation for sensitive action
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation required',
        errors: ['Password is required to logout from all devices']
      });
    }

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['User does not exist']
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user[0].passwordHash);
    if (!isValidPassword) {
      logger.warn({ userId }, 'Failed logout all devices - incorrect password');
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
        errors: ['The password you entered is incorrect']
      });
    }

    // Revoke all refresh tokens
    const revokedCount = await db
      .update(refreshTokens)
      .set({
        revokedAt: new Date()
      })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          eq(refreshTokens.revokedAt, null)
        )
      )
      .returning({ id: refreshTokens.id });

    // Mark all login sessions as inactive
    await db
      .update(loginSessions)
      .set({
        isActive: 'false'
      })
      .where(
        and(
          eq(loginSessions.userId, userId),
          eq(loginSessions.isActive, 'true')
        )
      );

    logger.info({ userId, revokedTokens: revokedCount.length }, 'Logged out from all devices');

    res.json({
      success: true,
      message: `Successfully logged out from ${revokedCount.length} device(s)`,
      data: {
        sessionsRevoked: revokedCount.length
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error logging out from all devices');
    res.status(500).json({
      success: false,
      message: 'Failed to logout from all devices',
      errors: [error.message]
    });
  }
};

/**
 * POST /api/security/toggle-2fa
 * Toggle email-based 2FA (future-ready)
 */
export const toggle2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enable, password } = req.body;

    // Require password confirmation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation required',
        errors: ['Password is required to change 2FA settings']
      });
    }

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['User does not exist']
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user[0].passwordHash);
    if (!isValidPassword) {
      logger.warn({ userId }, 'Failed 2FA toggle - incorrect password');
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
        errors: ['The password you entered is incorrect']
      });
    }

    // Update 2FA setting
    await db
      .update(users)
      .set({
        mfaEnabled: enable,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    logger.info({ userId, mfaEnabled: enable }, '2FA settings updated');

    res.json({
      success: true,
      message: enable ? '2FA enabled successfully' : '2FA disabled successfully',
      data: {
        mfaEnabled: enable
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error toggling 2FA');
    res.status(500).json({
      success: false,
      message: 'Failed to update 2FA settings',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/security/settings
 * Get current security settings for the user
 */
export const getSecuritySettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's current security settings
    const user = await db
      .select({
        mfaEnabled: users.mfaEnabled,
        lastLoginAt: users.lastLoginAt,
        lastLoginIp: users.lastLoginIp,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: ['User does not exist']
      });
    }

    res.json({
      success: true,
      message: 'Security settings retrieved successfully',
      data: user[0]
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching security settings');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security settings',
      errors: [error.message]
    });
  }
};
