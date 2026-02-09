/**
 * Audit Logging Utility
 * Provides helper functions to log critical system actions
 */

import { db } from '../db/connection.js';
import { auditLogs } from '../db/schema/notifications.js';
import { logger } from '../observability.js';

/**
 * Action Types for Audit Logging
 */
export const AUDIT_ACTIONS = {
  // Application Actions
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  APPLICATION_UPDATED: 'APPLICATION_UPDATED',
  APPLICATION_DELETED: 'APPLICATION_DELETED',
  APPLICATION_SRC_APPROVED: 'APPLICATION_SRC_APPROVED',
  APPLICATION_SRC_REJECTED: 'APPLICATION_SRC_REJECTED',
  APPLICATION_ADMIN_APPROVED: 'APPLICATION_ADMIN_APPROVED',
  APPLICATION_ADMIN_REJECTED: 'APPLICATION_ADMIN_REJECTED',
  
  // Payment Actions
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_VERIFIED: 'PAYMENT_VERIFIED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_STATUS_CHANGED: 'PAYMENT_STATUS_CHANGED',
  
  // Delivery Actions
  DELIVERY_CREATED: 'DELIVERY_CREATED',
  DELIVERY_ASSIGNED: 'DELIVERY_ASSIGNED',
  DELIVERY_COMPLETED: 'DELIVERY_COMPLETED',
  DELIVERY_STATUS_CHANGED: 'DELIVERY_STATUS_CHANGED',
  
  // Admin Actions
  ADMIN_USER_CREATED: 'ADMIN_USER_CREATED',
  ADMIN_USER_UPDATED: 'ADMIN_USER_UPDATED',
  ADMIN_USER_DELETED: 'ADMIN_USER_DELETED',
  ADMIN_ROLE_CHANGED: 'ADMIN_ROLE_CHANGED',
  ADMIN_UNIVERSITY_CREATED: 'ADMIN_UNIVERSITY_CREATED',
  ADMIN_UNIVERSITY_UPDATED: 'ADMIN_UNIVERSITY_UPDATED',
  ADMIN_LAPTOP_CREATED: 'ADMIN_LAPTOP_CREATED',
  ADMIN_LAPTOP_UPDATED: 'ADMIN_LAPTOP_UPDATED',
  ADMIN_LAPTOP_DELETED: 'ADMIN_LAPTOP_DELETED',
  
  // SRC Actions
  SRC_INVITATION_SENT: 'SRC_INVITATION_SENT',
  SRC_INVITATION_ACCEPTED: 'SRC_INVITATION_ACCEPTED',
  SRC_OFFICER_REMOVED: 'SRC_OFFICER_REMOVED',
  
  // Document Actions
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_VIEWED: 'DOCUMENT_VIEWED',
  DOCUMENT_DELETED: 'DOCUMENT_DELETED',
  
  // Security Actions
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  
  // Export Actions
  DATA_EXPORTED: 'DATA_EXPORTED',
};

/**
 * Log an audit event
 * 
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - Action type from AUDIT_ACTIONS
 * @param {string} params.actorId - User ID performing the action
 * @param {string} params.actorRole - Role of the actor (ADMIN, SRC, STUDENT, DELIVERY_STAFF)
 * @param {string} params.details - JSON string or plain text description of the action
 * @param {string} [params.applicationId] - Related application ID (optional)
 * @returns {Promise<Object>} The created audit log entry
 */
export async function logAudit({ action, actorId, actorRole, details, applicationId = null }) {
  try {
    // Ensure details is a string
    const detailsString = typeof details === 'object' 
      ? JSON.stringify(details) 
      : String(details);

    const [auditLog] = await db
      .insert(auditLogs)
      .values({
        action,
        actorId,
        actorRole,
        details: detailsString,
        applicationId,
      })
      .returning();

    logger.info({
      action,
      actorId,
      actorRole,
      applicationId,
    }, 'Audit log created');

    return auditLog;
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main flow
    logger.error({
      err: error,
      action,
      actorId,
      actorRole,
    }, 'Failed to create audit log');
    
    return null;
  }
}

/**
 * Log application status change
 */
export async function logApplicationStatusChange({ 
  applicationId, 
  actorId, 
  actorRole, 
  oldStatus, 
  newStatus, 
  comment 
}) {
  const action = actorRole === 'SRC' 
    ? (newStatus.includes('APPROVED') ? AUDIT_ACTIONS.APPLICATION_SRC_APPROVED : AUDIT_ACTIONS.APPLICATION_SRC_REJECTED)
    : (newStatus.includes('APPROVED') ? AUDIT_ACTIONS.APPLICATION_ADMIN_APPROVED : AUDIT_ACTIONS.APPLICATION_ADMIN_REJECTED);

  return await logAudit({
    action,
    actorId,
    actorRole,
    details: JSON.stringify({
      applicationId,
      oldStatus,
      newStatus,
      comment: comment || 'No comment provided',
      timestamp: new Date().toISOString(),
    }),
    applicationId,
  });
}

/**
 * Log payment action
 */
export async function logPayment({ 
  action, 
  paymentId, 
  applicationId, 
  actorId, 
  actorRole, 
  amount, 
  paymentType, 
  status, 
  additionalDetails = {} 
}) {
  return await logAudit({
    action,
    actorId,
    actorRole,
    details: JSON.stringify({
      paymentId,
      applicationId,
      amount,
      paymentType,
      status,
      ...additionalDetails,
      timestamp: new Date().toISOString(),
    }),
    applicationId,
  });
}

/**
 * Log delivery action
 */
export async function logDelivery({ 
  action, 
  deliveryId, 
  applicationId, 
  actorId, 
  actorRole, 
  deliveredBy, 
  status, 
  additionalDetails = {} 
}) {
  return await logAudit({
    action,
    actorId,
    actorRole,
    details: JSON.stringify({
      deliveryId,
      applicationId,
      deliveredBy,
      status,
      ...additionalDetails,
      timestamp: new Date().toISOString(),
    }),
    applicationId,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction({ 
  action, 
  actorId, 
  targetId, 
  targetType, 
  details 
}) {
  return await logAudit({
    action,
    actorId,
    actorRole: 'ADMIN',
    details: JSON.stringify({
      targetId,
      targetType,
      ...details,
      timestamp: new Date().toISOString(),
    }),
  });
}

/**
 * Log SRC action
 */
export async function logSRCAction({ 
  action, 
  actorId, 
  applicationId, 
  details 
}) {
  return await logAudit({
    action,
    actorId,
    actorRole: 'SRC',
    details: JSON.stringify({
      ...details,
      timestamp: new Date().toISOString(),
    }),
    applicationId,
  });
}

/**
 * Log data export action
 */
export async function logDataExport({ 
  actorId, 
  actorRole, 
  exportType, 
  format, 
  filters 
}) {
  return await logAudit({
    action: AUDIT_ACTIONS.DATA_EXPORTED,
    actorId,
    actorRole,
    details: JSON.stringify({
      exportType,
      format,
      filters,
      timestamp: new Date().toISOString(),
    }),
  });
}

export default {
  logAudit,
  logApplicationStatusChange,
  logPayment,
  logDelivery,
  logAdminAction,
  logSRCAction,
  logDataExport,
  AUDIT_ACTIONS,
};
