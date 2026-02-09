/**
 * Example: Email Integration in Controllers
 * 
 * This file demonstrates how to integrate the TransactionalEmailService
 * into your application controllers and routes.
 * 
 * USAGE:
 * 1. Import email helpers in your routes
 * 2. Call email functions after successful operations
 * 3. Handle errors gracefully (don't stop the operation if email fails)
 */

// ============================================================================
// EXAMPLE 1: Send email after application submission
// ============================================================================

// In your applicationController.js:

/*
import { sendApplicationSubmittedEmail } from '../services/emailNotifications.js';

export const submitApplication = async (req, res) => {
  try {
    const { email, fullName, applicationData } = req.body;

    // Save application to database
    const application = await db.insert(applications).values({
      studentEmail: email,
      studentName: fullName,
      ...applicationData,
      status: 'PENDING',
      submissionDate: new Date(),
    }).returning();

    // Send confirmation email (don't block on failure)
    sendApplicationSubmittedEmail(email, {
      name: fullName,
      applicationRef: application[0].reference,
      submissionDate: new Date().toLocaleDateString(),
      dashboardUrl: process.env.FRONTEND_URL + '/dashboard',
    }).catch(error => {
      console.error('Failed to send confirmation email:', error);
      // Continue operation - email is not critical to success
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
*/

// ============================================================================
// EXAMPLE 2: Send email after application approval
// ============================================================================

/*
import { sendApplicationApprovedEmail } from '../services/emailNotifications.js';

export const approveApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { approvalDetails } = req.body;

    // Update application
    const result = await db.update(applications)
      .set({
        status: 'APPROVED',
        approvedBy: req.user.userId,
        approvedAt: new Date(),
        ...approvalDetails,
      })
      .where(eq(applications.id, applicationId))
      .returning();

    const application = result[0];

    // Fetch student email
    const student = await db.select()
      .from(users)
      .where(eq(users.id, application.studentId))
      .limit(1);

    // Send approval email
    await sendApplicationApprovedEmail(student[0].email, {
      name: student[0].fullName,
      applicationRef: application.reference,
      approvalDate: new Date().toLocaleDateString(),
      laptopModel: application.selectedLaptop,
      dashboardUrl: process.env.FRONTEND_URL + '/dashboard',
    }).catch(error => {
      console.error('Failed to send approval email:', error);
    });

    res.json({
      success: true,
      message: 'Application approved and student notified',
      data: application,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
*/

// ============================================================================
// EXAMPLE 3: Send delivery scheduled email
// ============================================================================

/*
import { sendDeliveryScheduledEmail } from '../services/emailNotifications.js';

export const scheduleDelivery = async (req, res) => {
  try {
    const { applicationId, deliveryDate, agentId } = req.body;

    // Create delivery schedule
    const delivery = await db.insert(deliveries).values({
      applicationId,
      deliveryDate: new Date(deliveryDate),
      assignedAgent: agentId,
      status: 'SCHEDULED',
    }).returning();

    // Get application and student details
    const app = await db.select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);

    const student = await db.select()
      .from(users)
      .where(eq(users.id, app[0].studentId))
      .limit(1);

    const agent = await db.select()
      .from(users)
      .where(eq(users.id, agentId))
      .limit(1);

    // Send scheduled delivery notification
    await sendDeliveryScheduledEmail(student[0].email, {
      name: student[0].fullName,
      applicationRef: app[0].reference,
      deliveryDate: new Date(deliveryDate).toLocaleDateString(),
      deliveryTimeWindow: '9:00 AM - 5:00 PM',
      agentName: agent[0].fullName,
      agentPhone: agent[0].phone,
      location: student[0].location,
      dashboardUrl: process.env.FRONTEND_URL + '/dashboard',
    }).catch(error => {
      console.error('Failed to send delivery email:', error);
    });

    res.json({
      success: true,
      message: 'Delivery scheduled and notification sent',
      data: delivery[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
*/

// ============================================================================
// EXAMPLE 4: Using sendEmailSafely for non-critical operations
// ============================================================================

/*
import { sendEmailSafely } from '../services/emailNotifications.js';

// In a route where email is nice-to-have but not critical:
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;

    // Update user
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, userId))
      .returning();

    // Send update notification (with safe error handling)
    const emailResult = await sendEmailSafely(result[0].email, 'profileUpdated', {
      name: result[0].fullName,
    });

    // Email result could be { error: msg, sent: false } but we don't care
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
*/

// ============================================================================
// EXAMPLE 5: Custom email with retry logic built-in
// ============================================================================

/*
import { sendCustomEmail, getEmailServiceInstance } from '../services/emailNotifications.js';

export const sendBulkNotifications = async (req, res) => {
  try {
    const { recipientEmails, templateName, data } = req.body;

    const emailService = getEmailServiceInstance();
    const results = {
      sent: [],
      failed: [],
    };

    for (const email of recipientEmails) {
      try {
        const result = await emailService.send({
          to: email,
          templateName,
          data: {
            ...data,
            // Each email gets personalized data if needed
          },
          logToAudit: true,
        });
        results.sent.push({ email, messageId: result.messageId });
      } catch (error) {
        results.failed.push({ email, error: error.message });
        // Continue with next email even if one fails
      }
    }

    res.json({
      success: true,
      message: `Sent ${results.sent.length} of ${recipientEmails.length} emails`,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
*/

// ============================================================================
// EXAMPLE 6: Advanced - Get available templates
// ============================================================================

/*
import { getAvailableEmailTemplates } from '../services/emailNotifications.js';

export const listEmailTemplates = async (req, res) => {
  const templates = getAvailableEmailTemplates();
  const emailService = getEmailServiceInstance();

  const templatesList = templates.map(name => ({
    name,
    template: emailService.getTemplate(name),
  }));

  res.json({
    success: true,
    count: templates.length,
    templates: templatesList,
  });
};
*/

// ============================================================================
// SETUP INSTRUCTIONS
// ============================================================================

/*
1. CHOOSE AN EMAIL PROVIDER:
   - SMTP (for development with Mailtrap or local SMTP)
   - SendGrid (production-ready, free tier available)
   - Resend (modern API, excellent for transactional emails)

2. CONFIGURE IN .env:
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your_key_here
   EMAIL_FROM_NAME=Fafa Access
   EMAIL_FROM_ADDRESS=noreply@fafaaccess.edu.gh

3. Import in your routes:
   import { sendApplicationSubmittedEmail } from './src/services/emailNotifications.js';

4. Send emails after operations:
   await sendApplicationSubmittedEmail(email, {
     name: 'John',
     applicationRef: 'APP-2024-0001',
     submissionDate: new Date().toLocaleDateString(),
     dashboardUrl: 'https://yourapp.com/dashboard',
   }).catch(error => {
     console.error('Email failed:', error);
     // Continue operation
   });

5. IMPORTANT NOTES:
   - Always use .catch() to prevent email failures from breaking operations
   - Emails are logged to audit system automatically
   - Retry logic is built-in (3 retries with exponential backoff)
   - Templates support {{variable}} placeholders
   - All email sending is asynchronous and non-blocking
*/

export default {
  // This file is for documentation only
  // Import specific functions from emailNotifications.js as needed
};
