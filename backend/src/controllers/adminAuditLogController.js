/**
 * Admin Audit Logs Controller
 * Provides read-only access to audit logs for administrators
 */

import { db } from '../db/connection.js';
import { auditLogs } from '../db/schema/notifications.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { logger } from '../observability.js';

/**
 * GET /api/admin/audit-logs
 * Retrieve audit logs with optional filters
 * Query params: actorId, actorRole, action, applicationId, startDate, endDate, limit, offset
 */
export const getAuditLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only ADMIN can access audit logs
    if (userRole !== 'ADMIN') {
      logger.warn({ userId, userRole }, 'Non-admin attempted to access audit logs');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only administrators can access audit logs']
      });
    }

    const {
      actorId,
      actorRole,
      action,
      applicationId,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;

    // Build query conditions
    const conditions = [];
    
    if (actorId) {
      conditions.push(eq(auditLogs.actorId, actorId));
    }
    if (actorRole) {
      conditions.push(eq(auditLogs.actorRole, actorRole));
    }
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }
    if (applicationId) {
      conditions.push(eq(auditLogs.applicationId, applicationId));
    }
    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(endDate)));
    }

    // Get total count
    const countResult = await db
      .select({ count: db.raw('COUNT(*)::int') })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = countResult[0]?.count || 0;

    // Get paginated logs
    let query = db.select().from(auditLogs);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const logs = await query
      .orderBy(desc(auditLogs.timestamp))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    logger.info({ userId, filters: { actorId, actorRole, action, applicationId } }, 'Audit logs retrieved');

    res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + logs.length < total
        }
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error retrieving audit logs');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/admin/audit-logs/application/:id
 * Get all audit logs for a specific application
 */
export const getApplicationAuditLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Only ADMIN can access audit logs
    if (userRole !== 'ADMIN') {
      logger.warn({ userId, userRole }, 'Non-admin attempted to access application audit logs');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only administrators can access audit logs']
      });
    }

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.applicationId, id))
      .orderBy(desc(auditLogs.timestamp));

    logger.info({ userId, applicationId: id }, 'Application audit logs retrieved');

    res.json({
      success: true,
      message: 'Application audit logs retrieved successfully',
      data: {
        logs,
        total: logs.length
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error retrieving application audit logs');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve application audit logs',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/admin/audit-logs/recent
 * Get recent audit logs (last 24 hours by default)
 */
export const getRecentAuditLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only ADMIN can access audit logs
    if (userRole !== 'ADMIN') {
      logger.warn({ userId, userRole }, 'Non-admin attempted to access recent audit logs');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only administrators can access audit logs']
      });
    }

    const { hours = 24, limit = 50 } = req.query;
    const hoursInt = parseInt(hours);
    const limitInt = parseInt(limit);

    // Calculate timestamp for X hours ago
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hoursInt);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, hoursAgo))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limitInt);

    logger.info({ userId, hours: hoursInt, limit: limitInt }, 'Recent audit logs retrieved');

    res.json({
      success: true,
      message: 'Recent audit logs retrieved successfully',
      data: {
        logs,
        total: logs.length,
        hours: hoursInt
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error retrieving recent audit logs');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent audit logs',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/admin/audit-logs/stats
 * Get audit log statistics
 */
export const getAuditLogStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only ADMIN can access audit logs
    if (userRole !== 'ADMIN') {
      logger.warn({ userId, userRole }, 'Non-admin attempted to access audit log stats');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only administrators can access audit log statistics']
      });
    }

    const { startDate, endDate } = req.query;

    // Build query conditions
    const conditions = [];
    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(endDate)));
    }

    // Get stats grouped by action
    const stats = await db
      .select({
        action: auditLogs.action,
        count: db.raw('COUNT(*)::int'),
        lastOccurrence: db.raw('MAX(timestamp)')
      })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(auditLogs.action)
      .orderBy(desc(db.raw('COUNT(*)')));

    logger.info({ userId, startDate, endDate }, 'Audit log stats retrieved');

    res.json({
      success: true,
      message: 'Audit log statistics retrieved successfully',
      data: {
        stats,
        total: stats.reduce((sum, s) => sum + s.count, 0)
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error retrieving audit log stats');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit log statistics',
      errors: [error.message]
    });
  }
};

