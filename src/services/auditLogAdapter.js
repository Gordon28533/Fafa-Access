/**
 * Audit Log Adapter
 * Provides backwards-compatible API for audit logging
 * Maps old method calls to new function signatures
 */

import {
  logApplicationSubmission,
  logSrcDecision,
  logAdminDecision,
  logDeliveryConfirmation,
  logPaymentConfirmation
} from './auditLogService.js';

export const auditLogService = {
  /**
   * Log application submission
   * @param {string} userId - Student ID
   * @param {string} applicationId - Application ID
   * @param {string} reference - Application reference
   * @param {string} ipAddress - IP address
   */
  async logApplicationSubmitted(userId, applicationId, reference, ipAddress) {
    try {
      await logApplicationSubmission(
        userId,
        applicationId,
        reference,
        {
          userId,
          userRole: 'STUDENT',
          ipAddress
        },
        { reference }
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  /**
   * Log SRC decision
   * @param {string} userId - SRC officer ID
   * @param {string} applicationId - Application ID
   * @param {string} reference - Application reference
   * @param {boolean} approved - Whether application was approved
   * @param {string} notes - Decision notes
   * @param {string} ipAddress - IP address
   */
  async logSrcDecision(userId, applicationId, reference, approved, notes, ipAddress) {
    try {
      await logSrcDecision(
        userId,
        applicationId,
        approved ? 'APPROVED' : 'REJECTED',
        notes || 'No notes provided',
        {
          userId,
          userRole: 'SRC',
          ipAddress
        },
        { reference, notes }
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  /**
   * Log admin decision
   * @param {string} userId - Admin ID
   * @param {string} applicationId - Application ID
   * @param {string} reference - Application reference
   * @param {boolean} approved - Whether application was approved
   * @param {string} notes - Decision notes
   * @param {string} ipAddress - IP address
   */
  async logAdminDecision(userId, applicationId, reference, approved, notes, ipAddress) {
    try {
      await logAdminDecision(
        userId,
        applicationId,
        approved ? 'APPROVED' : 'REJECTED',
        notes || 'No notes provided',
        {
          userId,
          userRole: 'ADMIN',
          ipAddress
        },
        { reference, notes }
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  /**
   * Log delivery confirmation
   * @param {string} userId - Delivery person ID
   * @param {string} applicationId - Application ID
   * @param {string} reference - Application reference
   * @param {string} ipAddress - IP address
   */
  async logDeliveryConfirmed(userId, applicationId, reference, ipAddress) {
    try {
      await logDeliveryConfirmation(
        userId,
        applicationId,
        new Date().toISOString(),
        {
          userId,
          userRole: 'DELIVERY',
          ipAddress
        },
        { reference }
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  /**
   * Log payment collection (not in new API, creating as payment confirmation)
   * @param {string} userId - Delivery person ID
   * @param {string} applicationId - Application ID
   * @param {string} reference - Application reference
   * @param {number} amount - Payment amount
   * @param {string} type - Payment type
   * @param {string} ipAddress - IP address
   */
  async logPaymentCollected(userId, applicationId, reference, amount, type, ipAddress) {
    try {
      await logPaymentConfirmation(
        applicationId,
        amount,
        type,
        {
          userId,
          userRole: 'DELIVERY',
          ipAddress
        },
        { reference, status: 'COLLECTED' }
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  /**
   * Log payment confirmation
   * @param {string} userId - Admin/Delivery person ID
   * @param {string} applicationId - Application ID
   * @param {string} reference - Application reference
   * @param {number} amount - Payment amount
   * @param {string} type - Payment type
   * @param {string} ipAddress - IP address
   */
  async logPaymentConfirmed(userId, applicationId, reference, amount, type, ipAddress) {
    try {
      await logPaymentConfirmation(
        applicationId,
        amount,
        type,
        {
          userId,
          userRole: 'ADMIN',
          ipAddress
        },
        { reference, status: 'CONFIRMED' }
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  /**
   * Log laptop creation
   * @param {string} userId - Admin ID
   * @param {string} laptopId - Laptop ID
   * @param {object} details - Laptop details (brand, model, serialNumber, prices, stock)
   * @param {string} ipAddress - IP address
   */
  async logLaptopCreation(userId, laptopId, details, ipAddress) {
    try {
      const { db } = await import('../db/connection.js');
      const { auditLogs } = await import('../db/schema/notifications.js');
      
      await db.insert(auditLogs).values({
        action: 'LAPTOP_CREATED',
        actorId: userId,
        actorRole: 'ADMIN',
        details: JSON.stringify({
          laptopId,
          ...details,
          ipAddress,
          timestamp: new Date().toISOString()
        }),
        applicationId: null
      });
    } catch (error) {
      console.error('Error logging laptop creation:', error);
    }
  },

  /**
   * Log laptop update
   * @param {string} userId - Admin ID
   * @param {string} laptopId - Laptop ID
   * @param {object} changes - What changed (old vs new values)
   * @param {string} ipAddress - IP address
   */
  async logLaptopUpdate(userId, laptopId, changes, ipAddress) {
    try {
      const { db } = await import('../db/connection.js');
      const { auditLogs } = await import('../db/schema/notifications.js');
      
      await db.insert(auditLogs).values({
        action: 'LAPTOP_UPDATED',
        actorId: userId,
        actorRole: 'ADMIN',
        details: JSON.stringify({
          laptopId,
          changes,
          ipAddress,
          timestamp: new Date().toISOString()
        }),
        applicationId: null
      });
    } catch (error) {
      console.error('Error logging laptop update:', error);
    }
  },

  /**
   * Log laptop deactivation
   * @param {string} userId - Admin ID
   * @param {string} laptopId - Laptop ID
   * @param {object} details - Laptop details
   * @param {string} ipAddress - IP address
   */
  async logLaptopDeactivation(userId, laptopId, details, ipAddress) {
    try {
      const { db } = await import('../db/connection.js');
      const { auditLogs } = await import('../db/schema/notifications.js');
      
      await db.insert(auditLogs).values({
        action: 'LAPTOP_DEACTIVATED',
        actorId: userId,
        actorRole: 'ADMIN',
        details: JSON.stringify({
          laptopId,
          ...details,
          ipAddress,
          timestamp: new Date().toISOString()
        }),
        applicationId: null
      });
    } catch (error) {
      console.error('Error logging laptop deactivation:', error);
    }
  },

  /**
   * Log laptop activation
   * @param {string} userId - Admin ID
   * @param {string} laptopId - Laptop ID
   * @param {object} details - Laptop details
   * @param {string} ipAddress - IP address
   */
  async logLaptopActivation(userId, laptopId, details, ipAddress) {
    try {
      const { db } = await import('../db/connection.js');
      const { auditLogs } = await import('../db/schema/notifications.js');
      
      await db.insert(auditLogs).values({
        action: 'LAPTOP_ACTIVATED',
        actorId: userId,
        actorRole: 'ADMIN',
        details: JSON.stringify({
          laptopId,
          ...details,
          ipAddress,
          timestamp: new Date().toISOString()
        }),
        applicationId: null
      });
    } catch (error) {
      console.error('Error logging laptop activation:', error);
    }
  },

  /**
   * Log stock adjustment
   * @param {string} userId - Admin ID
   * @param {string} laptopId - Laptop ID
   * @param {object} details - Stock change details (previous, adjustment, new, reason)
   * @param {string} ipAddress - IP address
   */
  async logStockAdjustment(userId, laptopId, details, ipAddress) {
    try {
      const { db } = await import('../db/connection.js');
      const { auditLogs } = await import('../db/schema/notifications.js');
      
      await db.insert(auditLogs).values({
        action: 'STOCK_ADJUSTED',
        actorId: userId,
        actorRole: 'ADMIN',
        details: JSON.stringify({
          laptopId,
          ...details,
          ipAddress,
          timestamp: new Date().toISOString()
        }),
        applicationId: null
      });
    } catch (error) {
      console.error('Error logging stock adjustment:', error);
    }
  },

  /**
   * Log payment initiation
   * @param {string} userId - Student ID
   * @param {string} applicationId - Application ID
   * @param {object} details - Payment details (amount, type, reference)
   * @param {string} ipAddress - IP address
   */
  async logPaymentInitiation(userId, applicationId, details, ipAddress) {
    try {
      const { db } = await import('../db/connection.js');
      const { auditLogs } = await import('../db/schema/notifications.js');
      
      await db.insert(auditLogs).values({
        action: 'PAYMENT_INITIATED',
        actorId: userId,
        actorRole: 'STUDENT',
        details: JSON.stringify({
          ...details,
          ipAddress,
          timestamp: new Date().toISOString()
        }),
        applicationId
      });
    } catch (error) {
      console.error('Error logging payment initiation:', error);
    }
  },

  /**
   * Log payment verification (after payment gateway confirmation)
   * @param {string} userId - Student ID
   * @param {string} applicationId - Application ID
   * @param {object} details - Payment details
   * @param {string} ipAddress - IP address
   */
  async logPaymentVerification(userId, applicationId, details, ipAddress) {
    try {
      const { db } = await import('../db/connection.js');
      const { auditLogs } = await import('../db/schema/notifications.js');
      
      await db.insert(auditLogs).values({
        action: 'PAYMENT_VERIFIED',
        actorId: userId,
        actorRole: 'STUDENT',
        details: JSON.stringify({
          ...details,
          ipAddress,
          timestamp: new Date().toISOString()
        }),
        applicationId
      });
    } catch (error) {
      console.error('Error logging payment verification:', error);
    }
  }
};
