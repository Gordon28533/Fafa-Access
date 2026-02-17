/**
 * applicationBusinessRules.js
 * 
 * Business logic validation for application lifecycle management.
 * Enforces strict workflow rules and prevents invalid state transitions.
 */

import { db } from '../db/connection.js';
import { applications, laptops } from '../db/schema/applications.js';
import { eq } from 'drizzle-orm';
import { logger } from '../observability.js';

// ============================================================================
// LIFECYCLE STATUS ORDER
// ============================================================================

const STATUS_ORDER = {
  'PENDING_SRC': 1,
  'SRC_APPROVED': 2,
  'SRC_REJECTED': -1,  // Dead end
  'ADMIN_APPROVED': 3,
  'ADMIN_REJECTED': -1, // Dead end
  'DELIVERY_ASSIGNED': 4,
  'DELIVERED': 5,
  'COMPLETED': 6
};

// Statuses that lock the application (no edits allowed)
const LOCKED_STATUSES = ['DELIVERED', 'COMPLETED'];

// Statuses that are "dead end" rejections
const REJECTED_STATUSES = ['SRC_REJECTED', 'ADMIN_REJECTED'];

// ============================================================================
// BUSINESS RULE VALIDATORS
// ============================================================================

/**
 * Rule 1: Prevent ADMIN approval before SRC approval
 * Admin can only approve applications that have been SRC_APPROVED
 */
export async function validateAdminApprovalPrerequisite(applicationId) {
  try {
    const app = await db.select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!app.length) {
      return {
        valid: false,
        error: 'Application not found'
      };
    }

    const currentStatus = app[0].status;

    // Admin can only approve from SRC_APPROVED status
    if (currentStatus !== 'SRC_APPROVED') {
      logger.warn(
        { applicationId, currentStatus },
        'Admin approval attempted without SRC approval'
      );
      return {
        valid: false,
        error: `Cannot approve application. Current status: ${currentStatus}. Required status: SRC_APPROVED`
      };
    }

    return { valid: true, application: app[0] };
  } catch (error) {
    logger.error({ err: error, applicationId }, 'Error validating admin approval prerequisite');
    throw error;
  }
}

/**
 * Rule 2: Prevent delivery assignment before admin approval
 * Delivery can only be assigned to ADMIN_APPROVED applications
 */
export async function validateDeliveryAssignmentPrerequisite(applicationId) {
  try {
    const app = await db.select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!app.length) {
      return {
        valid: false,
        error: 'Application not found'
      };
    }

    const currentStatus = app[0].status;

    // Delivery can only be assigned from ADMIN_APPROVED status
    if (currentStatus !== 'ADMIN_APPROVED') {
      logger.warn(
        { applicationId, currentStatus },
        'Delivery assignment attempted without admin approval'
      );
      return {
        valid: false,
        error: `Cannot assign delivery. Current status: ${currentStatus}. Required status: ADMIN_APPROVED`
      };
    }

    return { valid: true, application: app[0] };
  } catch (error) {
    logger.error({ err: error, applicationId }, 'Error validating delivery assignment prerequisite');
    throw error;
  }
}

/**
 * Rule 3: Prevent payment confirmation before delivery assignment
 * Payment can only be marked as paid after delivery is assigned
 */
export async function validatePaymentPrerequisite(applicationId) {
  try {
    const app = await db.select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!app.length) {
      return {
        valid: false,
        error: 'Application not found'
      };
    }

    const currentStatus = app[0].status;
    const statusOrder = STATUS_ORDER[currentStatus] || 0;

    // Payment requires at least DELIVERY_ASSIGNED status
    if (statusOrder < STATUS_ORDER['DELIVERY_ASSIGNED']) {
      logger.warn(
        { applicationId, currentStatus },
        'Payment confirmation attempted before delivery assignment'
      );
      return {
        valid: false,
        error: `Cannot confirm payment. Current status: ${currentStatus}. Minimum required: DELIVERY_ASSIGNED`
      };
    }

    return { valid: true, application: app[0] };
  } catch (error) {
    logger.error({ err: error, applicationId }, 'Error validating payment prerequisite');
    throw error;
  }
}

/**
 * Rule 4: Lock historical records (no edits after delivery)
 * Applications cannot be edited once delivered or completed
 */
export async function validateApplicationEditable(applicationId) {
  try {
    const app = await db.select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!app.length) {
      return {
        valid: false,
        error: 'Application not found'
      };
    }

    const currentStatus = app[0].status;

    // Check if status is locked
    if (LOCKED_STATUSES.includes(currentStatus)) {
      logger.warn(
        { applicationId, currentStatus },
        'Edit attempted on locked application'
      );
      return {
        valid: false,
        error: `Application is locked. Status: ${currentStatus}. No edits allowed after delivery.`,
        isLocked: true
      };
    }

    return { valid: true, application: app[0] };
  } catch (error) {
    logger.error({ err: error, applicationId }, 'Error validating application editable');
    throw error;
  }
}

/**
 * Rule 5: Validate laptop stock before approval
 * Ensure laptop has sufficient stock before admin approval
 */
export async function validateLaptopStock(laptopId, quantityNeeded = 1) {
  try {
    const laptop = await db.select()
      .from(laptops)
      .where(eq(laptops.id, laptopId))
      .limit(1);

    if (!laptop.length) {
      return {
        valid: false,
        error: 'Laptop model not found'
      };
    }

    const laptopData = laptop[0];

    // Check if laptop is active
    if (!laptopData.isActive) {
      logger.warn(
        { laptopId, isActive: laptopData.isActive },
        'Approval attempted for inactive laptop'
      );
      return {
        valid: false,
        error: `Laptop model "${laptopData.brand} ${laptopData.model}" is not available.`
      };
    }

    // Check stock availability
    if (laptopData.stockQuantity < quantityNeeded) {
      logger.warn(
        { laptopId, stock: laptopData.stockQuantity, quantityNeeded },
        'Insufficient laptop stock for approval'
      );
      return {
        valid: false,
        error: `Insufficient stock for ${laptopData.brand} ${laptopData.model}. Available: ${laptopData.stockQuantity}, Required: ${quantityNeeded}`,
        availableStock: laptopData.stockQuantity
      };
    }

    return {
      valid: true,
      laptop: laptopData,
      availableStock: laptopData.stockQuantity
    };
  } catch (error) {
    logger.error({ err: error, laptopId }, 'Error validating laptop stock');
    throw error;
  }
}

/**
 * Comprehensive validation for admin approval
 * Combines prerequisite check and stock validation
 */
export async function validateAdminApproval(applicationId) {
  try {
    // Check SRC approval prerequisite
    const prerequisiteCheck = await validateAdminApprovalPrerequisite(applicationId);
    if (!prerequisiteCheck.valid) {
      return prerequisiteCheck;
    }

    const application = prerequisiteCheck.application;

    // Check laptop stock
    if (application.laptopId) {
      const stockCheck = await validateLaptopStock(application.laptopId);
      if (!stockCheck.valid) {
        return stockCheck;
      }

      return {
        valid: true,
        application,
        laptop: stockCheck.laptop,
        availableStock: stockCheck.availableStock
      };
    }

    return {
      valid: true,
      application
    };
  } catch (error) {
    logger.error({ err: error, applicationId }, 'Error validating admin approval');
    throw error;
  }
}

/**
 * Check if application status is a rejected state
 */
export function isRejectedStatus(status) {
  return REJECTED_STATUSES.includes(status);
}

/**
 * Check if application status is locked
 */
export function isLockedStatus(status) {
  return LOCKED_STATUSES.includes(status);
}

/**
 * Get minimum required status for an operation
 */
export function getMinimumRequiredStatus(operation) {
  const requirements = {
    'payment': 'DELIVERY_ASSIGNED',
    'delivery': 'ADMIN_APPROVED',
    'admin_approval': 'SRC_APPROVED',
    'src_approval': 'PENDING_SRC'
  };

  return requirements[operation] || null;
}

/**
 * Validate that current status meets minimum requirement for operation
 */
export function validateStatusRequirement(currentStatus, requiredStatus) {
  const currentOrder = STATUS_ORDER[currentStatus] || 0;
  const requiredOrder = STATUS_ORDER[requiredStatus] || 0;

  if (currentOrder < requiredOrder) {
    return {
      valid: false,
      error: `Current status ${currentStatus} does not meet requirement: ${requiredStatus}`
    };
  }

  return { valid: true };
}

/**
 * Validate withdrawal eligibility
 * Students can only withdraw before delivery
 */
export async function validateWithdrawalEligibility(applicationId) {
  try {
    const app = await db.select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!app.length) {
      return {
        valid: false,
        error: 'Application not found'
      };
    }

    const currentStatus = app[0].status;
    const statusOrder = STATUS_ORDER[currentStatus] || 0;

    // Cannot withdraw if already delivered or completed
    if (statusOrder >= STATUS_ORDER['DELIVERED']) {
      return {
        valid: false,
        error: 'Cannot withdraw application after delivery'
      };
    }

    // Cannot withdraw if already rejected
    if (REJECTED_STATUSES.includes(currentStatus)) {
      return {
        valid: false,
        error: 'Application is already rejected'
      };
    }

    return {
      valid: true,
      application: app[0]
    };
  } catch (error) {
    logger.error({ err: error, applicationId }, 'Error validating withdrawal eligibility');
    throw error;
  }
}

/**
 * Comprehensive update validation
 * Checks if application can be edited based on status and user role
 */
export async function validateApplicationUpdate(applicationId, userRole, updateType = 'general') {
  try {
    const editableCheck = await validateApplicationEditable(applicationId);
    if (!editableCheck.valid) {
      return editableCheck;
    }

    const application = editableCheck.application;
    const currentStatus = application.status;

    // Different update types have different rules
    switch (updateType) {
      case 'laptop_change':
        // Laptop can only be changed before admin approval
        if (STATUS_ORDER[currentStatus] >= STATUS_ORDER['ADMIN_APPROVED']) {
          return {
            valid: false,
            error: 'Cannot change laptop selection after admin approval'
          };
        }
        break;

      case 'personal_info':
        // Personal info can only be changed before SRC approval
        if (STATUS_ORDER[currentStatus] >= STATUS_ORDER['SRC_APPROVED']) {
          return {
            valid: false,
            error: 'Cannot update personal information after SRC approval'
          };
        }
        break;

      case 'status_change':
        // Status changes follow specific role-based rules
        // This is handled by validateStatusTransition in authorizationHelpers
        break;
    }

    return {
      valid: true,
      application
    };
  } catch (error) {
    logger.error({ err: error, applicationId }, 'Error validating application update');
    throw error;
  }
}

/**
 * Reserve laptop stock for approved application
 * Decrements stock when admin approves
 */
export async function reserveLaptopStock(laptopId, applicationId) {
  try {
    // Validate stock first
    const stockCheck = await validateLaptopStock(laptopId);
    if (!stockCheck.valid) {
      return stockCheck;
    }

    // Decrement stock
    const result = await db.update(laptops)
      .set({
        stockQuantity: stockCheck.laptop.stockQuantity - 1,
        updatedAt: new Date()
      })
      .where(eq(laptops.id, laptopId))
      .returning();

    logger.info(
      { laptopId, applicationId, newStock: result[0].stockQuantity },
      'Laptop stock reserved for application'
    );

    return {
      valid: true,
      laptop: result[0],
      reservedStock: 1
    };
  } catch (error) {
    logger.error({ err: error, laptopId, applicationId }, 'Error reserving laptop stock');
    throw error;
  }
}

/**
 * Release laptop stock if application is rejected/withdrawn
 * Increments stock back
 */
export async function releaseLaptopStock(laptopId, applicationId) {
  try {
    const laptop = await db.select()
      .from(laptops)
      .where(eq(laptops.id, laptopId))
      .limit(1);

    if (!laptop.length) {
      return {
        valid: false,
        error: 'Laptop model not found'
      };
    }

    // Increment stock
    const result = await db.update(laptops)
      .set({
        stockQuantity: laptop[0].stockQuantity + 1,
        updatedAt: new Date()
      })
      .where(eq(laptops.id, laptopId))
      .returning();

    logger.info(
      { laptopId, applicationId, newStock: result[0].stockQuantity },
      'Laptop stock released from application'
    );

    return {
      valid: true,
      laptop: result[0],
      releasedStock: 1
    };
  } catch (error) {
    logger.error({ err: error, laptopId, applicationId }, 'Error releasing laptop stock');
    throw error;
  }
}

export default {
  validateAdminApprovalPrerequisite,
  validateDeliveryAssignmentPrerequisite,
  validatePaymentPrerequisite,
  validateApplicationEditable,
  validateLaptopStock,
  validateAdminApproval,
  validateWithdrawalEligibility,
  validateApplicationUpdate,
  isRejectedStatus,
  isLockedStatus,
  getMinimumRequiredStatus,
  validateStatusRequirement,
  reserveLaptopStock,
  releaseLaptopStock
};
