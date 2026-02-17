// deliveryNotificationTriggers.js
// Delivery staff notification triggers routed through the event-driven NotificationService
import NotificationService from './NotificationService';

export function notifyDeliveryAssigned({ recipientName, studentName, location, deliveryDate }) {
  return NotificationService.publishEvent('delivery.assigned', { recipientName, studentName, location, deliveryDate });
}

export function notifyDeliveryReminder({ recipientName, studentName, location, deliveryDate }) {
  return NotificationService.publishEvent('delivery.reminder', { recipientName, studentName, location, deliveryDate });
}

export function notifyPaymentCollection({ recipientName, studentName, location, deliveryDate }) {
  return NotificationService.publishEvent('delivery.paymentCollection', { recipientName, studentName, location, deliveryDate });
}

export function notifyDeliveryConfirmationPending({ recipientName, studentName, location, deliveryDate }) {
  return NotificationService.publishEvent('delivery.confirmationPending', { recipientName, studentName, location, deliveryDate });
}
