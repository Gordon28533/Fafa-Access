/**
 * authorizationHelpers.js
 * 
 * Comprehensive authorization helper module for strict university-level
 * and status-transition enforcement.
 * 
 * Provides reusable functions for:
 * - University-level access verification (SRC can only access their university)
 * - Application status transition validation (enforce valid transitions)
 * - Ownership verification (students can only access their own applications)
 * - Role-specific data access patterns
 */

import { db } from '../db/connection.js';
import { 
  srcOfficers, 
  studentProfiles, 
  applications,
  applicationStatusHistory
} from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { logAuthFailure } from '../observability.js';

// ============================================================================
// VALID STATUS TRANSITIONS
// ============================================================================

const VALID_STATUS_TRANSITIONS = {
  // Initial submission state
  'PENDING_SRC': [
    'SRC_APPROVED',      // SRC approves
    'SRC_REJECTED',      // SRC rejects
  ],
  
  // SRC approved - ready for admin
  'SRC_APPROVED': [
    'ADMIN_APPROVED',    // Admin approves
    'ADMIN_REJECTED',    // Admin rejects
    'PENDING_SRC',       // SRC can revert if needed
  ],
  
  // SRC rejected - application dead
  'SRC_REJECTED': [
    // Cannot transition from rejected unless manually reset by admin
  ],
  
  // Admin approved - ready for delivery
  'ADMIN_APPROVED': [
    'DELIVERY_ASSIGNED', // Assign delivery
    'ADMIN_REJECTED',    // Admin can change mind
  ],
  
  // Admin rejected - application dead
  'ADMIN_REJECTED': [
    // Cannot transition from rejected unless manually reset by admin
  ],
  
  // Delivery assigned
  'DELIVERY_ASSIGNED': [
    'DELIVERED',         // Mark as delivered
    'ADMIN_APPROVED',    // Can revert to previous state
  ],
  
  // Delivered - marking as complete
  'DELIVERED': [
    'COMPLETED',         // Final completion
    'DELIVERY_ASSIGNED', // Revert if issue with delivery
  ],
  
  // Final state
  'COMPLETED': [
    // Cannot transition from completed
  ],
};

// Who can trigger each transition (by role)
const ROLE_TRANSITION_PERMISSIONS = {
  'PENDING_SRC → SRC_APPROVED': ['SRC', 'ADMIN'],
  'PENDING_SRC → SRC_REJECTED': ['SRC', 'ADMIN'],
  'SRC_APPROVED → ADMIN_APPROVED': ['ADMIN'],
  'SRC_APPROVED → ADMIN_REJECTED': ['ADMIN'],
  'SRC_APPROVED → PENDING_SRC': ['ADMIN'],
  'ADMIN_APPROVED → DELIVERY_ASSIGNED': ['ADMIN', 'DELIVERY'],
  'ADMIN_APPROVED → ADMIN_REJECTED': ['ADMIN'],
  'DELIVERY_ASSIGNED → DELIVERED': ['DELIVERY', 'ADMIN'],
  'DELIVERY_ASSIGNED → ADMIN_APPROVED': ['ADMIN'],
  'DELIVERED → COMPLETED': ['ADMIN'],
  'DELIVERED → DELIVERY_ASSIGNED': ['ADMIN'],
};

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Verify that SRC officer can access a specific university
 * 
 * @param {string} userId - User ID of the SRC officer
 * @param {string} universityId - University ID to access
 * @returns {Promise<{allowed: boolean, error?: string, universityId?: string}>}
 */
export async function verifySRCUniversityAccess(userId, universityId) {
  try {
    const srcOfficer = await db
      .select()
      .from(srcOfficers)
      .where(eq(srcOfficers.userId, userId))
      .limit(1);

    if (!srcOfficer.length) {
      return {
        allowed: false,
        error: 'SRC officer profile not found'
      };
    }

    const officer = srcOfficer[0];

    // SRC can only access their assigned university
    if (officer.universityId !== universityId) {
      logAuthFailure({
        action: 'UNAUTHORIZED_UNIVERSITY_ACCESS',
        userId,
        resourceType: 'university',
        resourceId: universityId,
        attemptedUniversity: universityId,
        authorizedUniversity: officer.universityId,
        reason: 'SRC attempted to access different university'
      });

      return {
        allowed: false,
        error: 'Not authorized to access this university'
      };
    }

    return {
      allowed: true,
      universityId: officer.universityId
    };
  } catch (error) {
    console.error('Error verifying SRC university access:', error);
    return {
      allowed: false,
      error: 'Authorization check failed'
    };
  }
}

/**
 * Verify that a student can access their own application
 * 
 * @param {string} studentId - Student ID
 * @param {string} applicationId - Application ID to access
 * @returns {Promise<{allowed: boolean, error?: string, application?: object}>}
 */
export async function verifyStudentApplicationAccess(studentId, applicationId) {
  try {
    const application = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.id, applicationId),
          eq(applications.studentId, studentId)
        )
      )
      .limit(1);

    if (!application.length) {
      logAuthFailure({
        action: 'UNAUTHORIZED_APPLICATION_ACCESS',
        userId: studentId,
        resourceType: 'application',
        resourceId: applicationId,
        reason: 'Student attempted to access application they do not own'
      });

      return {
        allowed: false,
        error: 'Application not found or not owned by this student'
      };
    }

    return {
      allowed: true,
      application: application[0]
    };
  } catch (error) {
    console.error('Error verifying student application access:', error);
    return {
      allowed: false,
      error: 'Authorization check failed'
    };
  }
}

/**
 * Verify that SRC can access an application (must be from their university)
 * 
 * @param {string} srcUserId - User ID of SRC officer
 * @param {string} applicationId - Application ID to access
 * @returns {Promise<{allowed: boolean, error?: string, application?: object}>}
 */
export async function verifySRCApplicationAccess(srcUserId, applicationId) {
  try {
    // Get SRC's university
    const srcOfficer = await db
      .select()
      .from(srcOfficers)
      .where(eq(srcOfficers.userId, srcUserId))
      .limit(1);

    if (!srcOfficer.length) {
      return {
        allowed: false,
        error: 'SRC officer profile not found'
      };
    }

    const officerUniversityId = srcOfficer[0].universityId;

    // Get application with student university info
    const application = await db
      .select({
        application: applications,
        studentUniversityId: studentProfiles.universityId
      })
      .from(applications)
      .innerJoin(
        studentProfiles,
        eq(applications.studentId, studentProfiles.id)
      )
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application.length) {
      return {
        allowed: false,
        error: 'Application not found'
      };
    }

    const appRecord = application[0];

    // SRC can only access applications from their university
    if (appRecord.studentUniversityId !== officerUniversityId) {
      logAuthFailure({
        action: 'UNAUTHORIZED_APPLICATION_ACCESS',
        userId: srcUserId,
        resourceType: 'application',
        resourceId: applicationId,
        srcUniversity: officerUniversityId,
        applicationUniversity: appRecord.studentUniversityId,
        reason: 'SRC attempted to access application from different university'
      });

      return {
        allowed: false,
        error: 'Not authorized to access applications from this university'
      };
    }

    return {
      allowed: true,
      application: appRecord.application
    };
  } catch (error) {
    console.error('Error verifying SRC application access:', error);
    return {
      allowed: false,
      error: 'Authorization check failed'
    };
  }
}

/**
 * Validate if a status transition is valid
 * 
 * @param {string} currentStatus - Current application status
 * @param {string} newStatus - Desired new status
 * @param {string} userRole - Role of user attempting transition
 * @returns {{valid: boolean, error?: string}}
 */
export function validateStatusTransition(currentStatus, newStatus, userRole) {
  // Check if current status has valid transitions
  if (!VALID_STATUS_TRANSITIONS[currentStatus]) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}`
    };
  }

  // Check if transition is in the allowed list
  if (!VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  // Check if user has permission for this transition
  const transitionKey = `${currentStatus} → ${newStatus}`;
  const allowedRoles = ROLE_TRANSITION_PERMISSIONS[transitionKey];

  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return {
      valid: false,
      error: `${userRole} role cannot perform transition: ${transitionKey}`
    };
  }

  return { valid: true };
}

/**
 * Get allowed next statuses for current status
 * 
 * @param {string} currentStatus - Current application status
 * @returns {string[]} Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus) {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Get roles that can perform a specific transition
 * 
 * @param {string} currentStatus - Current status
 * @param {string} newStatus - Desired new status
 * @returns {string[]} Array of roles that can perform transition
 */
export function getRolesForTransition(currentStatus, newStatus) {
  const transitionKey = `${currentStatus} → ${newStatus}`;
  return ROLE_TRANSITION_PERMISSIONS[transitionKey] || [];
}

/**
 * Log application status transition
 * 
 * @param {string} applicationId - Application ID
 * @param {string} previousStatus - Previous status
 * @param {string} newStatus - New status
 * @param {string} changedBy - User ID who made the change
 * @param {object} metadata - Additional metadata
 */
export async function logStatusTransition(
  applicationId,
  previousStatus,
  newStatus,
  changedBy,
  metadata = {}
) {
  try {
    await db.insert(applicationStatusHistory).values({
      applicationId,
      previousStatus,
      status: newStatus,
      changedBy,
      metadata: JSON.stringify(metadata),
      changedAt: new Date()
    });

    // Log audit trail - Status change is successful, no need to log as failure
    // This would typically go to a separate audit log
    console.log('Status transition:', {
      action: 'APPLICATION_STATUS_CHANGED',
      userId: changedBy,
      resourceType: 'application',
      resourceId: applicationId,
      from: previousStatus,
      to: newStatus,
      ...metadata
    });
  } catch (error) {
    console.error('Error logging status transition:', error);
    throw error;
  }
}

/**
 * Get application status history
 * 
 * @param {string} applicationId - Application ID
 * @returns {Promise<object[]>} Array of status changes
 */
export async function getApplicationStatusHistory(applicationId) {
  try {
    const history = await db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId));

    return history;
  } catch (error) {
    console.error('Error getting application status history:', error);
    throw error;
  }
}

/**
 * Verify that admin can access a resource
 * Admins have access to everything by default
 * 
 * @returns {Promise<{allowed: boolean}>}
 */
export async function verifyAdminAccess() {
  // All admins currently have full access
  return {
    allowed: true
  };
}

/**
 * Comprehensive authorization check for application operations
 * 
 * @param {object} context - Authorization context
 * @param {string} context.userId - User ID
 * @param {string} context.userRole - User role
 * @param {string} context.applicationId - Application ID
 * @param {string} context.operation - Operation being performed (e.g., 'review', 'approve', 'view')
 * @returns {Promise<{allowed: boolean, error?: string, application?: object}>}
 */
export async function checkApplicationAuthorization(context) {
  const { userId, userRole, applicationId, operation } = context;

  try {
    // Get application with related data
    const appRecord = await db
      .select({
        application: applications,
        studentUniversityId: studentProfiles.universityId
      })
      .from(applications)
      .innerJoin(
        studentProfiles,
        eq(applications.studentId, studentProfiles.id)
      )
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!appRecord.length) {
      return {
        allowed: false,
        error: 'Application not found'
      };
    }

    const app = appRecord[0].application;
    const studentUniversityId = appRecord[0].studentUniversityId;

    // Role-based authorization
    switch (userRole) {
      case 'STUDENT': {
        // Students can only view/manage their own applications
        if (app.studentId !== userId) {
          return {
            allowed: false,
            error: 'Cannot access another student\'s application'
          };
        }
        // Students can only view, not modify
        if (!['view', 'check_status'].includes(operation)) {
          return {
            allowed: false,
            error: 'Students cannot perform this operation'
          };
        }
        return { allowed: true, application: app };
      }

      case 'SRC': {
        // SRC can only access applications from their university
        const srcCheck = await verifySRCUniversityAccess(userId, studentUniversityId);
        if (!srcCheck.allowed) {
          return srcCheck;
        }
        // SRC can review and approve/reject
        if (!['view', 'review', 'approve', 'reject', 'check_status'].includes(operation)) {
          return {
            allowed: false,
            error: 'SRC cannot perform this operation'
          };
        }
        return { allowed: true, application: app };
      }

      case 'ADMIN': {
        // Admins have full access
        if (!['view', 'review', 'approve', 'reject', 'assign_delivery', 'check_status', 'modify', 'cancel'].includes(operation)) {
          return {
            allowed: false,
            error: 'Invalid operation'
          };
        }
        return { allowed: true, application: app };
      }

      case 'DELIVERY': {
        // Delivery personnel can only view and mark as delivered
        if (!['view', 'mark_delivered', 'check_status'].includes(operation)) {
          return {
            allowed: false,
            error: 'Delivery can only mark applications as delivered'
          };
        }
        // Delivery can only interact with assigned deliveries
        if (app.status !== 'DELIVERY_ASSIGNED' && operation === 'mark_delivered') {
          return {
            allowed: false,
            error: 'Application is not in DELIVERY_ASSIGNED status'
          };
        }
        return { allowed: true, application: app };
      }

      default:
        return {
          allowed: false,
          error: 'Unknown user role'
        };
    }
  } catch (error) {
    console.error('Error checking application authorization:', error);
    return {
      allowed: false,
      error: 'Authorization check failed'
    };
  }
}

/**
 * Middleware to protect routes with comprehensive authorization
 * 
 * @param {string} operation - Operation being protected (e.g., 'review', 'approve')
 * @param {string[]} allowedRoles - Array of allowed roles (optional, if not provided uses operation defaults)
 * @returns {Function} Express middleware
 */
export function authorizeApplication(operation, allowedRoles = null) {
  return async (req, res, next) => {
    try {
      const { applicationId } = req.params;
      const { userId, role } = req.user;

      // Check if user role is allowed
      if (allowedRoles && !allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `This operation requires one of: ${allowedRoles.join(', ')}`
        });
      }

      // Perform comprehensive authorization check
      const authCheck = await checkApplicationAuthorization({
        userId,
        userRole: role,
        applicationId,
        operation
      });

      if (!authCheck.allowed) {
        logAuthFailure({
          action: 'UNAUTHORIZED_OPERATION',
          userId,
          resourceType: 'application',
          resourceId: applicationId,
          operation,
          error: authCheck.error
        });

        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: authCheck.error
        });
      }

      // Attach application to request for use in handler
      req.application = authCheck.application;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed'
      });
    }
  };
}

export default {
  verifySRCUniversityAccess,
  verifyStudentApplicationAccess,
  verifySRCApplicationAccess,
  validateStatusTransition,
  getValidNextStatuses,
  getRolesForTransition,
  logStatusTransition,
  getApplicationStatusHistory,
  verifyAdminAccess,
  checkApplicationAuthorization,
  authorizeApplication,
  VALID_STATUS_TRANSITIONS,
  ROLE_TRANSITION_PERMISSIONS
};
