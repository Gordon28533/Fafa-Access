/**
 * Application Audit Logging Integration
 * 
 * This module adds audit logging to sensitive application operations.
 * 
 * Key locations to integrate audit logging:
 * 1. createApplication - Log when student submits application
 * 2. updateApplicationStatus - Log SRC/Admin decisions
 * 3. approveApplicationBySrc - Log SRC approval/rejection
 * 4. approveApplicationByAdmin - Log Admin approval/rejection  
 * 5. assignDelivery - Log delivery assignment
 * 6. confirmDelivery - Log delivery confirmation
 * 7. confirmPayment - Log payment confirmation
 */

// Audit logging integration (currently not used - full integration completed)
// Kept for reference of audit structure

/**
 * INTEGRATION STEPS:
 * 
 * 1. ADD THIS IMPORT AT TOP OF applicationController.js:
 *    import { createAuditContext } from '../middleware/auditContextMiddleware.js';
 *    import { logApplicationSubmission, logSrcDecision, logAdminDecision, ... } from '../services/AuditLogService.js';
 * 
 * 2. IN createApplication():
 *    After successful application creation, add:
 *    const auditContext = createAuditContext(req);
 *    await logApplicationSubmission(
 *      profile.id,
 *      result.id,
 *      laptopId,
 *      auditContext,
 *      { laptopBrand: selectedLaptop.brand, laptopModel: selectedLaptop.model }
 *    );
 * 
 * 3. IN approveApplicationBySrc():
 *    After status update, add:
 *    const auditContext = createAuditContext(req);
 *    await logSrcDecision(
 *      req.user.userId,
 *      applicationId,
 *      status === 'SRC_APPROVED' ? 'APPROVED' : 'REJECTED',
 *      reason || 'No reason provided',
 *      auditContext,
 *      { previousStatus: application.status, newStatus: status }
 *    );
 * 
 * 4. IN approveApplicationByAdmin():
 *    After status update, add:
 *    const auditContext = createAuditContext(req);
 *    await logAdminDecision(
 *      req.user.userId,
 *      applicationId,
 *      status === 'ADMIN_APPROVED' ? 'APPROVED' : 'REJECTED',
 *      reason || 'No reason provided',
 *      auditContext,
 *      { previousStatus: application.status, newStatus: status }
 *    );
 * 
 * 5. IN assignDelivery():
 *    After delivery assignment, add:
 *    const auditContext = createAuditContext(req);
 *    await logDeliveryAssignment(
 *      staffName,
 *      applicationId,
 *      location,
 *      auditContext,
 *      { deliveryDate: new Date(deliveryDate).toISOString() }
 *    );
 * 
 * 6. IN confirmDelivery():
 *    After delivery confirmation, add:
 *    const auditContext = createAuditContext(req);
 *    await logDeliveryConfirmation(
 *      req.user.userId,
 *      applicationId,
 *      delivery.deliveryDate.toISOString(),
 *      auditContext
 *    );
 * 
 * 7. IN confirmPayment():
 *    After payment confirmation, add:
 *    const auditContext = createAuditContext(req);
 *    await logPaymentConfirmation(
 *      applicationId,
 *      payment.amount,
 *      payment.type,
 *      auditContext,
 *      { paymentMethod: 'CASH', collectedBy: req.user.userId }
 *    );
 */

export const AUDIT_INTEGRATION_TEMPLATE = {
  createApplication: `
    // After: const result = await db.transaction(...)
    const auditContext = createAuditContext(req);
    await logApplicationSubmission(
      profile.id,
      result.id,
      laptopId,
      auditContext,
      { 
        laptopBrand: selectedLaptop.brand, 
        laptopModel: selectedLaptop.model,
        level,
        course
      }
    );
  `,
  
  approveApplicationBySrc: `
    // After: await db.update(applications).set({ status, ... })
    const auditContext = createAuditContext(req);
    await logSrcDecision(
      req.user.userId,
      applicationId,
      status === 'SRC_APPROVED' ? 'APPROVED' : 'REJECTED',
      reason || 'No reason provided',
      auditContext,
      { 
        previousStatus: application.status, 
        newStatus: status,
        srcOfficerId: application.srcOfficerId
      }
    );
  `,
  
  approveApplicationByAdmin: `
    // After: await db.update(applications).set({ status, ... })
    const auditContext = createAuditContext(req);
    await logAdminDecision(
      req.user.userId,
      applicationId,
      status === 'ADMIN_APPROVED' ? 'APPROVED' : 'REJECTED',
      reason || 'No reason provided',
      auditContext,
      { 
        previousStatus: application.status, 
        newStatus: status
      }
    );
  `,
  
  assignDelivery: `
    // After: const delivery = await db.insert(deliveries).values(...)
    const auditContext = createAuditContext(req);
    await logDeliveryAssignment(
      staffName,
      applicationId,
      location,
      auditContext,
      { 
        deliveryDate: new Date(deliveryDate).toISOString(),
        deliveryId: delivery.id
      }
    );
  `,
  
  confirmDelivery: `
    // After: await db.update(deliveries).set({ delivered: true, ... })
    const auditContext = createAuditContext(req);
    await logDeliveryConfirmation(
      req.user.userId,
      applicationId,
      delivery.deliveryDate.toISOString(),
      auditContext,
      {
        deliveryId: applicationId,
        deliveryPhotoRef,
        studentSignatureRef
      }
    );
  `,
  
  confirmPayment: `
    // After: const payment = await db.update(payments).set({ status: 'COLLECTED', ... })
    const auditContext = createAuditContext(req);
    await logPaymentConfirmation(
      applicationId,
      payment.amount,
      payment.type,
      auditContext,
      { 
        paymentMethod: 'CASH',
        collectedBy: req.user.userId,
        paymentId: payment.id
      }
    );
  `
};

/**
 * Helper to format audit log for API response
 */
export function formatAuditLog(log) {
  return {
    id: log.id,
    action: log.action,
    actor: {
      id: log.actorId,
      role: log.actorRole,
    },
    timestamp: log.timestamp,
    applicationId: log.applicationId,
    details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
  };
}
