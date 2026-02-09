/**
 * Authorization Middleware - Advanced access control beyond basic role checking
 * 
 * Provides:
 * - University-level access control for SRC
 * - Resource ownership verification
 * - Application status transition validation
 */

import { db } from '../db/index.js';
import { users, srcOfficers, applications } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

/**
 * Ensure SRC can only access their university's data
 * Attaches universityId to req for use in controllers
 */
export async function enforceSRCUniversityAccess(req, res, next) {
  try {
    if (req.user.role !== 'SRC') {
      return next(); // Only applies to SRC
    }

    // Fetch SRC officer record
    const srcOfficer = await db
      .select()
      .from(srcOfficers)
      .where(eq(srcOfficers.userId, req.user.userId))
      .limit(1);

    if (!srcOfficer.length) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'SRC officer profile not found'
      });
    }

    // Attach university ID to request
    req.universityId = srcOfficer[0].universityId;
    next();
  } catch (error) {
    console.error('SRC university access enforcement error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

/**
 * Verify student owns the application
 * Used for student-initiated application updates
 */
export async function verifyApplicationOwnership(req, res, next) {
  try {
    const { applicationId } = req.params || req.body;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Application ID required'
      });
    }

    const application = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application.length) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Application not found'
      });
    }

    // Allow ADMIN to access any application
    if (req.user.role === 'ADMIN') {
      req.application = application[0];
      return next();
    }

    // Student must own the application
    if (req.user.role === 'STUDENT' && application[0].studentId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only access your own applications'
      });
    }

    req.application = application[0];
    next();
  } catch (error) {
    console.error('Application ownership verification error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

/**
 * Validate application status transitions
 * Prevents invalid state changes based on role and current status
 * 
 * Valid transitions:
 * - STUDENT creates: PENDING_SRC
 * - SRC reviews: PENDING_SRC -> APPROVED_SRC or REJECTED_SRC
 * - ADMIN approves: APPROVED_SRC -> APPROVED_ADMIN or REJECTED_ADMIN
 * - STUDENT can withdraw: PENDING_SRC or PENDING_ADMIN
 */
export function validateStatusTransition(req, res, next) {
  // Attach validation function to request
  req.validateTransition = (currentStatus, newStatus, userRole) => {
    const validTransitions = {
      'PENDING_SRC': {
        'SRC': ['APPROVED_SRC', 'REJECTED_SRC'],
        'STUDENT': ['WITHDRAWN'],
      },
      'APPROVED_SRC': {
        'ADMIN': ['APPROVED_ADMIN', 'REJECTED_ADMIN'],
      },
      'PENDING_ADMIN': {
        'STUDENT': ['WITHDRAWN'],
        'ADMIN': ['APPROVED_ADMIN', 'REJECTED_ADMIN'],
      },
      'APPROVED_ADMIN': {
        'ADMIN': ['PENDING_DELIVERY', 'CANCELLED'],
        'DELIVERY': ['IN_TRANSIT', 'DELIVERED'],
      },
      'IN_TRANSIT': {
        'DELIVERY': ['DELIVERED'],
      },
    };

    const allowedTransitions = validTransitions[currentStatus]?.[userRole] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      return {
        valid: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus} for ${userRole}`,
        allowed: allowedTransitions
      };
    }

    return { valid: true };
  };

  next();
}

/**
 * Verify SRC can only access applications from their university
 */
export async function enforceSRCApplicationAccess(req, res, next) {
  try {
    if (req.user.role !== 'SRC') {
      return next(); // Only applies to SRC
    }

    if (!req.application) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Application not loaded'
      });
    }

    // Get SRC's university
    const srcOfficer = await db
      .select()
      .from(srcOfficers)
      .where(eq(srcOfficers.userId, req.user.userId))
      .limit(1);

    if (!srcOfficer.length) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'SRC officer profile not found'
      });
    }

    // Get student's university from their application
    const student = await db
      .select()
      .from(users)
      .where(eq(users.id, req.application.studentId))
      .limit(1);

    if (!student.length || student[0].universityId !== srcOfficer[0].universityId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only access applications from your university'
      });
    }

    next();
  } catch (error) {
    console.error('SRC application access enforcement error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

/**
 * Verify admin can approve deliveries/assignments
 * Ensures only ADMIN can make final approval decisions
 */
export async function enforceAdminApprovalOnly(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Only administrators can perform this action'
    });
  }
  next();
}

export default {
  enforceSRCUniversityAccess,
  verifyApplicationOwnership,
  validateStatusTransition,
  enforceSRCApplicationAccess,
  enforceAdminApprovalOnly,
};
