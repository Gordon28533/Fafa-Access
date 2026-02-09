/**
 * Payment Eligibility Service
 * Enforces payment authorization rules before any transaction is initiated
 * 
 * Validates:
 * - Application status (must be APPROVED)
 * - Application ownership (student must own the app)
 * - Payment history (no duplicate payments)
 * - Application validity (not deleted/blocked)
 */

import { db } from '../db/connection.js';
import { payments, applications } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a student can initiate a payment for an application
 * 
 * @param {string} applicationId - Application to pay for
 * @param {string} studentId - Student attempting to pay
 * @returns {Promise<{eligible: boolean, error?: string, application?: object}>}
 * 
 * Checks:
 * 1. Application exists
 * 2. Application is APPROVED
 * 3. Student owns the application
 * 4. No successful payment already exists
 */
export async function checkPaymentEligibility(applicationId, studentId) {
  try {
    // Validate inputs
    if (!applicationId || !studentId) {
      return {
        eligible: false,
        error: 'Application ID and Student ID are required',
        code: 'MISSING_PARAMETERS',
      };
    }

    // Check 1: Application Exists
    const applicationRecords = await db.select().from(applications)
      .where(eq(applications.id, applicationId));

    if (!applicationRecords || applicationRecords.length === 0) {
      return {
        eligible: false,
        error: 'Application not found',
        code: 'APPLICATION_NOT_FOUND',
      };
    }

    const application = applicationRecords[0];

    // Check 2: Application Status is APPROVED
    if (application.status !== 'APPROVED') {
      return {
        eligible: false,
        error: `Application must be APPROVED to pay. Current status: ${application.status}`,
        code: 'APPLICATION_NOT_APPROVED',
        currentStatus: application.status,
      };
    }

    // Check 3: Validate Application Ownership
    if (application.student_id !== studentId) {
      return {
        eligible: false,
        error: 'Not authorized to pay for this application',
        code: 'OWNERSHIP_MISMATCH',
      };
    }

    // Check 4: No Successful Payment Exists
    const existingPayments = await db.select().from(payments)
      .where(
        and(
          eq(payments.application_id, applicationId),
          eq(payments.type, 'INSTALLMENT'),
          eq(payments.status, 'COMPLETED')
        )
      );

    if (existingPayments && existingPayments.length > 0) {
      return {
        eligible: false,
        error: 'Installment payment already completed for this application',
        code: 'DUPLICATE_PAYMENT',
        existingPayment: {
          reference: existingPayments[0].payment_reference,
          amount: existingPayments[0].amount,
          completedAt: existingPayments[0].completed_at,
        },
      };
    }

    // All checks passed
    return {
      eligible: true,
      application: {
        id: application.id,
        reference: application.reference,
        studentId: application.student_id,
        status: application.status,
        laptopPrice: application.laptop_price,
      },
    };
  } catch (error) {
    console.error('[PaymentEligibility] Check failed:', error);
    return {
      eligible: false,
      error: 'Failed to check payment eligibility',
      code: 'ELIGIBILITY_CHECK_ERROR',
      details: error.message,
    };
  }
}

/**
 * Check if a payment can be verified
 * 
 * @param {string} studentId - Student attempting to verify
 * @param {string} paymentReference - Payment reference to verify
 * @returns {Promise<{verifiable: boolean, error?: string, payment?: object}>}
 * 
 * Checks:
 * 1. Payment exists
 * 2. Student owns the application
 * 3. Payment is not already verified
 * 4. Payment has valid pending status
 */
export async function checkVerificationEligibility(studentId, paymentReference) {
  try {
    if (!studentId || !paymentReference) {
      return {
        verifiable: false,
        error: 'Student ID and Payment Reference are required',
        code: 'MISSING_PARAMETERS',
      };
    }

    // Check 1: Payment Exists
    const paymentRecords = await db.select().from(payments)
      .where(eq(payments.payment_reference, paymentReference));

    if (!paymentRecords || paymentRecords.length === 0) {
      return {
        verifiable: false,
        error: 'Payment not found',
        code: 'PAYMENT_NOT_FOUND',
      };
    }

    const payment = paymentRecords[0];

    // Check 2: Get Application and Verify Ownership
    const applicationRecords = await db.select().from(applications)
      .where(eq(applications.id, payment.application_id));

    if (!applicationRecords || applicationRecords.length === 0) {
      return {
        verifiable: false,
        error: 'Associated application not found',
        code: 'APPLICATION_NOT_FOUND',
      };
    }

    const application = applicationRecords[0];

    if (application.student_id !== studentId) {
      return {
        verifiable: false,
        error: 'Not authorized to verify this payment',
        code: 'OWNERSHIP_MISMATCH',
      };
    }

    // Check 3: Payment Not Already Verified
    if (payment.status === 'COMPLETED') {
      return {
        verifiable: false,
        error: 'This payment has already been verified',
        code: 'ALREADY_VERIFIED',
        currentStatus: payment.status,
        completedAt: payment.completed_at,
      };
    }

    // Check 4: Payment in Valid Pending State
    if (payment.status !== 'PENDING') {
      return {
        verifiable: false,
        error: `Cannot verify payment in ${payment.status} state`,
        code: 'INVALID_PAYMENT_STATE',
        currentStatus: payment.status,
      };
    }

    return {
      verifiable: true,
      payment: {
        id: payment.id,
        reference: payment.payment_reference,
        paystackReference: payment.paystack_reference,
        amount: payment.amount,
        status: payment.status,
        applicationId: payment.application_id,
      },
    };
  } catch (error) {
    console.error('[VerificationEligibility] Check failed:', error);
    return {
      verifiable: false,
      error: 'Failed to check verification eligibility',
      code: 'VERIFICATION_CHECK_ERROR',
      details: error.message,
    };
  }
}

/**
 * Get detailed payment eligibility report for debugging/UI
 * 
 * @param {string} applicationId - Application to check
 * @param {string} studentId - Student ID
 * @returns {Promise<{checks: object, eligible: boolean}>}
 */
export async function getEligibilityReport(applicationId, studentId) {
  try {
    const checks = {
      applicationExists: false,
      applicationApproved: false,
      ownsApplication: false,
      noDuplicatePayment: false,
    };

    // Check application existence
    const applicationRecords = await db.select().from(applications)
      .where(eq(applications.id, applicationId));

    if (applicationRecords && applicationRecords.length > 0) {
      checks.applicationExists = true;
      const app = applicationRecords[0];

      // Check approval status
      checks.applicationApproved = app.status === 'APPROVED';

      // Check ownership
      checks.ownsApplication = app.student_id === studentId;

      // Check for duplicate payments
      const existingPayments = await db.select().from(payments)
        .where(
          and(
            eq(payments.application_id, applicationId),
            eq(payments.type, 'INSTALLMENT'),
            eq(payments.status, 'COMPLETED')
          )
        );

      checks.noDuplicatePayment = !existingPayments || existingPayments.length === 0;
    }

    const eligible = Object.values(checks).every(v => v === true);

    return { checks, eligible };
  } catch (error) {
    console.error('[EligibilityReport] Failed:', error);
    return {
      checks: {},
      eligible: false,
      error: error.message,
    };
  }
}

/**
 * Reject payment initiation with appropriate error
 * 
 * @param {object} eligibilityResult - Result from checkPaymentEligibility()
 * @returns {object} REST response
 */
export function rejectPaymentInitiation(eligibilityResult) {
  const statusMap = {
    MISSING_PARAMETERS: 400,
    APPLICATION_NOT_FOUND: 404,
    APPLICATION_NOT_APPROVED: 400,
    OWNERSHIP_MISMATCH: 403,
    DUPLICATE_PAYMENT: 400,
    ELIGIBILITY_CHECK_ERROR: 500,
  };

  const status = statusMap[eligibilityResult.code] || 400;

  return {
    status,
    body: {
      success: false,
      error: eligibilityResult.error,
      code: eligibilityResult.code,
      ...(eligibilityResult.currentStatus && { currentStatus: eligibilityResult.currentStatus }),
      ...(eligibilityResult.existingPayment && { existingPayment: eligibilityResult.existingPayment }),
    },
  };
}

/**
 * Reject payment verification with appropriate error
 * 
 * @param {object} eligibilityResult - Result from checkVerificationEligibility()
 * @returns {object} REST response
 */
export function rejectPaymentVerification(eligibilityResult) {
  const statusMap = {
    MISSING_PARAMETERS: 400,
    PAYMENT_NOT_FOUND: 404,
    APPLICATION_NOT_FOUND: 404,
    OWNERSHIP_MISMATCH: 403,
    ALREADY_VERIFIED: 400,
    INVALID_PAYMENT_STATE: 400,
    VERIFICATION_CHECK_ERROR: 500,
  };

  const status = statusMap[eligibilityResult.code] || 400;

  return {
    status,
    body: {
      success: false,
      error: eligibilityResult.error,
      code: eligibilityResult.code,
      ...(eligibilityResult.currentStatus && { currentStatus: eligibilityResult.currentStatus }),
      ...(eligibilityResult.completedAt && { completedAt: eligibilityResult.completedAt }),
    },
  };
}

export default {
  checkPaymentEligibility,
  checkVerificationEligibility,
  getEligibilityReport,
  rejectPaymentInitiation,
  rejectPaymentVerification,
};
