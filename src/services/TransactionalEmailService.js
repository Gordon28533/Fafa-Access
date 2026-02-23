/**
 * Transactional Email Service
 * Backend-only email notification system with template support, retry logic, and error handling
 * 
 * Supports multiple providers: SMTP, SendGrid, Resend
 * Features:
 * - Transactional email templates with dynamic data
 * - Automatic retry with exponential backoff
 * - Comprehensive error logging
 * - Provider abstraction for easy switching
 */

import process from 'process';
import { EventEmitter } from 'events';
import { Resend } from 'resend';
import { db } from '../db/connection.js';
import { auditLogs } from '../db/schema/index.js';
import { logEmailSend, logEmailAudit } from './emailLogging.js';

// ============================================================================
// Email Providers
// ============================================================================

class EmailProvider {
  async send() {
    throw new Error('send() not implemented');
  }
}

/**
 * SMTP Provider - Direct SMTP server connection
 */
class SmtpProvider extends EmailProvider {
  constructor({ host, port = 587, secure = false, user, pass, fromEmail, fromName }) {
    super();
    this.host = host;
    this.port = port;
    this.secure = secure;
    this.user = user;
    this.pass = pass;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async send({ to, subject, html, text, from }) {
    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
    } catch (error) {
      console.warn('[TransactionalEmailService] nodemailer not installed; simulating email');
      return this._simulateSend(to, subject);
    }

    if (!nodemailer.createTransport) {
      console.warn('[TransactionalEmailService] nodemailer.createTransport not available');
      return this._simulateSend(to, subject);
    }

    const transport = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: this.user && this.pass ? { user: this.user, pass: this.pass } : undefined,
    });

    const info = await transport.sendMail({
      from: from || `${this.fromName} <${this.fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    return {
      messageId: info?.messageId || `smtp-${Date.now()}`,
      provider: 'smtp',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
  }

  _simulateSend(to, subject) {
    console.log(`[SMTP-SIMULATION] Email to ${to}: ${subject}`);
    return {
      messageId: `smtp-sim-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      provider: 'smtp',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * SendGrid Provider - SendGrid API integration
 */
class SendGridProvider extends EmailProvider {
  constructor({ apiKey, fromEmail, fromName }) {
    super();
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async send({ to, subject, html, text, from }) {
    const url = 'https://api.sendgrid.com/v3/mail/send';
    const body = {
      personalizations: [{ to: [{ email: to }] }],
      from: { 
        email: from || this.fromEmail,
        name: this.fromName || 'Fafa Access'
      },
      subject,
      content: [
        { type: 'text/plain', value: text || '' },
        { type: 'text/html', value: html || '' },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const reason = await response.text();
      throw new Error(`SendGrid failed (${response.status}): ${reason}`);
    }

    return {
      messageId: `sg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      provider: 'sendgrid',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Resend Provider - Resend API integration using the official Resend SDK
 * https://resend.com
 */
class ResendProvider extends EmailProvider {
  constructor({ apiKey, fromEmail, fromName }) {
    super();
    this.fromEmail = fromEmail;
    this.fromName = fromName;
    this._client = new Resend(apiKey);
  }

  async send({ to, subject, html, text, from }) {
    const { data, error } = await this._client.emails.send({
      from: from || `${this.fromName || 'Fafa Access'} <${this.fromEmail}>`,
      to,
      subject,
      html: html || text,
      text: text || undefined,
      reply_to: this.fromEmail,
    });

    if (error) {
      throw new Error(`Resend failed: ${error.message || JSON.stringify(error)}`);
    }

    return {
      messageId: data?.id || `resend-${Date.now()}`,
      provider: 'resend',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Transactional email templates
 * Each template has: subject, htmlTemplate, textTemplate
 * Supports {{variable}} placeholders
 */
const emailTemplates = {
  // Application Lifecycle
  applicationSubmitted: {
    subject: '🎓 Laptop Application Received - Ref: {{applicationRef}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .section { margin: 20px 0; line-height: 1.6; }
    .highlight { background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; }
    .button { background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 15px 0; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Received</h1>
      <p>Your laptop application has been submitted successfully</p>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>We have successfully received your laptop application. Thank you for submitting your details.</p>
      <div class="highlight">
        <strong>Application Reference:</strong> {{applicationRef}}<br>
        <strong>Submission Date:</strong> {{submissionDate}}<br>
        <strong>Status:</strong> Under SRC Review
      </div>
      <div class="section">
        <h3>What's Next?</h3>
        <p>Your application is now with the Student Representative Council (SRC) for initial review. We will notify you once the SRC has made a decision. This typically takes 3-5 business days.</p>
      </div>
      <div class="section">
        <p><strong>Track your application:</strong> Log in to your account to monitor progress in real-time.</p>
        <a href="{{dashboardUrl}}" class="button">View Application Status</a>
      </div>
      <div class="footer">
        <p>This is an automated message. Please do not reply to this email. For assistance, contact support@fafaaccess.edu.gh</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Dear {{name}},

We have received your laptop application.

Application Reference: {{applicationRef}}
Submission Date: {{submissionDate}}
Status: Under SRC Review

Your application is now with the SRC for initial review. You will be notified once they have made a decision (typically 3-5 business days).

Track your application: {{dashboardUrl}}

Best regards,
Fafa Access Team
    `,
  },

  applicationApproved: {
    subject: '✅ Good News! Your Application Has Been Approved - Ref: {{applicationRef}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
    .button { background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 15px 0; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Application Approved!</h1>
      <p>Congratulations! Your laptop application has been approved.</p>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>We are pleased to inform you that your laptop application has been approved by both the SRC and Admin teams!</p>
      <div class="highlight">
        <strong>Application Reference:</strong> {{applicationRef}}<br>
        <strong>Approval Date:</strong> {{approvalDate}}<br>
        <strong>Selected Laptop:</strong> {{laptopModel}}<br>
        <strong>Status:</strong> Delivery Scheduling
      </div>
      <div class="section">
        <h3>Next Steps</h3>
        <p>We will contact you shortly (within 2 business days) to schedule your delivery. Please ensure your contact details are up-to-date in your profile.</p>
      </div>
      <a href="{{dashboardUrl}}" class="button">View Application Details</a>
      <div class="footer">
        <p>Thank you for using Fafa Access. For support, contact support@fafaaccess.edu.gh</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Dear {{name}},

Congratulations! Your laptop application has been approved.

Application Reference: {{applicationRef}}
Approval Date: {{approvalDate}}
Selected Laptop: {{laptopModel}}
Status: Delivery Scheduling

We will contact you shortly to schedule delivery. Please ensure your contact details are current.

View details: {{dashboardUrl}}

Best regards,
Fafa Access Team
    `,
  },

  applicationRejected: {
    subject: '📋 Application Decision - Ref: {{applicationRef}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight { background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Decision</h1>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>Thank you for submitting your laptop application. After careful review, we regret to inform you that your application was not approved at this time.</p>
      <div class="highlight">
        <strong>Application Reference:</strong> {{applicationRef}}<br>
        <strong>Decision Date:</strong> {{decisionDate}}<br>
        <strong>Reason:</strong> {{rejectionReason}}
      </div>
      <div class="section">
        <h3>What Can You Do?</h3>
        <p>If you have questions about this decision, please contact the SRC or Admin office. You may be eligible to reapply in the next cycle.</p>
      </div>
      <div class="footer">
        <p>For support, contact support@fafaaccess.edu.gh</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Dear {{name}},

Thank you for your application. Unfortunately, it was not approved.

Application Reference: {{applicationRef}}
Decision Date: {{decisionDate}}
Reason: {{rejectionReason}}

For questions, please contact the SRC or Admin office. You may be eligible to reapply in the next cycle.

Best regards,
Fafa Access Team
    `,
  },

  deliveryScheduled: {
    subject: '📦 Your Laptop Delivery is Scheduled - Ref: {{applicationRef}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .details { background: #eff6ff; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .button { background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 15px 0; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Delivery Scheduled</h1>
      <p>Your laptop is ready for delivery</p>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>Your laptop delivery has been scheduled. Please see the details below:</p>
      <div class="details">
        <strong>📅 Delivery Date:</strong> {{deliveryDate}}<br>
        <strong>⏰ Time Window:</strong> {{deliveryTimeWindow}}<br>
        <strong>🚗 Agent Name:</strong> {{agentName}}<br>
        <strong>📍 Location:</strong> {{location}}<br>
        <strong>☎️ Agent Contact:</strong> {{agentPhone}}
      </div>
      <p><strong>Important:</strong> You must be available at the scheduled time. The delivery agent will also collect the required payment during delivery.</p>
      <a href="{{dashboardUrl}}" class="button">View Delivery Details</a>
      <div class="footer">
        <p>If you need to reschedule, contact support@fafaaccess.edu.gh at least 24 hours before your scheduled delivery.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Dear {{name}},

Your laptop delivery has been scheduled.

Delivery Details:
- Date: {{deliveryDate}}
- Time: {{deliveryTimeWindow}}
- Agent: {{agentName}}
- Location: {{location}}
- Agent Phone: {{agentPhone}}

You must be available. The agent will collect payment during delivery.

View details: {{dashboardUrl}}

Contact us 24 hours before delivery to reschedule: support@fafaaccess.edu.gh

Best regards,
Fafa Access Team
    `,
  },

  paymentRequired: {
    subject: '💳 Payment Required - Ref: {{applicationRef}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .amount { background: #fffbeb; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
    .amount-value { font-size: 32px; font-weight: bold; color: #f59e0b; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Required</h1>
      <p>Please collect payment on delivery</p>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>Your approved laptop application requires payment before final delivery.</p>
      <div class="amount">
        <p>Amount Due:</p>
        <div class="amount-value">GHS {{amount}}</div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 10px;">Due on delivery ({{paymentDueDate}})</p>
      </div>
      <div class="section">
        <h3>Payment Instructions</h3>
        <p>The delivery agent will collect payment on delivery. Please ensure you have the required amount available.</p>
        <p><strong>Payment Methods Accepted:</strong> Cash, Mobile Money</p>
      </div>
      <div class="footer">
        <p>For payment questions, contact support@fafaaccess.edu.gh</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Dear {{name}},

Payment is required for your laptop delivery.

Amount Due: GHS {{amount}}
Due Date: {{paymentDueDate}}

The delivery agent will collect payment on delivery. Please ensure you have the correct amount ready.

Accepted: Cash, Mobile Money

For questions: support@fafaaccess.edu.gh

Best regards,
Fafa Access Team
    `,
  },

  emailVerification: {
    subject: 'Verify your Fafa Access email',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #111827; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; }
    .button { background: #2563eb; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 16px 0; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify your email</h1>
    </div>
    <div class="content">
      <p>Hello {{name}},</p>
      <p>Thanks for signing up for Fafa Access. Confirm your email to activate your account.</p>
      <a href="{{verifyUrl}}" class="button">Verify Email</a>
      <p>If the button does not work, copy this link into your browser:</p>
      <p>{{verifyUrl}}</p>
      <div class="footer">
        <p>This link expires in 24 hours. If you did not create this account, ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Hello {{name}},

Thanks for signing up for Fafa Access. Confirm your email to activate your account:
{{verifyUrl}}

This link expires in 24 hours. If you did not create this account, ignore this email.
    `,
  },

  passwordReset: {
    subject: 'Reset your Fafa Access password',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #374151; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7c2d12; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; }
    .button { background: #b91c1c; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 16px 0; }
    .footer { color: #9ca3af; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password reset request</h1>
    </div>
    <div class="content">
      <p>Hello {{name}},</p>
      <p>We received a request to reset your password. Use the link below to choose a new one.</p>
      <a href="{{resetUrl}}" class="button">Reset Password</a>
      <p>If the button does not work, copy this link into your browser:</p>
      <p>{{resetUrl}}</p>
      <div class="footer">
        <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `Hello {{name}},

We received a request to reset your password. Use this link to choose a new one:
{{resetUrl}}

This link expires in 1 hour. If you did not request a reset, ignore this email.
    `,
  },
};

// ============================================================================
// Transactional Email Service
// ============================================================================

/**
 * Main transactional email service
 * Handles sending, templating, retry logic, and error handling
 */
class TransactionalEmailService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.provider = this._initProvider(
      options.provider || process.env.EMAIL_PROVIDER || 'smtp',
      options
    );
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // ms
    this.logger = options.logger || console;
  }

  /**
   * Initialize email provider based on configuration
   */
  _initProvider(providerName, options) {
    const config = {
      fromEmail: options.fromEmail || process.env.EMAIL_FROM_ADDRESS || 'noreply@fafaaccess.edu.gh',
      fromName: options.fromName || process.env.EMAIL_FROM_NAME || 'Fafa Access',
      apiKey: options.apiKey || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY,
    };

    switch (providerName?.toLowerCase()) {
      case 'resend':
        return new ResendProvider(config);
      case 'sendgrid':
        return new SendGridProvider(config);
      case 'smtp':
      default:
        return new SmtpProvider({
          ...config,
          host: options.smtpHost || process.env.SMTP_HOST || 'smtp.mailtrap.io',
          port: options.smtpPort || process.env.SMTP_PORT || 587,
          secure: options.smtpSecure || process.env.SMTP_SECURE === 'true',
          user: options.smtpUser || process.env.SMTP_USER,
          pass: options.smtpPass || process.env.SMTP_PASSWORD,
        });
    }
  }

  /**
   * Send transactional email with automatic retry and comprehensive error handling
   * 
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.templateName - Template name (applicationSubmitted, applicationApproved, etc.)
   * @param {Object} params.data - Template variables for {{placeholder}} replacement
   * @param {string} [params.from] - Override sender email
   * @param {boolean} [params.logToAudit] - Log to audit system (default: true)
   * @param {string} [params.applicationRef] - Application reference for traceability
   * @param {string} [params.applicationId] - Application UUID for database linkage
   * @returns {Promise<Object>} Send result with messageId and status
   */
  async send(params) {
    const { 
      to, 
      templateName, 
      data = {}, 
      from, 
      logToAudit = true,
      applicationRef = data.applicationRef,
      applicationId = data.applicationId
    } = params;

    // Validate inputs
    if (!to || !to.includes('@')) {
      throw new Error(`Invalid recipient email: ${to}`);
    }

    if (!templateName || !emailTemplates[templateName]) {
      throw new Error(`Template not found: ${templateName}. Available: ${Object.keys(emailTemplates).join(', ')}`);
    }

    const template = emailTemplates[templateName];
    const correlationId = data.correlationId || this._generateId();

    try {
      // Render template with data
      const { subject, html, text } = this._renderTemplate(template, data);

      // Send with retry logic
      const result = await this._sendWithRetry({
        to,
        subject,
        html,
        text,
        from,
        correlationId,
      });

      // Log successful send
      if (logToAudit) {
        // Log to both notification_logs and audit_logs for accountability
        await Promise.all([
          logEmailSend({
            to,
            templateName,
            messageId: result.messageId,
            provider: result.provider,
            applicationRef,
            applicationId,
            status: 'success',
          }),
          logEmailAudit({
            to,
            templateName,
            messageId: result.messageId,
            provider: result.provider,
            applicationRef,
            status: 'success',
          }),
        ]).catch(logError => {
          // Don't fail the email if logging fails
          this.logger.warn('[TransactionalEmailService] Failed to log email event:', logError);
        });
      }

      this.emit('sent', {
        to,
        templateName,
        messageId: result.messageId,
        provider: result.provider,
        correlationId,
      });

      return result;
    } catch (error) {
      const errorMessage = error.message || String(error);

      // Log failure
      if (logToAudit) {
        await Promise.all([
          logEmailSend({
            to,
            templateName,
            messageId: `error-${Date.now()}`,
            provider: 'unknown',
            applicationRef,
            applicationId,
            status: 'failed',
            error: errorMessage,
          }),
          logEmailAudit({
            to,
            templateName,
            messageId: `error-${Date.now()}`,
            provider: 'unknown',
            applicationRef,
            status: 'failed',
            error: errorMessage,
          }),
        ]).catch(() => {
          // Silently fail logging to prevent cascading failures
        });
      }

      this.emit('error', {
        to,
        templateName,
        error: errorMessage,
        correlationId,
      });

      this.logger.error(`[TransactionalEmailService] Failed to send email: ${errorMessage}`, {
        to,
        templateName,
        correlationId,
      });

      throw error;
    }
  }

  /**
   * Send email with automatic retry and exponential backoff
   */
  async _sendWithRetry({ to, subject, html, text, from, correlationId }, attempt = 1) {
    try {
      return await this.provider.send({ to, subject, html, text, from });
    } catch (error) {
      if (attempt < this.maxRetries) {
        const delayMs = this.retryDelay * Math.pow(2, attempt - 1);
        this.logger.warn(`[TransactionalEmailService] Retry attempt ${attempt + 1} after ${delayMs}ms`, {
          to,
          error: error.message,
          correlationId,
        });

        await this._delay(delayMs);
        return this._sendWithRetry({ to, subject, html, text, from, correlationId }, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Render template by replacing {{variables}} with data values
   */
  _renderTemplate(template, data) {
    let subject = template.subject;
    let htmlContent = template.htmlTemplate;
    let textContent = template.textTemplate;

    // Replace all {{variable}} placeholders with data values
    const replacePlaceholders = (text) => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = data[key] ?? '';
        return String(value);
      });
    };

    return {
      subject: replacePlaceholders(subject),
      html: replacePlaceholders(htmlContent),
      text: replacePlaceholders(textContent),
    };
  }

  /**
   * Log email event to audit system
   */
  async _logEmailEvent(entry) {
    try {
      await db.insert(auditLogs).values({
        action: entry.type,
        actorId: 'system',
        actorRole: 'SYSTEM',
        actorEmail: 'system@fafaaccess.edu.gh',
        applicationRef: entry.correlationId,
        details: JSON.stringify({
          channel: 'email',
          to: entry.to,
          template: entry.templateName,
          messageId: entry.messageId,
          provider: entry.provider,
          status: entry.status,
          error: entry.error,
        }),
        ipAddress: '0.0.0.0',
        userAgent: 'TransactionalEmailService',
      });
    } catch (logError) {
      this.logger.error('Failed to log email event', {
        originalError: entry,
        logError: logError.message,
      });
    }
  }

  /**
   * Utility: delay for retry backoff
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Utility: generate correlation ID
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates() {
    return Object.keys(emailTemplates);
  }

  /**
   * Get template by name
   */
  getTemplate(templateName) {
    return emailTemplates[templateName] || null;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let emailServiceInstance = null;

/**
 * Get or create the transactional email service singleton
 */
export function getEmailService(options = {}) {
  if (!emailServiceInstance) {
    emailServiceInstance = new TransactionalEmailService(options);
  }
  return emailServiceInstance;
}

// ============================================================================
// Exports
// ============================================================================

export {
  TransactionalEmailService,
  EmailProvider,
  SmtpProvider,
  SendGridProvider,
  ResendProvider,
  emailTemplates,
};

export default TransactionalEmailService;
