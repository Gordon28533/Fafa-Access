// adminNotificationTriggers.js
// Admin notification triggers routed through the event-driven NotificationService
import NotificationService from './NotificationService';

export function notifyAdminSRCApproved({ studentName, applicationRef }) {
  return NotificationService.publishEvent('admin.srcApproved', { studentName, applicationRef });
}

export function notifyAdminSRCRejected({ studentName, applicationRef }) {
  return NotificationService.publishEvent('admin.srcRejected', { studentName, applicationRef });
}

export function notifyAdminApplicationRejected({ studentName, applicationRef, reason }) {
  return NotificationService.publishEvent('admin.adminRejected', { studentName, applicationRef, reason });
}

export function notifyAdminDeliveryAssigned({ studentName, applicationRef, deliveryAgent }) {
  return NotificationService.publishEvent('admin.deliveryAssigned', { studentName, applicationRef, deliveryAgent });
}

export function notifyAdminDeliveryConfirmed({ studentName, applicationRef }) {
  return NotificationService.publishEvent('admin.deliveryConfirmed', { studentName, applicationRef });
}

export function notifyAdminPaymentCollected({ studentName, applicationRef, amount }) {
  return NotificationService.publishEvent('admin.paymentCollected', { studentName, applicationRef, amount });
}

export function notifyAdminPayoutCompleted({ studentName, applicationRef, amount, method }) {
  return NotificationService.publishEvent('admin.payoutCompleted', { studentName, applicationRef, amount, method });
}
