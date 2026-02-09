import { db } from '../db/connection.js';
import { auditLogs } from '../db/schema/notifications.js';
import { eq, desc } from 'drizzle-orm';

/**
 * Sensitive action types to be logged
 */
export enum AuditActionType {
  // Application actions
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPLICATION_VIEWED = 'APPLICATION_VIEWED',
  APPLICATION_STATUS_CHANGED = 'APPLICATION_STATUS_CHANGED',

  // SRC Actions
  SRC_APPROVED = 'SRC_APPROVED',
  SRC_REJECTED = 'SRC_REJECTED',
  SRC_DECISION_MADE = 'SRC_DECISION_MADE',

  // Admin Actions
  ADMIN_APPROVED = 'ADMIN_APPROVED',
  ADMIN_REJECTED = 'ADMIN_REJECTED',
  ADMIN_VERIFICATION_REVIEWED = 'ADMIN_VERIFICATION_REVIEWED',

  // Delivery Actions
  DELIVERY_ASSIGNED = 'DELIVERY_ASSIGNED',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
  DELIVERY_COMPLETED = 'DELIVERY_COMPLETED',

  // Payment Actions
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PAYMENT_RECORDED = 'PAYMENT_RECORDED',

  // Laptop Actions
  LAPTOP_CREATED = 'LAPTOP_CREATED',
  LAPTOP_UPDATED = 'LAPTOP_UPDATED',
  LAPTOP_DELETED = 'LAPTOP_DELETED',
  LAPTOP_STOCK_ADJUSTED = 'LAPTOP_STOCK_ADJUSTED',

  // User Actions
  USER_CREATED = 'USER_CREATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_PERMISSION_MODIFIED = 'USER_PERMISSION_MODIFIED',

  // Security Actions
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // System Actions
  EXPORT_DATA = 'EXPORT_DATA',
  DELETE_DATA = 'DELETE_DATA',
}

/**
 * Audit log context with request metadata
 */
export interface AuditContext {
  userId?: string;
  userRole: string;
  ipAddress: string;
  userAgent?: string;
}

/**
 * Audit log metadata
 */
export interface AuditMetadata {
  [key: string]: unknown;
}

/**
 * Create an immutable audit log entry
 * @param action - The action type being logged
 * @param context - User context (actor info, IP, etc.)
 * @param entity - The entity being acted upon (application, laptop, etc.)
 * @param metadata - Additional details about the action
 * @param applicationId - Associated application ID (optional)
 */
export async function logAuditAction(
  action: AuditActionType,
  context: AuditContext,
  entity: string,
  metadata: AuditMetadata = {},
  applicationId?: string
): Promise<void> {
  try {
    const details = {
      entity,
      action,
      ...metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString(),
    };

    await db.insert(auditLogs).values({
      action,
      actorId: context.userId || 'ANONYMOUS',
      actorRole: context.userRole,
      details: JSON.stringify(details),
      timestamp: new Date(),
      applicationId,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuditLog]', {
        action,
        actor: `${context.userRole}(${context.userId})`,
        entity,
        ip: context.ipAddress,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    // Critical: Audit log failures should not crash the application
    // but should be logged for investigation
    console.error('[AuditLogError] Failed to log audit action:', {
      action,
      error: (error as Error).message,
    });
  }
}

/**
 * Log application submission
 */
export async function logApplicationSubmission(
  studentId: string,
  applicationId: string,
  laptopId: string,
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  await logAuditAction(
    AuditActionType.APPLICATION_SUBMITTED,
    { ...context, userRole: 'STUDENT' },
    'APPLICATION',
    {
      studentId,
      laptopId,
      action: 'Student submitted laptop application',
      ...metadata,
    },
    applicationId
  );
}

/**
 * Log SRC decision
 */
export async function logSrcDecision(
  srcOfficerId: string,
  applicationId: string,
  decision: 'APPROVED' | 'REJECTED',
  reason: string,
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  const actionType = decision === 'APPROVED' ? AuditActionType.SRC_APPROVED : AuditActionType.SRC_REJECTED;

  await logAuditAction(
    actionType,
    { ...context, userRole: 'SRC' },
    'APPLICATION',
    {
      srcOfficerId,
      decision,
      reason,
      action: `SRC Officer ${decision.toLowerCase()} application`,
      ...metadata,
    },
    applicationId
  );
}

/**
 * Log admin decision
 */
export async function logAdminDecision(
  adminId: string,
  applicationId: string,
  decision: 'APPROVED' | 'REJECTED',
  reason: string,
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  const actionType = decision === 'APPROVED' ? AuditActionType.ADMIN_APPROVED : AuditActionType.ADMIN_REJECTED;

  await logAuditAction(
    actionType,
    { ...context, userRole: 'ADMIN' },
    'APPLICATION',
    {
      adminId,
      decision,
      reason,
      action: `Admin ${decision.toLowerCase()} application`,
      ...metadata,
    },
    applicationId
  );
}

/**
 * Log delivery assignment
 */
export async function logDeliveryAssignment(
  deliveryPersonId: string,
  applicationId: string,
  deliveryLocation: string,
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  await logAuditAction(
    AuditActionType.DELIVERY_ASSIGNED,
    { ...context, userRole: 'ADMIN' },
    'DELIVERY',
    {
      deliveryPersonId,
      deliveryLocation,
      action: 'Delivery person assigned to application',
      ...metadata,
    },
    applicationId
  );
}

/**
 * Log delivery confirmation
 */
export async function logDeliveryConfirmation(
  deliveryPersonId: string,
  applicationId: string,
  deliveryDate: string,
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  await logAuditAction(
    AuditActionType.DELIVERY_CONFIRMED,
    { ...context, userRole: 'DELIVERY' },
    'DELIVERY',
    {
      deliveryPersonId,
      deliveryDate,
      action: 'Delivery confirmed',
      ...metadata,
    },
    applicationId
  );
}

/**
 * Log payment confirmation
 */
export async function logPaymentConfirmation(
  applicationId: string,
  paymentAmount: number,
  paymentType: string,
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  await logAuditAction(
    AuditActionType.PAYMENT_CONFIRMED,
    context,
    'PAYMENT',
    {
      paymentAmount,
      paymentType,
      action: 'Payment confirmed',
      ...metadata,
    },
    applicationId
  );
}

/**
 * Log laptop action
 */
export async function logLaptopAction(
  laptopId: string,
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STOCK_ADJUSTED',
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  let auditAction: AuditActionType;

  switch (actionType) {
    case 'CREATE':
      auditAction = AuditActionType.LAPTOP_CREATED;
      break;
    case 'UPDATE':
      auditAction = AuditActionType.LAPTOP_UPDATED;
      break;
    case 'DELETE':
      auditAction = AuditActionType.LAPTOP_DELETED;
      break;
    case 'STOCK_ADJUSTED':
      auditAction = AuditActionType.LAPTOP_STOCK_ADJUSTED;
      break;
  }

  await logAuditAction(
    auditAction,
    { ...context, userRole: 'ADMIN' },
    'LAPTOP',
    {
      laptopId,
      action: `Laptop ${actionType.toLowerCase()}`,
      ...metadata,
    }
  );
}

/**
 * Log user action
 */
export async function logUserAction(
  targetUserId: string,
  actionType: 'CREATE' | 'ROLE_CHANGED' | 'PERMISSION_MODIFIED',
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  let auditAction: AuditActionType;

  switch (actionType) {
    case 'CREATE':
      auditAction = AuditActionType.USER_CREATED;
      break;
    case 'ROLE_CHANGED':
      auditAction = AuditActionType.USER_ROLE_CHANGED;
      break;
    case 'PERMISSION_MODIFIED':
      auditAction = AuditActionType.USER_PERMISSION_MODIFIED;
      break;
  }

  await logAuditAction(
    auditAction,
    context,
    'USER',
    {
      targetUserId,
      action: `User ${actionType.toLowerCase()}`,
      ...metadata,
    }
  );
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  eventType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_RESET',
  userId: string,
  context: AuditContext,
  metadata: AuditMetadata = {}
): Promise<void> {
  let auditAction: AuditActionType;

  switch (eventType) {
    case 'LOGIN_SUCCESS':
      auditAction = AuditActionType.LOGIN_SUCCESS;
      break;
    case 'LOGIN_FAILED':
      auditAction = AuditActionType.LOGIN_FAILED;
      break;
    case 'LOGOUT':
      auditAction = AuditActionType.LOGOUT;
      break;
    case 'PASSWORD_RESET':
      auditAction = AuditActionType.PASSWORD_RESET;
      break;
  }

  await logAuditAction(
    auditAction,
    { ...context, userRole: 'SYSTEM' },
    'SECURITY',
    {
      userId,
      action: `Security event: ${eventType}`,
      ...metadata,
    }
  );
}

/**
 * Retrieve audit logs for an application
 */
export async function getApplicationAuditLogs(applicationId: string, limit: number = 50) {
  try {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.applicationId, applicationId as string))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return [];
  }
}

/**
 * Retrieve audit logs by actor
 */
export async function getActorAuditLogs(actorId: string, limit: number = 50) {
  try {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.actorId, actorId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return [];
  }
}

/**
 * Retrieve audit logs by action type
 */
export async function getAuditLogsByAction(action: AuditActionType, limit: number = 50) {
  try {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, action))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return [];
  }
}

/**
 * Retrieve all audit logs (admin only)
 */
export async function getAllAuditLogs(limit: number = 100) {
  try {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    return [];
  }
}

/**
 * Parse audit log details (JSON string to object)
 */
export function parseAuditDetails(auditLog: Record<string, unknown>) {
  try {
    return {
      ...auditLog,
      details: typeof auditLog.details === 'string' ? JSON.parse(auditLog.details as string) : auditLog.details,
    };
  } catch (error) {
    console.error('Failed to parse audit details:', error);
    return auditLog;
  }
}
