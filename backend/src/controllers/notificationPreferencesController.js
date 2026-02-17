/**
 * Notification Preferences Controller
 * Handles getting and updating user notification preferences
 */

import { db } from '../db/connection.js';
import { notificationPreferences } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../observability.js';

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the authenticated user
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;

    let preferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    // If no preferences exist, create defaults
    if (!preferences || preferences.length === 0) {
      const newPreferences = await db
        .insert(notificationPreferences)
        .values({
          userId,
          // All default to true except marketing
          applicationStatusEmailEnabled: true,
          applicationStatusInAppEnabled: true,
          approvalEmailEnabled: true,
          approvalInAppEnabled: true,
          deliveryEmailEnabled: true,
          deliveryInAppEnabled: true,
          paymentEmailEnabled: true,
          paymentInAppEnabled: true,
          marketingEmailEnabled: false,
        })
        .returning();

      logger.info({ userId }, 'Created default notification preferences');
      preferences = newPreferences;
    }

    logger.info({ userId }, 'Retrieved notification preferences');

    res.json({
      success: true,
      message: 'Notification preferences retrieved successfully',
      data: preferences[0]
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching notification preferences');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification preferences',
      errors: [error.message]
    });
  }
};

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for the authenticated user
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // Validate that updates contain valid preference fields
    const validFields = [
      'applicationStatusEmailEnabled',
      'applicationStatusInAppEnabled',
      'approvalEmailEnabled',
      'approvalInAppEnabled',
      'deliveryEmailEnabled',
      'deliveryInAppEnabled',
      'paymentEmailEnabled',
      'paymentInAppEnabled',
      'marketingEmailEnabled'
    ];

    const updatePayload = {};
    for (const field of validFields) {
      if (field in updates) {
        updatePayload[field] = updates[field];
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid preferences to update',
        errors: ['Provide at least one valid preference field']
      });
    }

    // Add updated timestamp
    updatePayload.updatedAt = new Date();

    // Get existing preferences (or create if not exists)
    let existingPreferences = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (!existingPreferences || existingPreferences.length === 0) {
      // Create new preferences with the updates
      const newPreferences = await db
        .insert(notificationPreferences)
        .values({
          userId,
          applicationStatusEmailEnabled: true,
          applicationStatusInAppEnabled: true,
          approvalEmailEnabled: true,
          approvalInAppEnabled: true,
          deliveryEmailEnabled: true,
          deliveryInAppEnabled: true,
          paymentEmailEnabled: true,
          paymentInAppEnabled: true,
          marketingEmailEnabled: false,
          ...updatePayload
        })
        .returning();

      logger.info({ userId, updates: updatePayload }, 'Created and updated notification preferences');

      return res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: newPreferences[0]
      });
    }

    // Update existing preferences
    const updated = await db
      .update(notificationPreferences)
      .set(updatePayload)
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    logger.info({ userId, updates: updatePayload }, 'Updated notification preferences');

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: updated[0]
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating notification preferences');
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      errors: [error.message]
    });
  }
};

/**
 * POST /api/notifications/preferences/reset
 * Reset notification preferences to defaults
 */
export const resetNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;

    const defaults = {
      applicationStatusEmailEnabled: true,
      applicationStatusInAppEnabled: true,
      approvalEmailEnabled: true,
      approvalInAppEnabled: true,
      deliveryEmailEnabled: true,
      deliveryInAppEnabled: true,
      paymentEmailEnabled: true,
      paymentInAppEnabled: true,
      marketingEmailEnabled: false,
      updatedAt: new Date()
    };

    // Check if preferences exist
    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    let result;
    if (!existing || existing.length === 0) {
      // Create with defaults
      result = await db
        .insert(notificationPreferences)
        .values({
          userId,
          ...defaults
        })
        .returning();
    } else {
      // Update to defaults
      result = await db
        .update(notificationPreferences)
        .set(defaults)
        .where(eq(notificationPreferences.userId, userId))
        .returning();
    }

    logger.info({ userId }, 'Reset notification preferences to defaults');

    res.json({
      success: true,
      message: 'Notification preferences reset to defaults',
      data: result[0]
    });
  } catch (error) {
    logger.error({ err: error }, 'Error resetting notification preferences');
    res.status(500).json({
      success: false,
      message: 'Failed to reset notification preferences',
      errors: [error.message]
    });
  }
};

/**
 * POST /api/notifications/preferences/toggle-all-email
 * Toggle all email notifications on/off
 */
export const toggleAllEmailNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        errors: ['enabled must be a boolean']
      });
    }

    const updates = {
      applicationStatusEmailEnabled: enabled,
      approvalEmailEnabled: enabled,
      deliveryEmailEnabled: enabled,
      paymentEmailEnabled: enabled,
      updatedAt: new Date()
    };

    // Get or create preferences
    let existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    let result;
    if (!existing || existing.length === 0) {
      result = await db
        .insert(notificationPreferences)
        .values({
          userId,
          applicationStatusEmailEnabled: true,
          applicationStatusInAppEnabled: true,
          approvalEmailEnabled: true,
          approvalInAppEnabled: true,
          deliveryEmailEnabled: true,
          deliveryInAppEnabled: true,
          paymentEmailEnabled: true,
          paymentInAppEnabled: true,
          marketingEmailEnabled: false,
          ...updates
        })
        .returning();
    } else {
      result = await db
        .update(notificationPreferences)
        .set(updates)
        .where(eq(notificationPreferences.userId, userId))
        .returning();
    }

    logger.info({ userId, emailEnabled: enabled }, 'Toggled all email notifications');

    res.json({
      success: true,
      message: `All email notifications ${enabled ? 'enabled' : 'disabled'}`,
      data: result[0]
    });
  } catch (error) {
    logger.error({ err: error }, 'Error toggling email notifications');
    res.status(500).json({
      success: false,
      message: 'Failed to toggle email notifications',
      errors: [error.message]
    });
  }
};

/**
 * POST /api/notifications/preferences/toggle-all-inapp
 * Toggle all in-app notifications on/off
 */
export const toggleAllInAppNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        errors: ['enabled must be a boolean']
      });
    }

    const updates = {
      applicationStatusInAppEnabled: enabled,
      approvalInAppEnabled: enabled,
      deliveryInAppEnabled: enabled,
      paymentInAppEnabled: enabled,
      updatedAt: new Date()
    };

    // Get or create preferences
    let existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    let result;
    if (!existing || existing.length === 0) {
      result = await db
        .insert(notificationPreferences)
        .values({
          userId,
          applicationStatusEmailEnabled: true,
          applicationStatusInAppEnabled: true,
          approvalEmailEnabled: true,
          approvalInAppEnabled: true,
          deliveryEmailEnabled: true,
          deliveryInAppEnabled: true,
          paymentEmailEnabled: true,
          paymentInAppEnabled: true,
          marketingEmailEnabled: false,
          ...updates
        })
        .returning();
    } else {
      result = await db
        .update(notificationPreferences)
        .set(updates)
        .where(eq(notificationPreferences.userId, userId))
        .returning();
    }

    logger.info({ userId, inAppEnabled: enabled }, 'Toggled all in-app notifications');

    res.json({
      success: true,
      message: `All in-app notifications ${enabled ? 'enabled' : 'disabled'}`,
      data: result[0]
    });
  } catch (error) {
    logger.error({ err: error }, 'Error toggling in-app notifications');
    res.status(500).json({
      success: false,
      message: 'Failed to toggle in-app notifications',
      errors: [error.message]
    });
  }
};
