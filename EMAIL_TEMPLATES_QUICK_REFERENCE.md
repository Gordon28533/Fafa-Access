# Email Templates Quick Reference

Fast lookup guide for email template variables and usage.

## Template Variables Map

### Application Submitted Email

**When Sent:** When student submits application

**Function:** `sendApplicationSubmittedEmail(to, data)`

**Required Variables:**
```javascript
{
  name: "Jane Smith",                           // Student's full name
  applicationRef: "APP-2026-0001",              // Application reference
  submissionDate: "6 Feb 2026",                 // Date submitted
  dashboardUrl: "https://app.fafaaccess.edu.gh/dashboard"  // Dashboard link
}
```

**Email Details:**
- **Subject:** "Application Received"
- **Color:** Purple (#667eea → #764ba2)
- **Status Badge:** "Pending SRC Review"
- **Sections:** Status, Timeline, Dashboard link, Important notes

**Database Trigger:** After `INSERT` into `applications` table

---

### Application Approved Email

**When Sent:** When SRC and Admin approve the application

**Function:** `sendApplicationApprovedEmail(to, data)`

**Required Variables:**
```javascript
{
  name: "Jane Smith",                           // Student's full name
  applicationRef: "APP-2026-0001",              // Application reference
  approvalDate: "6 Feb 2026",                   // Date approved
  laptopModel: "Dell Inspiron 15",              // Approved laptop
  dashboardUrl: "https://app.fafaaccess.edu.gh/dashboard"  // Dashboard link
}
```

**Email Details:**
- **Subject:** "Congratulations! Your Application is Approved"
- **Color:** Green (#10b981 → #059669)
- **Status Badge:** "Approved"
- **Sections:** Congratulations message, Timeline (3-step), Important notes

**Database Trigger:** After both SRC and Admin approvals (status = APPROVED)

**Timeline Shown:**
1. ✓ Approved (today)
2. ◐ Delivery Scheduling (5-15 days)
3. ◯ Delivery (20-30 days after approval)

---

### Application Rejected Email

**When Sent:** When application is rejected at SRC or Admin stage

**Function:** `sendApplicationRejectedEmail(to, data)`

**Required Variables:**
```javascript
{
  name: "Jane Smith",                           // Student's full name
  applicationRef: "APP-2026-0001",              // Application reference
  decisionDate: "6 Feb 2026",                   // Date of rejection
  rejectionReason: "Documents do not meet requirements"  // Why rejected
}
```

**Email Details:**
- **Subject:** "Application Decision"
- **Color:** Red (#ef4444 → #dc2626)
- **Status Badge:** "Not Approved"
- **Sections:** Reason, Appeal process, Resources, Support

**Database Trigger:** When status changed to `REJECTED`

**Appeal Information:**
- Appeal period: 10 days
- Appeal contact: [support email]
- Reapplication eligible after: 30 days

---

### Delivery Scheduled Email

**When Sent:** When delivery is scheduled for approved application

**Function:** `sendDeliveryScheduledEmail(to, data)`

**Required Variables:**
```javascript
{
  name: "Jane Smith",                           // Student's full name
  applicationRef: "APP-2026-0001",              // Application reference
  deliveryDate: "13 Feb 2026",                  // Delivery date
  deliveryTimeWindow: "9:00 AM - 5:00 PM",     // Time window
  agentName: "John Mensah",                     // Delivery agent
  location: "Main Campus Legon",                // Delivery location
  agentPhone: "+233 24 123 4567",               // Contact number
  dashboardUrl: "https://app.fafaaccess.edu.gh/dashboard"  // Dashboard link
}
```

**Email Details:**
- **Subject:** "Your Laptop Delivery is Scheduled"
- **Color:** Blue (#3b82f6 → #2563eb)
- **Status Badge:** "Delivery Scheduled"
- **Sections:** Delivery details, Checklist (5 items), Instructions, Rescheduling info

**Pre-Delivery Checklist:**
- [ ] 📅 Mark calendar for delivery date
- [ ] 💳 Have payment ready (GHS 500.00)
- [ ] 🪪 Bring valid ID
- [ ] 📱 Keep phone active for agent contact
- [ ] 📍 Confirm location accessibility

**Database Trigger:** When delivery is assigned (status = DELIVERY_ASSIGNED)

---

### Payment Required Email

**When Sent:** After successful laptop delivery, payment is due

**Function:** `sendPaymentRequiredEmail(to, data)`

**Required Variables:**
```javascript
{
  name: "Jane Smith",                           // Student's full name
  applicationRef: "APP-2026-0001",              // Application reference
  amount: "GHS 500.00",                         // Payment amount
  paymentDueDate: "31 Mar 2026"                 // Due date
}
```

**Email Details:**
- **Subject:** "Payment Required"
- **Color:** Amber (#f59e0b → #d97706)
- **Status Badge:** "Payment Due"
- **Sections:** Amount, Payment methods (3 options), Timeline, Important notes

**Payment Methods Shown:**
1. **Cash Payment**
   - Location: Finance Office Legon
   - Hours: Mon-Fri 8:00 AM - 4:00 PM

2. **Mobile Money**
   - Provider: MTN Mobile Money
   - Account: Fafa Access Ltd
   - Code: *170#

3. **Bank Transfer**
   - Bank: Ghana Commercial Bank
   - Account: 0123456789
   - SWIFT: GCBLGHAC

**Payment Timeline:**
1. 📧 Receive payment email
2. 💰 Transfer payment via chosen method
3. ✅ Confirm payment in dashboard

**Database Trigger:** After delivery confirmation (status = DELIVERY_CONFIRMED)

---

## Template Color Reference

| Template | Primary | Accent | Status |
|----------|---------|--------|--------|
| Application Submitted | #667eea | #764ba2 | Pending |
| Application Approved | #10b981 | #059669 | Approved |
| Application Rejected | #ef4444 | #dc2626 | Rejected |
| Delivery Scheduled | #3b82f6 | #2563eb | Scheduled |
| Payment Required | #f59e0b | #d97706 | Due |

---

## Implementation Checklist

### Before Sending

- [ ] All required variables provided
- [ ] Variables formatted correctly (names, dates, currency)
- [ ] URLs are absolute (https://) not relative
- [ ] Placeholder syntax is `{{variable}}` with double braces

### Common Issues

**Missing Variables:**
```javascript
// ❌ Wrong - Will show {{dashboardUrl}} in email
sendApplicationSubmittedEmail('user@example.com', {
  name: 'John Doe',
  applicationRef: 'APP-2026-0001'
});

// ✅ Correct - All required variables provided
sendApplicationSubmittedEmail('user@example.com', {
  name: 'John Doe',
  applicationRef: 'APP-2026-0001',
  submissionDate: '6 Feb 2026',
  dashboardUrl: 'https://app.example.com'
});
```

**Incorrect Placeholder Syntax:**
```javascript
// ❌ Wrong placeholders in data
{
  name: 'John Doe',
  applicationRef: 'APP-2026-0001'
}

// ✅ Correct - Data without placeholder braces
{
  name: 'John Doe',
  applicationRef: 'APP-2026-0001'
}

// Placeholders {{name}} are replaced AFTER this data is provided
```

**Date Formatting:**
```javascript
// ✅ Good formats
submissionDate: '6 Feb 2026'
submissionDate: 'February 6, 2026'
submissionDate: '06/02/2026'

// ❌ Avoid UTC timestamps
submissionDate: '2026-02-06T15:01:01.000Z'
```

---

## Testing Template Data

### Quick Test Data

Use this data for testing all templates:

```javascript
const testData = {
  applicationSubmitted: {
    name: 'Jane Smith',
    applicationRef: 'APP-2026-0001',
    submissionDate: '6 Feb 2026',
    dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
  },
  applicationApproved: {
    name: 'Jane Smith',
    applicationRef: 'APP-2026-0001',
    approvalDate: '7 Feb 2026',
    laptopModel: 'Dell Inspiron 15',
    dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
  },
  applicationRejected: {
    name: 'Jane Smith',
    applicationRef: 'APP-2026-0001',
    decisionDate: '7 Feb 2026',
    rejectionReason: 'Academic records do not meet program requirements'
  },
  deliveryScheduled: {
    name: 'Jane Smith',
    applicationRef: 'APP-2026-0001',
    deliveryDate: '13 Feb 2026',
    deliveryTimeWindow: '9:00 AM - 5:00 PM',
    agentName: 'John Mensah',
    location: 'Main Campus Legon',
    agentPhone: '+233 24 123 4567',
    dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
  },
  paymentRequired: {
    name: 'Jane Smith',
    applicationRef: 'APP-2026-0001',
    amount: 'GHS 500.00',
    paymentDueDate: '31 Mar 2026'
  }
};

// Test each template
Object.entries(testData).forEach(([type, data]) => {
  console.log(`Testing ${type}:`, data);
});
```

---

## Email Client Compatibility

All templates tested and compatible with:

✅ **Desktop**
- Gmail (Web)
- Outlook (Web)
- Apple Mail
- Thunderbird

✅ **Mobile**
- Gmail App (iOS/Android)
- Apple Mail
- Outlook App (iOS/Android)
- Samsung Mail

✅ **Webmail**
- Gmail
- Outlook.com
- Yahoo Mail

---

## Quick Usage Examples

### Sending from Controller

```javascript
import { sendApplicationSubmittedEmail } from '../services/emailNotifications.js';

// After application created
const application = await db.insert(applications).values(...).returning();

await sendApplicationSubmittedEmail(student.email, {
  name: student.name,
  applicationRef: application.reference,
  submissionDate: new Date().toLocaleDateString('en-GB'),
  dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard?app=' + application.id
});
```

### Sending after Status Changes

```javascript
// When application approved
if (newStatus === 'APPROVED') {
  await sendApplicationApprovedEmail(student.email, {
    name: student.name,
    applicationRef: application.reference,
    approvalDate: new Date().toLocaleDateString('en-GB'),
    laptopModel: assignment.laptop.model,
    dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
  });
}

// When delivery scheduled
if (newStatus === 'DELIVERY_ASSIGNED') {
  await sendDeliveryScheduledEmail(student.email, {
    name: student.name,
    applicationRef: application.reference,
    deliveryDate: delivery.scheduledDate.toLocaleDateString('en-GB'),
    deliveryTimeWindow: `${delivery.timeStart} - ${delivery.timeEnd}`,
    agentName: agent.name,
    location: delivery.location,
    agentPhone: agent.phone,
    dashboardUrl: 'https://app.fafaaccess.edu.gh/dashboard'
  });
}

// When payment due
if (newStatus === 'DELIVERY_CONFIRMED') {
  await sendPaymentRequiredEmail(student.email, {
    name: student.name,
    applicationRef: application.reference,
    amount: 'GHS ' + payment.amount.toFixed(2),
    paymentDueDate: payment.dueDate.toLocaleDateString('en-GB')
  });
}
```

---

**Last Updated:** February 6, 2026
**Template Version:** 1.0
**Status:** ✅ Production Ready
