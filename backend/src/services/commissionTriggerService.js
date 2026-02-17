// commissionTriggerService.js
// Service logic for SRC commission triggering
// This service handles the automatic calculation and recording of SRC commissions

import { calculateSRCCommission } from '../utils/commissionCalculator.js';
import { logAudit } from '../utils/auditLogger.js';
import { prisma } from '../utils/prismaClient.js';

/**
 * SRC Commission Trigger Service
 * 
 * TRIGGER CONDITIONS:
 * 1. Delivery confirmed (delivery.delivered = true)
 * 2. 70% payment marked as collected (delivery.paymentConfirmed = true)
 * 
 * ACTIONS PERFORMED:
 * 1. Calculate commission from remaining 30% balance
 *    Formula: Commission = CommissionRate × (TotalPrice × 0.30)
 * 2. Create SRCCommissionRecord with status 'EARNED'
 * 3. Update UniversityWallet balance (increment earnedCommissions)
 * 4. Update Application (commissionEarned, commissionPaid=false)
 * 5. Log audit trail
 * 
 * GUARANTEES:
 * - Idempotency: Safe to call multiple times - will not create duplicates
 * - Atomicity: Uses database transactions for consistency
 * - Audit Trail: Full logging of all actions
 * - Error Recovery: Graceful error handling with detailed logging
 */

/**
 * Trigger commission calculation when payment is confirmed
 * 
 * This is the main entry point called from the payment confirmation endpoint
 * 
 * @param {string} applicationId - The application ID
 * @param {string} deliveryId - The delivery ID
 * @param {string} triggeredBy - User ID who triggered (usually delivery staff)
 * @returns {Promise<Object>} Result object with success status and details
 */
export async function triggerCommissionOnPayment(applicationId, deliveryId, triggeredBy) {
  console.log(`[COMMISSION SERVICE] Triggered for application ${applicationId} by ${triggeredBy}`);
  
  try {
    // Calculate commission (this function is idempotent and handles all validations)
    const result = await calculateSRCCommission(applicationId, triggeredBy);
    
    if (result.success) {
      console.log(`[COMMISSION SERVICE] ✓ Success - GHS ${result.amount.toFixed(2)} earned for ${result.universityName}`);
      
      // Additional audit log from service layer
      await logAudit({
        action: 'COMMISSION_TRIGGERED',
        actorId: triggeredBy,
        actorRole: 'DELIVERY',
        applicationId: applicationId,
        oldStatus: 'DELIVERED',
        newStatus: 'DELIVERED',
        details: `Commission trigger successful: GHS ${result.amount.toFixed(2)}. Delivery ID: ${deliveryId}`
      });
      
      return {
        success: true,
        commission: {
          amount: result.amount,
          university: result.universityName,
          srcOfficer: result.srcOfficer,
          idempotent: result.idempotent || false
        }
      };
    } else {
      console.log(`[COMMISSION SERVICE] Not triggered: ${result.reason}`);
      
      return {
        success: false,
        reason: result.reason,
        commission: null
      };
    }
    
  } catch (error) {
    console.error(`[COMMISSION SERVICE] Error triggering commission:`, error);
    
    // Log error
    await logAudit({
      action: 'COMMISSION_TRIGGER_ERROR',
      actorId: triggeredBy,
      actorRole: 'DELIVERY',
      applicationId: applicationId,
      oldStatus: 'ERROR',
      newStatus: 'ERROR',
      details: `Commission trigger failed: ${error.message}`
    });
    
    return {
      success: false,
      reason: error.message,
      commission: null
    };
  }
}

/**
 * Manual commission trigger (Admin only)
 * For cases where automatic trigger failed or commission needs recalculation
 * 
 * @param {string} applicationId - The application ID
 * @param {string} adminUserId - Admin user ID
 * @param {string} reason - Reason for manual trigger
 * @returns {Promise<Object>} Result object
 */
export async function manualCommissionTrigger(applicationId, adminUserId, reason = 'Manual trigger by admin') {
  console.log(`[COMMISSION SERVICE] Manual trigger for application ${applicationId} by admin ${adminUserId}`);
  
  try {
    const result = await calculateSRCCommission(applicationId, adminUserId);
    
    if (result.success) {
      await logAudit({
        action: 'COMMISSION_MANUAL_TRIGGER',
        actorId: adminUserId,
        actorRole: 'ADMIN',
        applicationId: applicationId,
        oldStatus: 'N/A',
        newStatus: 'N/A',
        details: `Manual commission trigger: ${reason}. Amount: GHS ${result.amount.toFixed(2)}`
      });
      
      return {
        success: true,
        message: 'Commission calculated successfully',
        commission: {
          amount: result.amount,
          university: result.universityName,
          srcOfficer: result.srcOfficer
        }
      };
    } else {
      return {
        success: false,
        message: result.reason,
        commission: null
      };
    }
    
  } catch (error) {
    console.error(`[COMMISSION SERVICE] Manual trigger error:`, error);
    return {
      success: false,
      message: error.message,
      commission: null
    };
  }
}

/**
 * Get commission status for an application
 * 
 * @param {string} applicationId - The application ID
 * @returns {Promise<Object>} Commission status
 */
export async function getCommissionStatus(applicationId) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        commissionRecord: true,
        delivery: true,
        student: {
          include: {
            university: true
          }
        }
      }
    });
    
    if (!application) {
      return { found: false };
    }
    
    return {
      found: true,
      applicationRef: application.reference,
      deliveryConfirmed: application.delivery?.delivered || false,
      paymentConfirmed: application.delivery?.paymentConfirmed || false,
      commissionCalculated: !!application.commissionRecord,
      commissionAmount: application.commissionEarned,
      commissionPaid: application.commissionPaid,
      commissionStatus: application.commissionRecord?.status || 'NOT_CALCULATED',
      universityName: application.student.university.name,
      commissionRate: application.student.university.commissionRate,
      eligible: application.delivery?.delivered && application.delivery?.paymentConfirmed
    };
    
  } catch (error) {
    console.error('[COMMISSION SERVICE] Error getting status:', error);
    return { found: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

export default {
  triggerCommissionOnPayment,
  manualCommissionTrigger,
  getCommissionStatus
};
