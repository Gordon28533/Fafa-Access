/**
 * Email Notification Helper
 * Convenient wrapper for sending transactional emails throughout the application
 * 
 * Usage:
 * import { sendApplicationSubmittedEmail } from './emailNotifications.js';
 * 
 * await sendApplicationSubmittedEmail(student.email, {
 *   name: 'John Doe',
 *   applicationRef: 'APP-2024-0001',
 *   submissionDate: '2024-02-06',
 *   dashboardUrl: 'https://yourapp.com/dashboard'
 * });
 */

import { getEmailService } from './TransactionalEmailService.js';

const emailService = getEmailService();

/**
 * Send application submitted confirmation email
 */
export async function sendApplicationSubmittedEmail(recipientEmail, data) {
  return emailService.send({
    to: recipientEmail,
    templateName: 'applicationSubmitted',
    data: {
      name: data.name || 'Student',
      applicationRef: data.applicationRef,
      submissionDate: data.submissionDate || new Date().toLocaleDateString(),
      dashboardUrl: data.dashboardUrl || 'https://app.fafaaccess.edu.gh/dashboard',
      ...data,
    },
    logToAudit: true,
  });
}

/**
 * Send application approved email
 */
export async function sendApplicationApprovedEmail(recipientEmail, data) {
  return emailService.send({
    to: recipientEmail,
    templateName: 'applicationApproved',
    data: {
      name: data.name || 'Student',
      applicationRef: data.applicationRef,
      approvalDate: data.approvalDate || new Date().toLocaleDateString(),
      laptopModel: data.laptopModel || 'Selected Laptop',
      dashboardUrl: data.dashboardUrl || 'https://app.fafaaccess.edu.gh/dashboard',
      ...data,
    },
    logToAudit: true,
  });
}

/**
 * Send application rejected email
 */
export async function sendApplicationRejectedEmail(recipientEmail, data) {
  return emailService.send({
    to: recipientEmail,
    templateName: 'applicationRejected',
    data: {
      name: data.name || 'Student',
      applicationRef: data.applicationRef,
      decisionDate: data.decisionDate || new Date().toLocaleDateString(),
      rejectionReason: data.rejectionReason || 'Application requirements not met',
      ...data,
    },
    logToAudit: true,
  });
}

/**
 * Send delivery scheduled email
 */
export async function sendDeliveryScheduledEmail(recipientEmail, data) {
  return emailService.send({
    to: recipientEmail,
    templateName: 'deliveryScheduled',
    data: {
      name: data.name || 'Student',
      applicationRef: data.applicationRef,
      deliveryDate: data.deliveryDate,
      deliveryTimeWindow: data.deliveryTimeWindow || '9:00 AM - 5:00 PM',
      agentName: data.agentName,
      location: data.location,
      agentPhone: data.agentPhone,
      dashboardUrl: data.dashboardUrl || 'https://app.fafaaccess.edu.gh/dashboard',
      ...data,
    },
    logToAudit: true,
  });
}

/**
 * Send payment required email
 */
export async function sendPaymentRequiredEmail(recipientEmail, data) {
  return emailService.send({
    to: recipientEmail,
    templateName: 'paymentRequired',
    data: {
      name: data.name || 'Student',
      applicationRef: data.applicationRef,
      amount: data.amount,
      paymentDueDate: data.paymentDueDate || new Date().toLocaleDateString(),
      ...data,
    },
    logToAudit: true,
  });
}

/**
 * Send custom email using any template
 * @param {string} to - Recipient email
 * @param {string} templateName - Template name (see TransactionalEmailService for available templates)
 * @param {Object} data - Data for template variable replacement
 */
export async function sendCustomEmail(to, templateName, data) {
  return emailService.send({
    to,
    templateName,
    data,
    logToAudit: true,
  });
}

/**
 * Send email with error handling - returns null on failure instead of throwing
 */
export async function sendEmailSafely(to, templateName, data) {
  try {
    return await emailService.send({
      to,
      templateName,
      data,
      logToAudit: true,
    });
  } catch (error) {
    console.error(`[EmailNotifications] Failed to send ${templateName} to ${to}:`, error.message);
    // Don't rethrow - allow application to continue
    return { error: error.message, sent: false };
  }
}

/**
 * Get the email service instance for advanced usage
 */
export function getEmailServiceInstance() {
  return emailService;
}

/**
 * Get available email templates
 */
export function getAvailableEmailTemplates() {
  return emailService.getAvailableTemplates();
}
