import { db } from '../db/connection.js';
import { sql } from 'drizzle-orm';
import { logger } from '../observability.js';
import { auditLogService } from '../services/auditLogAdapter.js';
import { sendPaymentRequiredEmail } from '../services/emailNotifications.js';
import { logDelivery, logPayment } from '../utils/auditLogger.js';

// POST /api/delivery/confirm
// Body: { ref: string, receiptRef: string, paymentCollected: boolean }
export async function confirmDelivery(req, res) {
  try {
    const { ref, receiptRef, paymentCollected } = req.body || {};
    if (!ref || !receiptRef) {
      return res.status(400).json({ error: 'ref and receiptRef are required' });
    }

    // Get application and price
    const appResult = await db.execute(sql`
      SELECT id, total_price, student_id, name, reference
      FROM applications WHERE reference = ${ref}
      LIMIT 1
    `);
    const app = appResult.rows[0];

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const applicationId = app.id;
    const amountInitial70 = Number(app.total_price || 0) * 0.7;

    // Update deliveries row (assumes it exists from assignment)
    await db.execute(sql`
      UPDATE deliveries
      SET delivered = ${true},
          payment_confirmed = ${!!paymentCollected},
          student_signature_ref = ${receiptRef},
          confirmed_by = ${req.user?.email || 'delivery_staff'}
      WHERE application_id = ${applicationId}
    `);

    // Upsert initial 70% payment record
    await db.execute(sql`
      INSERT INTO payments (application_id, amount, type, status, collected_by, collected_at)
      VALUES (${applicationId}, ${amountInitial70}, 'INITIAL_70', ${paymentCollected ? 'COLLECTED' : 'PENDING'}, ${req.user?.email || 'delivery_staff'}, NOW())
      ON CONFLICT (application_id, type)
      DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount, collected_by = EXCLUDED.collected_by, collected_at = EXCLUDED.collected_at
    `);

    // Update application status and history
    await db.execute(sql`
      UPDATE applications SET status = 'DELIVERED', updated_at = NOW() WHERE id = ${applicationId}
    `);

    await db.execute(sql`
      INSERT INTO application_status_history (application_id, status, changed_by, timestamp)
      VALUES (${applicationId}, 'DELIVERED', ${req.user?.email || 'delivery_staff'}, NOW())
    `);

    // Create pending FINAL_30 payment record for outstanding balance
    const amountFinal30 = Number(app.total_price || 0) * 0.3;
    await db.execute(sql`
      INSERT INTO payments (application_id, amount, type, status)
      VALUES (${applicationId}, ${amountFinal30}, 'FINAL_30', 'PENDING')
      ON CONFLICT (application_id, type)
      DO NOTHING
    `);

    logger.info({ ref, receiptRef, paymentCollected }, 'Delivery confirmed');

    // Audit log: Delivery confirmed
    await auditLogService.logDeliveryConfirmed(
      req.user?.userId || req.user?.email || 'delivery_staff',
      applicationId,
      app.reference,
      req.ip || req.connection?.remoteAddress
    );

    // New comprehensive audit logging
    await logDelivery({
      actorId: req.user?.userId || req.user?.email || 'delivery_staff',
      actorRole: 'DELIVERY_STAFF',
      applicationId: applicationId,
      deliveredBy: req.user?.email || 'delivery_staff',
      status: 'DELIVERED',
    });

    // Audit log: Payment collected (if applicable)
    if (paymentCollected) {
      await auditLogService.logPaymentCollected(
        req.user?.userId || req.user?.email || 'delivery_staff',
        applicationId,
        app.reference,
        amountInitial70,
        'INITIAL_70',
        req.ip || req.connection?.remoteAddress
      );

      // New comprehensive payment audit logging
      await logPayment({
        actorId: req.user?.userId || req.user?.email || 'delivery_staff',
        actorRole: 'DELIVERY_STAFF',
        applicationId: applicationId,
        paymentId: `${app.reference}-INITIAL_70`,
        amount: amountInitial70,
        paymentType: 'INITIAL_70',
        status: 'COLLECTED',
      });
    }

    // Send payment required email to student (non-blocking)
    const studentEmail = await db.execute(sql`
      SELECT u.email, sp.full_name
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ${app.student_id}
      LIMIT 1
    `);
    
    if (studentEmail.rows.length > 0 && studentEmail.rows[0].email) {
      sendPaymentRequiredEmail(studentEmail.rows[0].email, {
        name: studentEmail.rows[0].full_name || app.name || 'Student',
        applicationRef: app.reference,
        amount: `GHS ${amountFinal30.toFixed(2)}`,
        paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB') // 30 days from now
      }).catch(error => {
        logger.error({ err: error, applicationId: app.id }, 'Failed to send payment required email');
      });
    }

    return res.json({ success: true, ref, receiptRef, paymentCollected: !!paymentCollected });
  } catch (error) {
    logger.error({ err: error }, 'confirmDelivery failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/delivery/confirm-payment
// Body: { ref: string, amount?: number }
export async function confirmPayment(req, res) {
  try {
    const { ref, amount } = req.body || {};
    if (!ref) {
      return res.status(400).json({ error: 'ref is required' });
    }

    const appResult = await db.execute(sql`SELECT id, total_price FROM applications WHERE reference = ${ref} LIMIT 1`);
    const app = appResult.rows[0];
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const applicationId = app.id;
    const amt = typeof amount === 'number' ? amount : Number(app.total_price || 0) * 0.3;

    await db.execute(sql`
      INSERT INTO payments (application_id, amount, type, status, collected_by, collected_at)
      VALUES (${applicationId}, ${amt}, 'FINAL_30', 'COLLECTED', ${req.user?.email || 'delivery_staff'}, NOW())
      ON CONFLICT (application_id, type)
      DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount, collected_by = EXCLUDED.collected_by, collected_at = EXCLUDED.collected_at
    `);

    await db.execute(sql`UPDATE applications SET status = 'COMPLETED', updated_at = NOW() WHERE id = ${applicationId}`);
    await db.execute(sql`
      INSERT INTO application_status_history (application_id, status, changed_by, timestamp)
      VALUES (${applicationId}, 'COMPLETED', ${req.user?.email || 'delivery_staff'}, NOW())
    `);

    logger.info({ ref, amt }, 'Final payment confirmed');

    // Audit log: Payment confirmed
    await auditLogService.logPaymentConfirmed(
      req.user?.userId || req.user?.email || 'admin',
      applicationId,
      ref,
      amt,
      'FINAL_30',
      req.ip || req.connection?.remoteAddress
    );

    return res.json({ success: true, ref, amount: amt });
  } catch (error) {
    logger.error({ err: error }, 'confirmPayment failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}
