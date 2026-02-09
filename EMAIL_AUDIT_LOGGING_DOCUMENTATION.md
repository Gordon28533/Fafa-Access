# Email Logging & Audit Trail System

## Overview

The Email Logging System provides comprehensive tracking and accountability for all email notifications sent by the Fafa Access system. Every email is logged with recipient, template, timestamp, and application reference for complete traceability.

**Status:** ✅ Production Ready
**Implementation:** Complete  
**Security:** Read-only audit logs with role-based access

---

## 📋 Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [CLI Utilities](#cli-utilities)
6. [Usage Examples](#usage-examples)
7. [Access Control](#access-control)
8. [Reporting & Analytics](#reporting--analytics)

---

## Features

### ✅ Complete Email Traceability
- **Recipient Logging:** Email address of every recipient
- **Template Tracking:** Which template was sent
- **Timestamp Recording:** Exact time of send (UTC)
- **Application Linkage:** Connected to application reference and/or ID
- **Provider Tracking:** Which email provider (SMTP, SendGrid, Resend)
- **Status Recording:** Success, failed, or queued status
- **Error Logging:** Failure reasons for troubleshooting

### ✅ Dual-Storage Approach
- **notification_logs table:** Detailed email-specific tracking
- **audit_logs table:** Compliance audit trail with JSONB details
- Both tables indexed for fast queries

### ✅ Read-Only Access
- No modification of existing logs
- Append-only operations
- Historical accuracy guaranteed
- Immutable audit trail

### ✅ Role-Based Access Control
- **ADMIN:** Full access to all logs and exports
- **SRC:** Can view logs for assigned applications
- **FINANCE:** Can view statistics and summaries
- **STUDENT:** Cannot access logs (privacy)

---

## Architecture

### Components

```
Email Send Flow:
┌─────────────────────────────────────┐
│  emailNotifications.js              │
│  (sendApplicationSubmittedEmail)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  TransactionalEmailService.js       │
│  (send method with logging)         │
└──────────────┬──────────────────────┘
               │
               ├─ Send email via provider (SMTP/SendGrid/Resend)
               │
               └─ Log send event
                  ├─ logEmailSend() → notification_logs
                  ├─ logEmailAudit() → audit_logs
                  └─ Both logged together for consistency

Query Flow:
┌─────────────────────────────────────┐
│  emailLogging.js (Utility Functions)│
│  - getEmailLogsByReference()        │
│  - getEmailLogsByRecipient()        │
│  - getEmailLogsByTemplate()         │
│  - getEmailLogsByDateRange()        │
│  - getFailedEmails()                │
│  - getEmailStatistics()             │
└──────────────┬──────────────────────┘
               │
               ├─ Read from notification_logs
               ├─ Read from audit_logs  
               └─ Format and return results

Access Flow:
┌─────────────────────────────────────┐
│  emailAuditController.js            │
│  (REST API Endpoints)               │
└──────────────┬──────────────────────┘
               │
               ├─ /api/audit/emails/application/:id
               ├─ /api/audit/emails/reference/:ref
               ├─ /api/audit/emails/recipient/:email
               ├─ /api/audit/emails/template/:template
               ├─ /api/audit/emails/failed
               ├─ /api/audit/emails/statistics
               ├─ /api/audit/emails/summary
               └─ /api/audit/emails/export

CLI Access:
┌─────────────────────────────────────┐
│  view-email-logs.js (CLI Viewer)    │
│  (Command-line tools)               │
└──────────────┬──────────────────────┘
               │
               ├─ node view-email-logs.js --app APP-2024-0001
               ├─ node view-email-logs.js --template applicationSubmitted
               ├─ node view-email-logs.js --recipient student@example.com
               ├─ node view-email-logs.js --failed
               ├─ node view-email-logs.js --stats
               └─ node view-email-logs.js --summary
```

---

## Database Schema

### notification_logs Table

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY,
  userId UUID,
  recipientId UUID,
  recipientRole VARCHAR(50),
  eventName VARCHAR(100) NOT NULL,      -- email_applicationSubmitted
  channel VARCHAR(50) NOT NULL,          -- 'email'
  title VARCHAR(255),
  message TEXT NOT NULL,
  messageId VARCHAR(255),                -- Provider message ID
  status VARCHAR(50) NOT NULL,           -- 'success', 'failed', 'queued'
  correlationId VARCHAR(255),            -- Application reference
  applicationId UUID,
  sentAt TIMESTAMP DEFAULT NOW(),
  createdAt TIMESTAMP DEFAULT NOW(),
  
  -- Indexes for fast lookups
  INDEX notification_logs_recipient_role_idx (recipientRole),
  INDEX notification_logs_application_id_idx (applicationId),
  INDEX notification_logs_event_name_idx (eventName),
  INDEX notification_logs_channel_idx (channel),
  INDEX notification_logs_status_idx (status),
  INDEX notification_logs_sent_at_idx (sentAt)
);
```

### audit_logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  action VARCHAR(100) NOT NULL,          -- 'EMAIL_SENT', 'EMAIL_FAILED'
  actorId VARCHAR(255) NOT NULL,         -- 'system'
  actorRole VARCHAR(50) NOT NULL,        -- 'SYSTEM'
  details TEXT NOT NULL,                 -- JSONB with full email details
  timestamp TIMESTAMP DEFAULT NOW(),
  applicationId UUID,
  
  -- Indexes for fast lookups
  INDEX audit_logs_actor_id_idx (actorId),
  INDEX audit_logs_application_id_idx (applicationId)
);
```

### Details JSONB Structure (audit_logs)

```json
{
  "channel": "email",
  "recipient": "student@example.com",
  "template": "applicationSubmitted",
  "messageId": "smtp-sim-1234567890",
  "provider": "smtp",
  "status": "success",
  "error": null,
  "applicationRef": "APP-2024-0001",
  "timestamp": "2024-02-06T15:30:45.000Z"
}
```

---

## API Endpoints

All endpoints require authentication and return JSON responses.

### 1. Get Logs for Application

**GET** `/api/audit/emails/application/:applicationId`

Get all email logs for a specific application UUID.

**Access:** ADMIN, SRC

**Query Parameters:**
- `limit` (default: 50, max: 100)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-02-06T15:30:45.000Z",
      "recipient": "student@example.com",
      "template": "applicationSubmitted",
      "status": "success",
      "messageId": "msg-123",
      "provider": "smtp",
      "applicationRef": "APP-2024-0001",
      "error": null
    }
  ],
  "count": 1
}
```

### 2. Get Logs by Application Reference

**GET** `/api/audit/emails/reference/:applicationRef`

Get all emails for an application using reference number (e.g., APP-2024-0001).

**Access:** ADMIN, SRC

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-02-06T15:30:45.000Z",
      "action": "EMAIL_SENT",
      "details": {
        "recipient": "student@example.com",
        "template": "applicationSubmitted",
        "status": "success",
        "messageId": "msg-123",
        "provider": "smtp"
      }
    }
  ],
  "count": 5
}
```

### 3. Get Logs by Recipient Email

**GET** `/api/audit/emails/recipient/:email`

Get all emails sent to a specific email address.

**Access:** ADMIN only (Privacy Protection)

### 4. Get Logs by Template

**GET** `/api/audit/emails/template/:templateName`

Get all emails sent using a specific template.

**Access:** ADMIN, SRC

**Example:** `/api/audit/emails/template/applicationSubmitted`

### 5. Get Logs by Date Range

**GET** `/api/audit/emails/date-range?startDate=2024-02-01&endDate=2024-02-06`

Get all emails sent between two dates.

**Access:** ADMIN only

**Query Parameters:**
- `startDate` - ISO format (required)
- `endDate` - ISO format (required)
- `limit` - Max results (default: 100)

### 6. Get Failed Emails

**GET** `/api/audit/emails/failed`

Get all emails that failed to send.

**Access:** ADMIN only

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "recipientId": null,
      "eventName": "email_applicationSubmitted",
      "channel": "email",
      "messageId": "error-123",
      "status": "failed",
      "sentAt": "2024-02-06T14:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 7. Get Email Statistics

**GET** `/api/audit/emails/statistics`

Get aggregate statistics about email sending.

**Access:** ADMIN, FINANCE

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 425,
    "byStatus": {
      "success": 420,
      "failed": 5,
      "queued": 0
    },
    "byTemplate": {
      "applicationSubmitted": 150,
      "applicationApproved": 100,
      "applicationRejected": 45,
      "deliveryScheduled": 100,
      "paymentRequired": 30
    },
    "successRate": "98.82"
  }
}
```

### 8. Get Email Summary

**GET** `/api/audit/emails/summary?startDate=2024-01-30`

Get email activity summary (defaults to last 7 days).

**Access:** ADMIN

### 9. Export Email Logs

**GET** `/api/audit/emails/export?applicationRef=APP-2024-0001`

Export email logs as CSV file.

**Access:** ADMIN only

**Returns:** CSV file download

---

## CLI Utilities

### view-email-logs.js

Command-line tool for viewing and exporting email logs.

**Location:** `/view-email-logs.js`

**Installation:**
```bash
# Already included in project
npm install
```

### Usage Examples

#### View logs for application
```bash
node view-email-logs.js --app APP-2024-0001
```

Output:
```
📧 Email Logs for Application: APP-2024-0001

Timestamp           | Action    | Recipient              | Template              | Status
────────────────────────────────────────────────────────────────────────────────────
2/6/24, 3:30:45 PM | EMAIL_SENT| student@example.com    | applicationSubmitted  | success
2/6/24, 3:31:02 PM | EMAIL_SENT| student@example.com    | applicationApproved   | success
```

#### View logs by template
```bash
node view-email-logs.js --template applicationSubmitted
```

#### View logs by recipient
```bash
node view-email-logs.js --recipient student@example.com
```

#### View failed emails
```bash
node view-email-logs.js --failed
```

Output:
```
📧 Failed Email Logs

Timestamp           | Recipient              | Template      | Status
──────────────────────────────────────────────────────────────────
(No failed emails)
```

#### View statistics
```bash
node view-email-logs.js --stats
```

Output:
```
📊 Email Send Statistics

Total Emails Sent:    425
Success:              420
Failed:               5
Queued:               0
Success Rate:         98.82%

📧 By Template:

  applicationSubmitted       150 emails
  applicationApproved        100 emails
  applicationRejected        45 emails
  deliveryScheduled          100 emails
  paymentRequired            30 emails
```

#### View summary report
```bash
node view-email-logs.js --summary
```

#### Export to CSV
```bash
node view-email-logs.js --export APP-2024-0001
```

#### Help
```bash
node view-email-logs.js --help
```

---

## Usage Examples

### In Application Code

#### Sending an email with automatic logging
```javascript
import { sendApplicationSubmittedEmail } from './src/services/emailNotifications.js';

// Email is automatically logged
const result = await sendApplicationSubmittedEmail('student@example.com', {
  name: 'John Doe',
  applicationRef: 'APP-2024-0001',
  submissionDate: '6 Feb 2024',
  dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
});

// Result includes provider details for tracking
console.log(result.messageId); // Provider's message ID
```

#### Querying email logs programmatically
```javascript
import { 
  getEmailLogsByReference,
  getEmailStatistics,
  getFailedEmails 
} from './src/services/emailLogging.js';

// Get all emails for an application
const logs = await getEmailLogsByReference('APP-2024-0001');
console.log(logs); // Array of log entries

// Get statistics
const stats = await getEmailStatistics();
console.log(stats.successRate); // "98.82"

// Get failed emails for follow-up
const failed = await getFailedEmails();
if (failed.length > 0) {
  console.log(`${failed.length} emails to resend`);
}
```

### From REST API

#### Get application email history
```bash
curl -X GET http://localhost:3000/api/audit/emails/application/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get failed emails (admin only)
```bash
curl -X GET http://localhost:3000/api/audit/emails/failed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Export logs as CSV
```bash
curl -X GET http://localhost:3000/api/audit/emails/export?applicationRef=APP-2024-0001 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o email-logs.csv
```

---

## Access Control

### Role-Based Permissions

| Endpoint | ADMIN | SRC | FINANCE | STUDENT |
|----------|-------|-----|---------|---------|
| `/application/:id` | ✅ | ✅ | ❌ | ❌ |
| `/reference/:ref` | ✅ | ✅ | ❌ | ❌ |
| `/recipient/:email` | ✅ | ❌ | ❌ | ❌ |
| `/template/:name` | ✅ | ✅ | ❌ | ❌ |
| `/date-range` | ✅ | ❌ | ❌ | ❌ |
| `/failed` | ✅ | ❌ | ❌ | ❌ |
| `/statistics` | ✅ | ❌ | ✅ | ❌ |
| `/summary` | ✅ | ❌ | ❌ | ❌ |
| `/export` | ✅ | ❌ | ❌ | ❌ |

### Privacy Protection

- **Student Privacy:** No email logs accessible by students
- **Recipient Privacy:** Email addresses only visible to ADMIN
- **Admin Oversight:** ADMIN has complete access for compliance
- **Read-Only:** No logs can be deleted or modified (append-only)

---

## Reporting & Analytics

### Email Statistics

Available statistics:
- Total emails sent
- Breakdown by status (success, failed, queued)
- Breakdown by template
- Success rate percentage
- Unique recipient count
- Email volume trends

### Reports Available

1. **Daily Send Report**
   - Total emails sent per day
   - Success rate by day
   - Template breakdown by day

2. **Application Report**
   - All emails for specific application
   - Timeline of communications
   - Failed sends needing follow-up

3. **Template Performance**
   - Success rate per template
   - Most frequently sent templates
   - Templates with issues

4. **Recipient Report**
   - All email communications with user
   - Email frequency
   - Failed sends to user

### Exporting Data

#### CSV Export
```bash
node view-email-logs.js --export APP-2024-0001
```

Generates CSV with columns:
- Timestamp
- Recipient
- Template
- Status
- Message ID
- Provider
- Application Ref
- Error

#### JSON Export (via API)
```bash
curl http://localhost:3000/api/audit/emails/reference/APP-2024-0001 \
  -H "Authorization: Bearer TOKEN" | jq . > logs.json
```

---

## Troubleshooting

### Issue: Email not logged

**Diagnosis:**
- Check if `logToAudit: true` is set (default)
- Verify database connection
- Check for errors in logs

**Solution:**
```javascript
// Verify logging is enabled
const result = await sendApplicationSubmittedEmail(email, data);
console.log(result); // Should return messageId
```

### Issue: No failed emails showing

**Diagnosis:**
- All emails sent successfully
- Or failed emails were already processed

**Solution:**
```bash
# Check total statistics
node view-email-logs.js --stats

# Check specific application
node view-email-logs.js --app APP-2024-0001
```

### Issue: Log queries slow

**Diagnosis:**
- Large result sets
- Missing indexes
- Database not optimized

**Solution:**
- Use limit parameters (max 100)
- Query by date range instead of all records
- Check database indexes are created

---

## Best Practices

1. **Regular Reviews**
   - Review failed emails weekly
   - Monitor success rate trends
   - Check for template issues

2. **Data Retention**
   - Keep logs for minimum 1 year (compliance)
   - Archive old logs if needed
   - Don't delete entries

3. **Monitoring**
   - Set up alerts for failed emails
   - Monitor success rate < 95%
   - Check for provider-specific issues

4. **Testing**
   - Always enable logging in tests
   - Verify logs in test database
   - Clean up test logs regularly

5. **Documentation**
   - Document custom templates
   - Log any manual email sends
   - Record any email issues

---

## Security Considerations

### Audit Log Integrity
- ✅ Read-only logs (append-only)
- ✅ No deletion of logs
- ✅ Timestamp immutable
- ✅ System actor recorded

### Data Privacy
- ✅ Role-based access control
- ✅ Email addresses hidden from non-admins
- ✅ HTTPS required for API access
- ✅ No plain-text passwords logged

### Compliance
- ✅ Audit trail for all sends
- ✅ GDPR compliant retention
- ✅ Trackable delivery history
- ✅ Failure logging for investigations

---

## Implementation Checklist

- ✅ Email logging utility (`src/services/emailLogging.js`)
- ✅ Enhanced TransactionalEmailService with dual logging
- ✅ Audit controller with REST endpoints
- ✅ CLI viewer for admins
- ✅ Role-based access control
- ✅ Database schema and indexes
- ✅ CSV export functionality
- ✅ Error handling and recovery
- ✅ Comprehensive documentation

---

## Summary

The Email Logging System provides:
- **Complete Traceability:** Every email logged with full details
- **Accountability:** Who sent what, to whom, and when
- **Read-Only Safety:** Immutable audit trail
- **Easy Access:** REST API and CLI interfaces
- **Privacy:** Role-based access control
- **Compliance:** Full audit trail for regulations
- **Analytics:** Statistics and reporting tools

All emails are recorded for accountability, with recipient, template, timestamp, and application reference linked for complete traceability.

---

**Status:** ✅ Production Ready  
**Last Updated:** February 6, 2024  
**Version:** 1.0
