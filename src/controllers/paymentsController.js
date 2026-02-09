import { db } from '../db/connection.js';
import { sql } from 'drizzle-orm';
import { auditLogService } from '../services/auditLogAdapter.js';

// GET /api/payments/status/my
export async function getMyPaymentStatus(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Find outstanding FINAL_30 for user's applications
    const result = await db.execute(sql`
      SELECT a.id as application_id, a.reference, a.total_price, d.delivery_date
      FROM applications a
      JOIN student_profiles sp ON a.student_id = sp.id
      LEFT JOIN deliveries d ON d.application_id = a.id
      WHERE sp.user_id = ${userId}
      AND EXISTS (
        SELECT 1 FROM payments p
        WHERE p.application_id = a.id AND p.type = 'FINAL_30' AND p.status = 'PENDING'
      )
      LIMIT 1
    `);

    const row = result.rows[0];
    if (!row) {
      return res.json({ hasOutstanding30: false });
    }

    const outstandingAmount = Number(row.total_price || 0) * 0.3;
    const baseDate = row.delivery_date ? new Date(row.delivery_date) : new Date();
    const dueDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    return res.json({
      hasOutstanding30: true,
      applicationRef: row.reference,
      outstandingAmount,
      dueDate: dueDate.toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch payment status' });
  }
}

// POST /api/payments/paystack/initiate
export async function initiatePaystack(req, res) {
  try {
    const { amount, applicationRef } = req.body || {};
    if (!amount || !applicationRef) {
      return res.status(400).json({ error: 'amount and applicationRef required' });
    }
    const reference = `PSK-${applicationRef}-${Date.now()}`;
    const checkoutUrl = `https://paystack.com/checkout/${reference}`;
    
    // ✅ AUDIT LOG: Log payment initiation
    const userId = req.user?.userId;
    if (userId) {
      await auditLogService.logPaymentInitiation(userId, applicationRef, {
        amount,
        applicationRef,
        paymentReference: reference,
        paymentGateway: 'PAYSTACK'
      }, req.ip || req.connection?.remoteAddress).catch(err => {
        console.warn('Failed to log payment initiation:', err);
      });
    }
    
    return res.json({ success: true, reference, checkoutUrl });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to initiate payment' });
  }
}

// POST /api/payments/paystack/verify
export async function verifyPaystack(req, res) {
  try {
    const { reference } = req.body || {};
    if (!reference) {
      return res.status(400).json({ error: 'reference required' });
    }
    
    // ✅ AUDIT LOG: Log payment verification attempt
    const userId = req.user?.userId;
    if (userId) {
      await auditLogService.logPaymentVerification(userId, null, {
        paymentReference: reference,
        paymentGateway: 'PAYSTACK',
        status: 'PENDING'
      }, req.ip || req.connection?.remoteAddress).catch(err => {
        console.warn('Failed to log payment verification:', err);
      });
    }
    
    // Placeholder: always return pending
    return res.json({ success: false, status: 'PENDING', reference });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
}
