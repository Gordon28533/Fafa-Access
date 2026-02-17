// studentNotificationTriggers.js
// Student notification triggers routed through the event-driven NotificationService
import NotificationService from './NotificationService';

export function notifyApplicationSubmitted({ recipientName, applicationRef, university }) {
  return NotificationService.publishEvent('student.applicationSubmitted', { recipientName, applicationRef, university });
}

export function notifySRCApproved({ recipientName, applicationRef, university }) {
  return NotificationService.publishEvent('student.srcApproved', { recipientName, applicationRef, university });
}

export function notifySRCRejected({ recipientName, applicationRef, reason }) {
  return NotificationService.publishEvent('student.srcRejected', { recipientName, applicationRef, reason });
}

export function notifyAdminApproved({ recipientName, applicationRef, university }) {
  return NotificationService.publishEvent('student.adminApproved', { recipientName, applicationRef, university });
}

export function notifyAdminRejected({ recipientName, applicationRef, reason }) {
  return NotificationService.publishEvent('student.adminRejected', { recipientName, applicationRef, reason });
}

export function notifyDeliveryAssigned({ recipientName, applicationRef, deliveryAgent, deliveryDate, university }) {
  return NotificationService.publishEvent('student.deliveryAssigned', { recipientName, applicationRef, deliveryAgent, deliveryDate, university });
}

export function notifyLaptopDelivered({ recipientName, applicationRef, university }) {
  return NotificationService.publishEvent('student.deliveryCompleted', { recipientName, applicationRef, university });
}

export function notifyPaymentCollected({ recipientName, applicationRef, amount, university }) {
  return NotificationService.publishEvent('student.paymentCollected', { recipientName, applicationRef, amount, university });
}
