/**
 * Payment Authorization Middleware
 * Enforces payment access control rules before endpoints are executed
 * 
 * Usage:
 * router.post('/payments/initialize', authenticate, checkPaymentEligibility, handler);
 */

import {
  checkPaymentEligibility,
  checkVerificationEligibility,
  rejectPaymentInitiation,
  rejectPaymentVerification,
} from '../services/PaymentEligibilityService.js';

/**
 * Middleware: Check payment eligibility before initialization
 * 
 * Validates:
 * - Application exists
 * - Application is APPROVED
 * - Student owns application
 * - No duplicate payment exists
 * 
 * On failure: Sends error response and stops further processing
 * On success: Attaches application data to req.payment and continues
 */
export async function checkPaymentEligibilityMiddleware(req, res, next) {
  try {
    const { applicationId } = req.body;
    const userId = req.user.id;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Application ID is required',
        code: 'MISSING_APPLICATION_ID',
      });
    }

    // Run eligibility checks
    const eligibility = await checkPaymentEligibility(applicationId, userId);

    // If not eligible, send error and stop
    if (!eligibility.eligible) {
      const rejection = rejectPaymentInitiation(eligibility);
      return res.status(rejection.status).json(rejection.body);
    }

    // Attach validated application data to request for downstream handlers
    req.payment = {
      applicationId,
      studentId: userId,
      application: eligibility.application,
      eligible: true,
    };

    // Continue to next handler
    next();
  } catch (error) {
    console.error('[PaymentEligibilityMiddleware] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment eligibility check failed',
      code: 'ELIGIBILITY_CHECK_FAILED',
    });
  }
}

/**
 * Middleware: Check verification eligibility before payment confirmation
 * 
 * Validates:
 * - Payment exists
 * - Student owns the payment
 * - Payment is in PENDING state
 * - Payment not already verified
 * 
 * On failure: Sends error response and stops further processing
 * On success: Attaches payment data to req.payment and continues
 */
export async function checkVerificationEligibilityMiddleware(req, res, next) {
  try {
    const { reference } = req.body;
    const userId = req.user.id;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Payment reference is required',
        code: 'MISSING_REFERENCE',
      });
    }

    // Run eligibility checks
    const eligibility = await checkVerificationEligibility(userId, reference);

    // If not eligible, send error and stop
    if (!eligibility.verifiable) {
      const rejection = rejectPaymentVerification(eligibility);
      return res.status(rejection.status).json(rejection.body);
    }

    // Attach validated payment data to request for downstream handlers
    req.payment = {
      reference,
      studentId: userId,
      payment: eligibility.payment,
      verifiable: true,
    };

    // Continue to next handler
    next();
  } catch (error) {
    console.error('[VerificationEligibilityMiddleware] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification eligibility check failed',
      code: 'VERIFICATION_CHECK_FAILED',
    });
  }
}

export default {
  checkPaymentEligibilityMiddleware,
  checkVerificationEligibilityMiddleware,
};
