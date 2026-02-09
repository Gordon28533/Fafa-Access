/**
 * Email Logging Utility
 * 
 * Provides functions to log, retrieve, and audit email notifications
 * Ensures traceability of all email sends for accountability
 */

import { db } from '../db/connection.js';
import { notificationLogs, auditLogs } from '../db/schema/index.js';
import { eq, desc, and, gte, lte, like } from 'drizzle-orm';

/**
 * Log an email send event to notification logs
 * Provides detailed tracking with application reference linkage
 * 
 * @param {Object} params - Logging parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.templateName - Email template name
 * @param {string} params.messageId - Email provider's message ID
 * @param {string} params.provider - Email provider (smtp, sendgrid, resend)
 * @param {string} [params.applicationRef] - Application reference number
 * @param {string} [params.applicationId] - Application UUID
 * @param {string} [params.status] - Send status (success, failed, queued)
 * @param {string} [params.error] - Error message if failed
 * @returns {Promise<Object>} Inserted log record
 */
export async function logEmailSend(params) {
  const {
    to,
    templateName,
    messageId,
    applicationRef,
    applicationId,
    status = 'success',
  } = params;

  try {
    const result = await db.insert(notificationLogs).values({
      recipientId: null,
      recipientRole: 'STUDENT',
      eventName: `email_${templateName}`,
      channel: 'email',
      title: `Email: ${templateName}`,
      message: `Sent to ${to}`,
      messageId,
      status,
      correlationId: applicationRef || null,
      applicationId: applicationId || null,
    }).returning();

    return result[0];
  } catch (logError) {
    console.error('[EmailLogging] Failed to log email send:', logError);
    throw logError;
  }
}

/**
 * Log email send to audit logs for compliance
 * Used for regulatory audit trails and accountability
 * 
 * @param {Object} params - Audit logging parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.templateName - Template name
 * @param {string} params.messageId - Message ID
 * @param {string} params.provider - Email provider
 * @param {string} [params.applicationRef] - Application reference
 * @param {string} [params.status] - Status (success/failed)
 * @param {string} [params.error] - Error details
 * @returns {Promise<Object>} Audit log entry
 */
export async function logEmailAudit(params) {
  const {
    to,
    templateName,
    messageId,
    provider,
    applicationRef,
    status = 'success',
    error,
  } = params;

  try {
    const result = await db.insert(auditLogs).values({
      action: 'EMAIL_SENT',
      actorId: 'system',
      actorRole: 'SYSTEM',
      applicationId: null,
      details: JSON.stringify({
        channel: 'email',
        recipient: to,
        template: templateName,
        messageId,
        provider,
        status,
        error: error || null,
        applicationRef,
        timestamp: new Date().toISOString(),
      }),
    }).returning();

    return result[0];
  } catch (logError) {
    console.error('[EmailLogging] Failed to log email audit:', logError);
    throw logError;
  }
}

/**
 * Get email logs for an application
 * Returns all emails sent related to an application
 * 
 * @param {string} applicationId - Application UUID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Limit results (default: 100)
 * @param {number} [options.offset] - Offset results (default: 0)
 * @returns {Promise<Array>} Notification log records
 */
export async function getEmailLogsForApplication(applicationId, options = {}) {
  const { limit = 100, offset = 0 } = options;

  try {
    const logs = await db.select().from(notificationLogs)
      .where(eq(notificationLogs.applicationId, applicationId))
      .orderBy(desc(notificationLogs.sentAt))
      .limit(limit)
      .offset(offset);

    return logs;
  } catch (error) {
    console.error('[EmailLogging] Failed to get email logs:', error);
    throw error;
  }
}

/**
 * Get email logs by application reference
 * Searches using application reference number (e.g., APP-2024-0001)
 * 
 * @param {string} applicationRef - Application reference number
 * @param {Object} [options] - Query options
 * @returns {Promise<Array>} Audit log records matching the reference
 */
export async function getEmailLogsByReference(applicationRef, options = {}) {
  const { limit = 100, offset = 0 } = options;

  try {
    const logs = await db.select().from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, 'EMAIL_SENT'),
          like(auditLogs.details, `%${applicationRef}%`)
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return logs;
  } catch (error) {
    console.error('[EmailLogging] Failed to get logs by reference:', error);
    throw error;
  }
}

/**
 * Get email logs by recipient
 * Returns all emails sent to a specific email address
 * 
 * @param {string} recipientEmail - Email address
 * @param {Object} [options] - Query options
 * @returns {Promise<Array>} Notification logs for recipient
 */
export async function getEmailLogsByRecipient(recipientEmail, options = {}) {
  const { limit = 100, offset = 0 } = options;

  try {
    const logs = await db.select().from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, 'EMAIL_SENT'),
          like(auditLogs.details, `%${recipientEmail}%`)
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return logs;
  } catch (error) {
    console.error('[EmailLogging] Failed to get logs by recipient:', error);
    throw error;
  }
}

/**
 * Get email logs by template
 * Returns all emails sent using a specific template
 * 
 * @param {string} templateName - Template name (applicationSubmitted, etc.)
 * @param {Object} [options] - Query options
 * @returns {Promise<Array>} Audit logs for template
 */
export async function getEmailLogsByTemplate(templateName, options = {}) {
  const { limit = 100, offset = 0 } = options;

  try {
    const logs = await db.select().from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, 'EMAIL_SENT'),
          like(auditLogs.details, `%${templateName}%`)
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return logs;
  } catch (error) {
    console.error('[EmailLogging] Failed to get logs by template:', error);
    throw error;
  }
}

/**
 * Get email logs in a date range
 * Returns emails sent between two dates
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} [options] - Query options
 * @returns {Promise<Array>} Audit logs in date range
 */
export async function getEmailLogsByDateRange(startDate, endDate, options = {}) {
  const { limit = 100, offset = 0 } = options;

  try {
    const logs = await db.select().from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, 'EMAIL_SENT'),
          gte(auditLogs.timestamp, startDate),
          lte(auditLogs.timestamp, endDate)
        )
      )
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    return logs;
  } catch (error) {
    console.error('[EmailLogging] Failed to get logs by date range:', error);
    throw error;
  }
}

/**
 * Get all unsent/failed emails
 * Returns emails that failed to send
 * 
 * @param {Object} [options] - Query options
 * @returns {Promise<Array>} Failed email records
 */
export async function getFailedEmails(options = {}) {
  const { limit = 100, offset = 0 } = options;

  try {
    const logs = await db.select().from(notificationLogs)
      .where(eq(notificationLogs.status, 'failed'))
      .orderBy(desc(notificationLogs.sentAt))
      .limit(limit)
      .offset(offset);

    return logs;
  } catch (error) {
    console.error('[EmailLogging] Failed to get failed emails:', error);
    throw error;
  }
}

/**
 * Get email send statistics
 * Returns aggregate statistics about email sending
 * 
 * @returns {Promise<Object>} Email statistics
 */
export async function getEmailStatistics() {
  try {
    // Count by channel
    const byChannel = await db.select()
      .from(notificationLogs)
      .where(eq(notificationLogs.channel, 'email'));

    // Count by status
    const byStatus = {
      success: byChannel.filter(log => log.status === 'success').length,
      failed: byChannel.filter(log => log.status === 'failed').length,
      queued: byChannel.filter(log => log.status === 'queued').length,
    };

    // Count by template
    const byTemplate = {};
    byChannel.forEach(log => {
      if (log.eventName.startsWith('email_')) {
        const template = log.eventName.replace('email_', '');
        byTemplate[template] = (byTemplate[template] || 0) + 1;
      }
    });

    return {
      total: byChannel.length,
      byStatus,
      byTemplate,
      successRate: byChannel.length > 0 ? (byStatus.success / byChannel.length * 100).toFixed(2) : 0,
    };
  } catch (error) {
    console.error('[EmailLogging] Failed to get statistics:', error);
    throw error;
  }
}

/**
 * Format email log for display
 * Converts audit log entry to readable format
 * 
 * @param {Object} logEntry - Audit log entry
 * @returns {Object} Formatted log entry
 */
export function formatEmailLog(logEntry) {
  let details = {};
  try {
    details = typeof logEntry.details === 'string'
      ? JSON.parse(logEntry.details)
      : logEntry.details;
  } catch (e) {
    console.warn('[EmailLogging] Failed to parse details:', e);
  }

  return {
    timestamp: logEntry.timestamp,
    recipient: details.recipient || 'Unknown',
    template: details.template || 'Unknown',
    status: details.status || 'Unknown',
    messageId: details.messageId || 'N/A',
    provider: details.provider || 'Unknown',
    applicationRef: details.applicationRef || 'N/A',
    error: details.error || null,
  };
}

/**
 * Export email logs to CSV format
 * Useful for reporting and compliance
 * 
 * @param {Array} logs - Email log entries
 * @returns {string} CSV formatted data
 */
export function exportEmailLogsToCSV(logs) {
  const headers = ['Timestamp', 'Recipient', 'Template', 'Status', 'Message ID', 'Provider', 'Application Ref', 'Error'];
  const rows = logs.map(log => {
    const formatted = formatEmailLog(log);
    return [
      formatted.timestamp,
      formatted.recipient,
      formatted.template,
      formatted.status,
      formatted.messageId,
      formatted.provider,
      formatted.applicationRef,
      formatted.error || '',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Create email log summary report
 * Returns a summary of email activity
 * 
 * @param {Date} [startDate] - Start date (default: 7 days ago)
 * @returns {Promise<Object>} Summary report
 */
export async function getEmailLogSummary(startDate) {
  try {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const logs = await db.select().from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, 'EMAIL_SENT'),
          gte(auditLogs.timestamp, start)
        )
      );

    const summary = {
      period: {
        start: start.toISOString(),
        end: new Date().toISOString(),
      },
      totalEmails: logs.length,
      uniqueRecipients: new Set(logs.map(l => {
        try {
          return JSON.parse(l.details).recipient;
        } catch {
          return null;
        }
      })).size,
      byTemplate: {},
      byStatus: {
        success: 0,
        failed: 0,
      },
      timestamp: new Date().toISOString(),
    };

    logs.forEach(log => {
      try {
        const details = JSON.parse(log.details);
        summary.byTemplate[details.template] = (summary.byTemplate[details.template] || 0) + 1;
        if (details.status === 'success') summary.byStatus.success++;
        else if (details.status === 'failed') summary.byStatus.failed++;
      } catch (e) {
        // Skip malformed entries
      }
    });

    return summary;
  } catch (error) {
    console.error('[EmailLogging] Failed to get summary:', error);
    throw error;
  }
}

export default {
  logEmailSend,
  logEmailAudit,
  getEmailLogsForApplication,
  getEmailLogsByReference,
  getEmailLogsByRecipient,
  getEmailLogsByTemplate,
  getEmailLogsByDateRange,
  getFailedEmails,
  getEmailStatistics,
  formatEmailLog,
  exportEmailLogsToCSV,
  getEmailLogSummary,
};
