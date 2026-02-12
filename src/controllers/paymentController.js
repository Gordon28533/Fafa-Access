/**
 * Payment Controller
 * Handles Paystack payment initialization and verification with database storage
 * 
 * Features:
 * - 30% installment payment calculation
 * - Duplicate payment prevention
 * - Server-side verification
 * - Payment record management
 * - Status tracking
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db/connection.js';
import { payments } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { 
  initializePayment, 
  verifyPayment, 
  generatePaymentReference, 
  calculateInstallmentAmount,
  verifyWebhookSignature 
} from '../services/PaystackService.js';
import {
  checkPaymentEligibility,
  checkVerificationEligibility,
  rejectPaymentInitiation,
  rejectPaymentVerification,
} from '../services/PaymentEligibilityService.js';
import { authenticate } from '../middleware/auth.js';
import { logPayment } from '../utils/auditLogger.js';

const router = Router();

// Webhook rate limiter - higher limits for external service webhooks
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: process.env.NODE_ENV === 'production' ? 100 : 200, // Higher limits for webhook traffic
  message: 'Webhook rate limit exceeded.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/payments/initialize
 * Initialize a 30% installment payment for an approved application
 * 
 * Body: { applicationId: string }
 * Returns: { authorizationUrl, reference }
 * 
 * Authorization Rules:
 * - Application must be APPROVED
 * - Student must own the application
 * - No existing successful payment
 */
router.post('/initialize', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.body;
    const userId = req.user.id;

    // STEP 1: Validate payment eligibility
    const eligibility = await checkPaymentEligibility(applicationId, userId);

    if (!eligibility.eligible) {
      const rejection = rejectPaymentInitiation(eligibility);
      return res.status(rejection.status).json(rejection.body);
    }

    const app = eligibility.application;

    // STEP 2: Get student email
    const student = await db.select().from(db.raw(`SELECT email FROM users WHERE id = ?`))
      .execute(userId);

    if (!student || student.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'STUDENT_NOT_FOUND',
      });
    }

    const studentEmail = student[0].email;

    // STEP 3: Calculate installment amount
    const totalPrice = parseFloat(app.laptopPrice) || 0;
    if (totalPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid laptop price for this application',
        code: 'INVALID_PRICE',
      });
    }

    const installmentAmount = calculateInstallmentAmount(totalPrice);

    // STEP 4: Generate unique payment reference
    const paymentReference = generatePaymentReference(app.reference, 'FINAL_30');

    // STEP 5: Initialize with Paystack
    const paystackResponse = await initializePayment({
      email: studentEmail,
      amount: installmentAmount,
      reference: paymentReference,
      metadata: {
        application_id: applicationId,
        application_ref: app.reference,
        student_id: userId,
        payment_type: 'INSTALLMENT_30',
        total_price: totalPrice,
        installment_amount: installmentAmount,
      },
    });

    // STEP 6: Store payment record
    await db.insert(payments).values({
      application_id: applicationId,
      type: 'INSTALLMENT',
      amount: installmentAmount,
      currency: 'GHS',
      payment_reference: paymentReference,
      paystack_reference: paystackResponse.reference,
      paystack_access_code: paystackResponse.access_code,
      status: 'PENDING',
      initiated_at: new Date(),
      initiated_by: userId,
    });

    // Audit log: Payment initialization
    await logPayment({
      actorId: userId,
      actorRole: 'STUDENT',
      applicationId: applicationId,
      paymentId: paystackResponse.reference,
      amount: installmentAmount,
      paymentType: 'INSTALLMENT',
      status: 'PENDING',
    });

    res.json({
      success: true,
      data: {
        authorizationUrl: paystackResponse.authorization_url,
        reference: paymentReference,
        paystackReference: paystackResponse.reference,
        amount: installmentAmount,
        currency: 'GHS',
        applicationRef: app.reference,
      },
    });
  } catch (error) {
    console.error('[Payment] Initialization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment initialization failed',
      code: 'INITIALIZATION_ERROR',
    });
  }
});

/**
 * POST /api/payments/verify
 * Verify a payment with Paystack and update database
 * 
 * Body: { reference: string }
 * Returns: { verified, payment, status }
 * 
 * Authorization Rules:
 * - Student must own the application
 * - Payment must be in PENDING state
 * - Cannot verify already verified payments
 */
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { reference } = req.body;
    const userId = req.user.id;

    // STEP 1: Validate verification eligibility
    const eligibility = await checkVerificationEligibility(userId, reference);

    if (!eligibility.verifiable) {
      const rejection = rejectPaymentVerification(eligibility);
      return res.status(rejection.status).json(rejection.body);
    }

    const paymentData = eligibility.payment;

    // STEP 2: Verify with Paystack
    const verification = await verifyPayment(paymentData.paystackReference);

    if (!verification.verified) {
      // Update payment status to failed
      await db.update(payments)
        .set({
          status: 'FAILED',
          verification_result: JSON.stringify(verification),
        })
        .where(eq(payments.id, paymentData.id));

      // Audit log: Payment failure
      await logPayment({
        actorId: userId,
        actorRole: 'STUDENT',
        applicationId: paymentData.application_id,
        paymentId: paymentData.paystack_reference,
        amount: paymentData.amount,
        paymentType: 'INSTALLMENT',
        status: 'FAILED',
      });

      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        reason: verification.status,
        code: 'PAYSTACK_VERIFICATION_FAILED',
      });
    }

    // STEP 3: Validate payment integrity
    if (verification.amount !== paymentData.amount) {
      console.warn('[Payment] Amount mismatch:', {
        paystack: verification.amount,
        database: paymentData.amount,
      });

      return res.status(400).json({
        success: false,
        error: 'Payment amount mismatch. Security validation failed',
        code: 'AMOUNT_MISMATCH',
      });
    }

    // STEP 4: Validate currency
    if (verification.currency !== 'GHS') {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment currency. Expected GHS',
        received: verification.currency,
        code: 'CURRENCY_MISMATCH',
      });
    }

    // STEP 5: Update payment record to completed
    const updatedPayment = await db.update(payments)
      .set({
        status: 'COMPLETED',
        completed_at: new Date(verification.paid_at),
        paystack_customer_code: verification.customer.customer_code,
        verification_result: JSON.stringify({
          status: verification.status,
          channel: verification.channel,
          paid_at: verification.paid_at,
          amount: verification.amount,
          currency: verification.currency,
        }),
      })
      .where(eq(payments.id, paymentData.id))
      .returning();

    // Audit log: Payment verification
    await logPayment({
      actorId: userId,
      actorRole: 'STUDENT',
      applicationId: paymentData.application_id,
      paymentId: paymentData.paystack_reference,
      amount: paymentData.amount,
      paymentType: 'INSTALLMENT',
      status: 'VERIFIED',
    });

    res.json({
      success: true,
      verified: true,
      payment: {
        reference: updatedPayment[0].payment_reference,
        amount: updatedPayment[0].amount,
        currency: updatedPayment[0].currency,
        status: updatedPayment[0].status,
        completedAt: updatedPayment[0].completed_at,
        channel: verification.channel,
      },
    });
  } catch (error) {
    console.error('[Payment] Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment verification failed',
      code: 'VERIFICATION_ERROR',
    });
  }
});

/**
 * GET /api/payments/status/:reference
 * Get payment status
 */
router.get('/status/:reference', authenticate, async (req, res) => {
  try {
    const { reference } = req.params;

    const paymentRecords = await db.select().from(payments)
      .where(eq(payments.payment_reference, reference));

    if (!paymentRecords || paymentRecords.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    const payment = paymentRecords[0];

    res.json({
      success: true,
      data: {
        reference: payment.payment_reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        initiatedAt: payment.initiated_at,
        completedAt: payment.completed_at,
        type: payment.type,
      },
    });
  } catch (error) {
    console.error('[Payment] Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment status',
    });
  }
});

/**
 * GET /api/payments/application/:applicationId
 * Get payment records for an application
 */
router.get('/application/:applicationId', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const paymentRecords = await db.select().from(payments)
      .where(eq(payments.application_id, applicationId));

    res.json({
      success: true,
      data: paymentRecords.map(p => ({
        reference: p.payment_reference,
        amount: p.amount,
        currency: p.currency,
        type: p.type,
        status: p.status,
        initiatedAt: p.initiated_at,
        completedAt: p.completed_at,
      })),
    });
  } catch (error) {
    console.error('[Payment] Application payments error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get application payments',
    });
  }
});

/**
 * POST /api/payments/webhook
 * Paystack webhook for payment confirmation
 * Verifies webhook signature and updates payment status
 */
router.post('/webhook', webhookLimiter, async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn('[Payment] Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }

    const { event, data } = req.body;

    if (event !== 'charge.success') {
      // Not a successful charge event
      return res.status(200).json({
        success: true,
        message: 'Event received but not processed',
      });
    }

    // Update payment record based on webhook data
    const paymentRecords = await db.select().from(payments)
      .where(eq(payments.paystack_reference, data.reference));

    if (paymentRecords && paymentRecords.length > 0) {
      const payment = paymentRecords[0];

      // Update to completed
      await db.update(payments)
        .set({
          status: 'COMPLETED',
          completed_at: new Date(data.paid_at),
          paystack_customer_code: data.customer?.customer_code,
          verification_result: JSON.stringify({
            status: 'success',
            channel: data.channel,
            paid_at: data.paid_at,
            amount: data.amount / 100, // Convert from pesewas
          }),
        })
        .where(eq(payments.id, payment.id));

      console.log(`[Payment] Webhook confirmed payment: ${data.reference}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Payment] Webhook error:', error);
    // Still return 200 to acknowledge webhook receipt
    res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  }
});

export default router;
