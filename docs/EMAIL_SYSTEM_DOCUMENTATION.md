# Backend Email Notification System

A production-ready, backend-only email notification system for the Fafa Access application with support for multiple providers, transactional templates, automatic retry logic, and comprehensive error handling.

## Features

✅ **Multiple Providers**
- SMTP (for development)
- SendGrid (production-ready)
- Resend (modern, serverless API)

✅ **Transactional Templates**
- Pre-built email templates for all major application events
- Support for `{{variable}}` placeholder replacement
- HTML and plain text versions
- Professional, responsive design

✅ **Reliable Delivery**
- Automatic retry with exponential backoff
- Configurable retry attempts (default: 3)
- Graceful failure handling
- Comprehensive error logging

✅ **Audit & Compliance**
- All emails logged to audit system
- Correlation IDs for tracking
- Event timestamps and status tracking
- Provider information recorded

✅ **Easy Integration**
- Simple helper functions for common operations
- Non-blocking async/await pattern
- Singleton pattern for service management
- Safe error handling that doesn't break operations

## Setup

### Prerequisites

- Node.js 16+
- PostgreSQL database
- Environment variables configured

### 1. Choose Email Provider

#### Option A: SMTP (Development)
```bash
# Install nodemailer
npm install nodemailer

# Configure .env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASSWORD=your_password
```

**Recommended**: [Mailtrap.io](https://mailtrap.io) - Free tier with 100 emails/month

#### Option B: SendGrid (Production)
```bash
# Get free account and API key from https://sendgrid.com

# Configure .env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
```

#### Option C: Resend (Modern Alternative)
```bash
# Get API key from https://resend.com

# Configure .env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
```

### 2. Configure Environment Variables

```env
# Email Provider Selection
EMAIL_PROVIDER=sendgrid  # or 'smtp' or 'resend'

# Email Display
EMAIL_FROM_NAME=Fafa Access
EMAIL_FROM_ADDRESS=noreply@fafaaccess.edu.gh

# SMTP Config (if using SMTP provider)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_user
SMTP_PASSWORD=your_password

# SendGrid API Key (if using SendGrid)
SENDGRID_API_KEY=SG.your_key

# Resend API Key (if using Resend)
RESEND_API_KEY=re_your_key

# Email Behavior
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY_MS=1000
```

## Usage

### Basic Usage

```javascript
import { sendApplicationSubmittedEmail } from './src/services/emailNotifications.js';

// Send email after application submission
await sendApplicationSubmittedEmail('student@university.edu.gh', {
  name: 'John Doe',
  applicationRef: 'APP-2024-0001',
  submissionDate: new Date().toLocaleDateString(),
  dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
});
```

### Available Helper Functions

#### `sendApplicationSubmittedEmail(email, data)`
Send application received confirmation.

**Parameters:**
- `email` (string): Recipient email address
- `data.name`: Student name
- `data.applicationRef`: Application reference
- `data.submissionDate`: Submission date (auto-formatted)
- `data.dashboardUrl`: Link to dashboard

#### `sendApplicationApprovedEmail(email, data)`
Send application approval notification.

**Parameters:**
- `email`: Recipient email
- `data.name`: Student name
- `data.applicationRef`: Application reference
- `data.approvalDate`: Approval date
- `data.laptopModel`: Selected laptop model
- `data.dashboardUrl`: Dashboard link

#### `sendApplicationRejectedEmail(email, data)`
Send application rejection notice.

**Parameters:**
- `email`: Recipient email
- `data.name`: Student name
- `data.applicationRef`: Application reference
- `data.decisionDate`: Decision date
- `data.rejectionReason`: Reason for rejection

#### `sendDeliveryScheduledEmail(email, data)`
Send delivery scheduling notification.

**Parameters:**
- `email`: Recipient email
- `data.name`: Student name
- `data.applicationRef`: Application reference
- `data.deliveryDate`: Scheduled delivery date
- `data.deliveryTimeWindow`: Time window (e.g., "9:00 AM - 5:00 PM")
- `data.agentName`: Delivery agent name
- `data.location`: Delivery location
- `data.agentPhone`: Agent contact number
- `data.dashboardUrl`: Dashboard link

#### `sendPaymentRequiredEmail(email, data)`
Send payment reminder.

**Parameters:**
- `email`: Recipient email
- `data.name`: Student name
- `data.applicationRef`: Application reference
- `data.amount`: Payment amount (GHS)
- `data.paymentDueDate`: Due date

#### `sendCustomEmail(to, templateName, data)`
Send email using any template.

```javascript
import { sendCustomEmail } from './src/services/emailNotifications.js';

await sendCustomEmail('user@email.com', 'applicationSubmitted', {
  name: 'John',
  applicationRef: 'APP-001',
  submissionDate: '2024-02-06',
});
```

#### `sendEmailSafely(to, templateName, data)`
Send email with no exception throwing (returns error object on failure).

```javascript
const result = await sendEmailSafely('user@email.com', 'applicationSubmitted', data);
if (result.error) {
  console.log('Email failed:', result.error);
} else {
  console.log('Email sent:', result.messageId);
}
```

### Advanced Usage

#### Get Service Instance
```javascript
import { getEmailServiceInstance } from './src/services/emailNotifications.js';

const emailService = getEmailServiceInstance();

// Send with custom options
const result = await emailService.send({
  to: 'user@email.com',
  templateName: 'applicationSubmitted',
  data: { /* ... */ },
  logToAudit: true,  // Log to audit system
});
```

#### List Available Templates
```javascript
import { getAvailableEmailTemplates } from './src/services/emailNotifications.js';

const templates = getAvailableEmailTemplates();
console.log(templates); 
// ['applicationSubmitted', 'applicationApproved', 'deliveryScheduled', ...]
```

#### Handle Email Events
```javascript
const emailService = getEmailServiceInstance();

// Listen for successful sends
emailService.on('sent', ({ to, templateName, messageId }) => {
  console.log(`Email sent to ${to} (${messageId})`);
});

// Listen for errors
emailService.on('error', ({ to, templateName, error }) => {
  console.error(`Failed to send email to ${to}: ${error}`);
});
```

## Template Reference

### Available Templates

| Template Name | Purpose | Variables |
|---|---|---|
| `applicationSubmitted` | Initial application received | name, applicationRef, submissionDate, dashboardUrl |
| `applicationApproved` | Application fully approved | name, applicationRef, approvalDate, laptopModel, dashboardUrl |
| `applicationRejected` | Application rejected | name, applicationRef, decisionDate, rejectionReason |
| `deliveryScheduled` | Delivery scheduled | name, applicationRef, deliveryDate, deliveryTimeWindow, agentName, location, agentPhone, dashboardUrl |
| `paymentRequired` | Payment collection reminder | name, applicationRef, amount, paymentDueDate |

### Template Variable Format

All templates use `{{variableName}}` placeholders:

```handlebars
Dear {{name}},

Your application {{applicationRef}} has been received.

// becomes:

Dear John,

Your application APP-2024-0001 has been received.
```

### Creating Custom Templates

To add a new template, edit `src/services/TransactionalEmailService.js`:

```javascript
const emailTemplates = {
  // ... existing templates ...
  myNewTemplate: {
    subject: 'Template Subject {{variable}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
  <body>
    <p>Hello {{name}},</p>
    <p>Your data: {{dataField}}</p>
  </body>
</html>
    `,
    textTemplate: `Hello {{name}},\n\nYour data: {{dataField}}`,
  },
};
```

Then use:
```javascript
await sendCustomEmail('user@email.com', 'myNewTemplate', {
  name: 'John',
  dataField: 'Some Value'
});
```

## Error Handling

### Automatic Retry

Emails automatically retry on failure with exponential backoff:

1. Attempt 1: Immediate
2. Attempt 2: After 1 second (if attempt 1 fails)
3. Attempt 3: After 2 seconds (if attempt 2 fails)

### Non-Blocking Pattern

Always use `.catch()` to prevent email failures from breaking operations:

```javascript
// Good ✅
await db.update(applications).set({ status: 'APPROVED' });
await sendApplicationApprovedEmail(email, data).catch(error => {
  console.error('Email failed (operation continues):', error);
});

// Bad ❌
await sendApplicationApprovedEmail(email, data); // Could crash handler
```

### Safe Email Send

For non-critical operations, use `sendEmailSafely()`:

```javascript
const result = await sendEmailSafely(email, 'applicationSubmitted', data);
// Always returns: { error: msg, sent: false } OR { messageId, sent: true }
// Never throws
```

## Logging & Audit

All emails are automatically logged to the `auditLogs` table:

```sql
SELECT * FROM audit_logs 
WHERE action = 'EMAIL_SENT' 
ORDER BY timestamp DESC;
```

Log entry structure:
```json
{
  "action": "EMAIL_SENT",
  "actorId": "system",
  "details": {
    "channel": "email",
    "to": "student@university.edu.gh",
    "template": "applicationSubmitted",
    "messageId": "sg-123456",
    "provider": "sendgrid",
    "status": "success"
  }
}
```

## Monitoring & Debugging

### Test Email Send

```javascript
import { getEmailServiceInstance } from './src/services/emailNotifications.js';

const emailService = getEmailServiceInstance();

// Send test email
await emailService.send({
  to: 'test@email.com',
  templateName: 'applicationSubmitted',
  data: {
    name: 'Test User',
    applicationRef: 'TEST-001',
    submissionDate: new Date().toLocaleDateString(),
    dashboardUrl: 'https://app.test.com',
  },
});
```

### View Service Info

```javascript
const emailService = getEmailServiceInstance();
const templates = emailService.getAvailableTemplates();
console.log('Available templates:', templates);

const template = emailService.getTemplate('applicationSubmitted');
console.log('Template subject:', template.subject);
```

### Enable Debug Logging

```javascript
const emailService = getEmailServiceInstance();

emailService.on('sent', (data) => {
  console.log('[Email Sent]', data);
});

emailService.on('error', (data) => {
  console.log('[Email Failed]', data);
});
```

## Best Practices

1. **Always Use Error Handling**
   ```javascript
   await sendApplicationSubmittedEmail(email, data).catch(error => {
     console.error('Email failed:', error);
     // Continue operation
   });
   ```

2. **Use Safe Send for Non-Critical Emails**
   ```javascript
   // For nice-to-have notifications
   await sendEmailSafely(email, 'templateName', data);
   ```

3. **Provide Contact Information**
   Include support contact in templates for users to reach out.

4. **Personalize When Possible**
   Use actual names and references instead of generic templates.

5. **Test Email Configuration**
   Before deploying, test each provider thoroughly.

6. **Monitor Failures**
   Check audit logs regularly for failed emails.

7. **Use Appropriate Provider**
   - SMTP: Development/testing
   - SendGrid: Production (reliable, scalable)
   - Resend: Modern alternative (newer service)

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set correctly
2. Test provider API keys/credentials
3. Verify email addresses are valid
4. Check audit logs for error messages
5. Look at application logs for errors

### Provider-Specific Issues

**SMTP:**
- Ensure host/port/credentials are correct
- Check firewall allows SMTP connection
- Verify authentication method (TLS vs SSL)

**SendGrid:**
- Verify API key is active
- Check sender email is verified
- Review SendGrid dashboard for rate limits

**Resend:**
- Verify API key is valid
- Ensure domain is configured
- Check Resend dashboard status

### Template Variable Issues

Use `{{variableName}}` format (case-sensitive):
```javascript
// Template: Welcome {{name}}
data: { name: 'John' } // ✅ Works
data: { Name: 'John' } // ❌ Shows: Welcome {{name}}
```

## Performance

- Email sending is **non-blocking** (async/await)
- Typical send time: 100-500ms
- Retries use exponential backoff to avoid overwhelming servers
- Audit logging is asynchronous and doesn't block operations

## Security

- SMTP credentials stored in environment
- SendGrid/Resend API keys stored in environment
- No plaintext passwords in code
- Email content rendered server-side only
- All email logs include audit trail

## Migration Guide

### From Old EmailService to TransactionalEmailService

**Before:**
```javascript
const emailService = new EmailService({ providerName: 'sendgrid' });
await emailService.sendEmail({ to, subject, html, text });
```

**After:**
```javascript
import { sendCustomEmail } from './src/services/emailNotifications.js';
await sendCustomEmail(to, 'templateName', { /* variables */ });
```

## Support

For issues or questions:
1. Check this documentation
2. Review example integrations in `EMAIL_INTEGRATION_EXAMPLES.js`
3. Check audit logs for error messages
4. Enable debug logging to diagnose issues
5. Contact support@fafaaccess.edu.gh
