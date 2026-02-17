/**
 * Paystack Payment Service
 * Handles secure backend Paystack integration for installment payments
 * 
 * Features:
 * - Payment initialization (30% installment calculation)
 * - Server-side payment verification
 * - Duplicate payment prevention
 * - Payment record management
 * - GHS currency enforcement
 */

import process from 'process';
import https from 'https';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.warn('⚠️  PAYSTACK_SECRET_KEY not set in environment variables. Paystack payments will not work.');
}

/**
 * Initialize Paystack payment transaction
 * @param {Object} params - Payment initialization parameters
 * @param {string} params.email - Customer email
 * @param {number} params.amount - Amount in GHS (will be converted to pesewas)
 * @param {string} params.reference - Unique payment reference
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Paystack initialization response
 */
export async function initializePayment({ email, amount, reference, metadata = {} }) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  // Validate inputs
  if (!email || !email.includes('@')) {
    throw new Error('Valid email is required');
  }

  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (!reference) {
    throw new Error('Payment reference is required');
  }

  // Convert amount to pesewas (Paystack uses lowest currency unit)
  // 1 GHS = 100 pesewas
  const amountInPesewas = Math.round(amount * 100);

  const payload = {
    email,
    amount: amountInPesewas,
    currency: 'GHS',
    reference,
    metadata: {
      ...metadata,
      custom_fields: [
        {
          display_name: 'Payment Type',
          variable_name: 'payment_type',
          value: metadata.payment_type || 'INSTALLMENT',
        },
        {
          display_name: 'Application Reference',
          variable_name: 'application_ref',
          value: metadata.application_ref || 'N/A',
        },
      ],
    },
    channels: ['card', 'mobile_money', 'bank'], // Allow multiple payment methods
  };

  return new Promise((resolve, reject) => {
    const payloadString = JSON.stringify(payload);

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': new TextEncoder().encode(payloadString).length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode === 200 && response.status === true) {
            resolve({
              success: true,
              authorization_url: response.data.authorization_url,
              access_code: response.data.access_code,
              reference: response.data.reference,
            });
          } else {
            reject(new Error(response.message || 'Payment initialization failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Paystack request failed: ${error.message}`));
    });

    req.write(payloadString);
    req.end();
  });
}

/**
 * Verify Paystack payment
 * @param {string} reference - Payment reference to verify
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPayment(reference) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  if (!reference) {
    throw new Error('Payment reference is required');
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: `/transaction/verify/${encodeURIComponent(reference)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode === 200 && response.status === true) {
            const txData = response.data;

            resolve({
              success: true,
              verified: txData.status === 'success',
              amount: txData.amount / 100, // Convert pesewas back to GHS
              currency: txData.currency,
              reference: txData.reference,
              status: txData.status,
              paid_at: txData.paid_at,
              channel: txData.channel,
              customer: {
                email: txData.customer?.email,
                customer_code: txData.customer?.customer_code,
              },
              metadata: txData.metadata,
            });
          } else {
            reject(new Error(response.message || 'Payment verification failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse Paystack verification response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Paystack verification request failed: ${error.message}`));
    });

    req.end();
  });
}

/**
 * Generate unique payment reference
 * @param {string} applicationRef - Application reference (e.g., APP-2024-0001)
 * @param {string} type - Payment type (INITIAL_70 or FINAL_30)
 * @returns {string} Unique payment reference
 */
export function generatePaymentReference(applicationRef, type = 'FINAL_30') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const typePrefix = type === 'FINAL_30' ? 'INST' : 'INIT';
  
  // Format: INST-APP20240001-1707409234567-A1B2C3D4
  const cleanAppRef = applicationRef.replace(/[^A-Z0-9]/gi, '');
  return `${typePrefix}-${cleanAppRef}-${timestamp}-${random}`;
}

/**
 * Calculate installment amount (30% of total)
 * @param {number} totalPrice - Total laptop price in GHS
 * @returns {number} 30% installment amount in GHS (rounded to 2 decimals)
 */
export function calculateInstallmentAmount(totalPrice) {
  if (!totalPrice || totalPrice <= 0) {
    throw new Error('Invalid total price');
  }
  
  // Calculate 30% and round to 2 decimal places
  return Math.round(totalPrice * 0.30 * 100) / 100;
}

/**
 * Verify webhook signature from Paystack
 * @param {string} payload - Raw request body
 * @param {string} signature - X-Paystack-Signature header value
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(payload, signature) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

/**
 * Get payment status from Paystack
 * @param {string} reference - Payment reference
 * @returns {Promise<string>} Payment status (success, failed, pending, etc.)
 */
export async function getPaymentStatus(reference) {
  try {
    const verification = await verifyPayment(reference);
    return verification.status;
  } catch (error) {
    console.error('[Paystack] Failed to get payment status:', error);
    throw error;
  }
}

/**
 * Refund a payment (if supported by Paystack)
 * @param {string} reference - Payment reference to refund
 * @param {number} amount - Amount to refund in GHS (optional, defaults to full amount)
 * @returns {Promise<Object>} Refund result
 */
export async function refundPayment(reference, amount = null) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured');
  }

  // Note: Paystack refunds may require additional configuration
  const payload = {
    transaction: reference,
  };

  if (amount !== null) {
    payload.amount = Math.round(amount * 100); // Convert to pesewas
  }

  return new Promise((resolve, reject) => {
    const payloadString = JSON.stringify(payload);

    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/refund',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': new TextEncoder().encode(payloadString).length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode === 200 && response.status === true) {
            resolve({
              success: true,
              message: response.message,
              data: response.data,
            });
          } else {
            reject(new Error(response.message || 'Refund failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse refund response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Refund request failed: ${error.message}`));
    });

    req.write(payloadString);
    req.end();
  });
}

export default {
  initializePayment,
  verifyPayment,
  generatePaymentReference,
  calculateInstallmentAmount,
  verifyWebhookSignature,
  getPaymentStatus,
  refundPayment,
};
