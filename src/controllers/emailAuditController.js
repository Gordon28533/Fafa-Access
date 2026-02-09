/**
 * Email Audit Logs Controller
 * Read-only endpoint for viewing email notification history
 * Provides accountability and traceability of all email sends
 */

import { Router } from 'express';
import { authorizeRole } from '../middleware/auth.js';
import {
  getEmailLogsForApplication,
  getEmailLogsByReference,
  getEmailLogsByRecipient,
  getEmailLogsByTemplate,
  getEmailLogsByDateRange,
  getFailedEmails,
  getEmailStatistics,
  getEmailLogSummary,
  formatEmailLog,
  exportEmailLogsToCSV,
} from '../services/emailLogging.js';

const router = Router();

/**
 * GET /api/audit/emails/application/:applicationId
 * Get all email logs for an application
 * Access: ADMIN, SRC (read-only)
 */
router.get('/application/:applicationId', authorizeRole(['ADMIN', 'SRC']), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await getEmailLogsForApplication(applicationId, {
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: logs.map(formatEmailLog),
      count: logs.length,
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email logs',
    });
  }
});

/**
 * GET /api/audit/emails/reference/:applicationRef
 * Get emails by application reference number
 * Access: ADMIN, SRC (read-only)
 */
router.get('/reference/:applicationRef', authorizeRole(['ADMIN', 'SRC']), async (req, res) => {
  try {
    const { applicationRef } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await getEmailLogsByReference(applicationRef, {
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: logs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: JSON.parse(log.details || '{}'),
      })),
      count: logs.length,
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email logs',
    });
  }
});

/**
 * GET /api/audit/emails/recipient/:email
 * Get all emails sent to a specific recipient
 * Access: ADMIN only (privacy-sensitive)
 */
router.get('/recipient/:email', authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { email } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await getEmailLogsByRecipient(email, {
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: logs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: JSON.parse(log.details || '{}'),
      })),
      count: logs.length,
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email logs',
    });
  }
});

/**
 * GET /api/audit/emails/template/:templateName
 * Get emails sent using a specific template
 * Access: ADMIN, SRC (read-only)
 */
router.get('/template/:templateName', authorizeRole(['ADMIN', 'SRC']), async (req, res) => {
  try {
    const { templateName } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await getEmailLogsByTemplate(templateName, {
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: logs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: JSON.parse(log.details || '{}'),
      })),
      count: logs.length,
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email logs',
    });
  }
});

/**
 * GET /api/audit/emails/date-range
 * Get emails sent in a date range
 * Query params: startDate, endDate (ISO format)
 * Access: ADMIN only (reporting)
 */
router.get('/date-range', authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { startDate, endDate, limit = 100, offset = 0 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format (use ISO 8601)',
      });
    }

    const logs = await getEmailLogsByDateRange(start, end, {
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: logs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: JSON.parse(log.details || '{}'),
      })),
      count: logs.length,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email logs',
    });
  }
});

/**
 * GET /api/audit/emails/failed
 * Get all failed email sends
 * Access: ADMIN only
 */
router.get('/failed', authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await getFailedEmails({
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email logs',
    });
  }
});

/**
 * GET /api/audit/emails/statistics
 * Get email sending statistics
 * Access: ADMIN, FINANCE
 */
router.get('/statistics', authorizeRole(['ADMIN', 'FINANCE']), async (req, res) => {
  try {
    const stats = await getEmailStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email statistics',
    });
  }
});

/**
 * GET /api/audit/emails/summary
 * Get email activity summary
 * Access: ADMIN
 */
router.get('/summary', authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { startDate } = req.query;
    const start = startDate ? new Date(startDate) : undefined;

    const summary = await getEmailLogSummary(start);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email summary',
    });
  }
});

/**
 * GET /api/audit/emails/export
 * Export email logs as CSV
 * Query params: application_ref (optional filter)
 * Access: ADMIN only
 */
router.get('/export', authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { applicationRef } = req.query;

    let logs;
    if (applicationRef) {
      logs = await getEmailLogsByReference(applicationRef, { limit: 1000 });
    } else {
      logs = await getEmailLogsByDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(),
        { limit: 1000 }
      );
    }

    const csv = exportEmailLogsToCSV(logs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=email-logs-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('[EmailAudit] Failed to export logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export email logs',
    });
  }
});

/**
 * GET /api/audit/emails/count
 * Get email count by status and template
 * Access: ADMIN, SRC
 */
router.get('/count', authorizeRole(['ADMIN', 'SRC']), async (req, res) => {
  try {
    const stats = await getEmailStatistics();

    res.json({
      success: true,
      data: {
        total: stats.total,
        byStatus: stats.byStatus,
        byTemplate: stats.byTemplate,
        successRate: stats.successRate,
      },
    });
  } catch (error) {
    console.error('[EmailAudit] Failed to get count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email count',
    });
  }
});

export default router;
