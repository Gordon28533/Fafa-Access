# Notification Triggers: Event-to-Notification Mapping

## Overview

Comprehensive mapping of all notification events in the system, including trigger points, recipients, channel priorities, and message purposes.

---

## Master Event-to-Notification Map

| # | Event Name | Trigger Point | Recipients | Channel Priority | Message Purpose |
|----|------------|---------------|-----------|------------------|-----------------|
| 1 | `student.applicationSubmitted` | Student submits application | Student | SMS → WhatsApp → Email | Confirm receipt; provide reference number; set expectations |
| 2 | `student.srcApproved` | SRC approves application | Student | SMS → WhatsApp → Email | Celebrate milestone; inform of next step (Admin review) |
| 3 | `student.srcRejected` | SRC rejects application | Student | SMS → WhatsApp → Email | Inform rejection; provide reason; offer support/appeal info |
| 4 | `student.adminApproved` | Admin approves application | Student | SMS → WhatsApp → Email | Celebrate final approval; confirm delivery arrangement process |
| 5 | `student.adminRejected` | Admin rejects application | Student | SMS → WhatsApp → Email | Inform rejection; provide reason; offer support contacts |
| 6 | `student.deliveryAssigned` | Delivery scheduled | Student | SMS → WhatsApp → Email | Confirm delivery date/time; provide delivery agent details; request confirmation |
| 7 | `student.deliveryCompleted` | Laptop delivered | Student | SMS → WhatsApp → Email | Confirm receipt; thank participant; provide support contacts |
| 8 | `student.paymentCollected` | 70% payment collected | Student | SMS → WhatsApp → Email | Confirm payment receipt; provide proof; thank for promptness |
| 9 | `admin.srcApproved` | SRC approves application | Admin | Email → WhatsApp → SMS | Alert for review action; provide applicant summary |
| 10 | `admin.srcRejected` | SRC rejects application | Admin | Email → WhatsApp → SMS | Notify rejection; no action required; archive application |
| 11 | `admin.adminRejected` | Admin rejects application | Admin | Email → WhatsApp → SMS | Confirm rejection decision; log reason; archive application |
| 12 | `admin.deliveryAssigned` | Delivery assigned to agent | Admin | Email → WhatsApp → SMS | Confirm delivery assignment; track status; monitor payment |
| 13 | `admin.deliveryConfirmed` | Delivery confirmed by agent | Admin | Email → WhatsApp → SMS | Confirm delivery completion; verify payment collection |
| 14 | `admin.paymentCollected` | 70% payment collected | Admin | Email → WhatsApp → SMS | Alert payment received; prepare payout to SRC |
| 15 | `admin.payoutCompleted` | Payout sent to SRC | Admin | Email → WhatsApp → SMS | Confirm payout completion; provide transaction reference |
| 16 | `delivery.assigned` | Delivery assigned to staff | Delivery Staff | WhatsApp → SMS → Email | New assignment; provide student/location details; confirm receipt |
| 17 | `delivery.reminder` | Pre-delivery reminder (24h before) | Delivery Staff | WhatsApp → SMS → Email | Remind of upcoming delivery; confirm readiness; payment reminder |
| 18 | `delivery.paymentCollection` | Payment collection prompt | Delivery Staff | WhatsApp → SMS → Email | Reminder to collect 70% from student; provide amount/account |
| 19 | `delivery.confirmationPending` | After delivery completion | Delivery Staff | WhatsApp → SMS → Email | Request delivery confirmation; prompt status update in system |
| 20 | `src.newApplication` | New application submitted | SRC | WhatsApp → Email → SMS (dedupe 5min) | Alert new application; provide student/reference details |
| 21 | `src.adminFlag` | Admin flags pending approval | SRC | WhatsApp → Email → SMS (dedupe 5min) | Urgent alert; priority review required; provide context |
| 22 | `src.escalated` | Application escalated/delayed | SRC | WhatsApp → Email → SMS (dedupe 5min) | Alert escalation; provide reason; request priority handling |

---

## Event Details by Category

### Student Events (8 events)

#### 1. Application Submitted
```
Event Name:    student.applicationSubmitted
Trigger:       Student submits application form
Recipient:     Student (by phone/email)
Priority:      SMS → WhatsApp → Email
Purpose:       Receipt confirmation, reference number, timeline setting
Content:       
  - Application received (reference number)
  - Expected review timeline (SRC review in X days)
  - Next steps
  - Support contact info
Status Tracking: correlationId for reference
Example:
  NotificationService.publishEvent('student.applicationSubmitted', {
    recipientName: 'John Doe',
    applicationRef: 'APP-2024-001',
    university: 'University of Ghana'
  });
```

#### 2. SRC Approved
```
Event Name:    student.srcApproved
Trigger:       SRC approves application
Recipient:     Student
Priority:      SMS → WhatsApp → Email
Purpose:       Milestone achievement, next step notification
Content:
  - Congratulations message
  - Approved status confirmation
  - Next step (Admin review timeline)
  - Encouragement
Status Tracking: Tracks multi-channel delivery
```

#### 3. SRC Rejected
```
Event Name:    student.srcRejected
Trigger:       SRC rejects application
Recipient:     Student
Priority:      SMS → WhatsApp → Email
Purpose:       Rejection notification with reason
Content:
  - Rejection status
  - Reason for rejection
  - Appeal/re-application options (if available)
  - Support contact info
Status Tracking: Tracks failed channel fallback
```

#### 4. Admin Approved
```
Event Name:    student.adminApproved
Trigger:       Admin provides final approval
Recipient:     Student
Priority:      SMS → WhatsApp → Email
Purpose:       Final approval, delivery arrangement initiation
Content:
  - Final approval confirmation
  - Congratulations message
  - Delivery arrangement process info
  - Timeline for delivery coordination
  - Contact person for delivery
Status Tracking: Critical milestone tracking
```

#### 5. Admin Rejected
```
Event Name:    student.adminRejected
Trigger:       Admin rejects application
Recipient:     Student
Priority:      SMS → WhatsApp → Email
Purpose:       Rejection notification with reason
Content:
  - Rejection status
  - Reason for rejection
  - Appeal options
  - Support contact info
Status Tracking: Final decision log
```

#### 6. Delivery Assigned
```
Event Name:    student.deliveryAssigned
Trigger:       Admin assigns delivery agent/date
Recipient:     Student
Priority:      SMS → WhatsApp → Email
Purpose:       Delivery logistics confirmation
Content:
  - Delivery date/time
  - Delivery agent name/phone
  - Delivery location instructions
  - Request for confirmation
  - Payment reminder (70% on delivery)
Status Tracking: Delivery tracking initialization
```

#### 7. Delivery Completed
```
Event Name:    student.deliveryCompleted
Trigger:       Delivery agent confirms delivery
Recipient:     Student
Priority:      SMS → WhatsApp → Email
Purpose:       Delivery confirmation, satisfaction survey setup
Content:
  - Delivery confirmation
  - Thank you message
  - Warranty/support info
  - Feedback/satisfaction survey link
  - Support contact info
Status Tracking: Final delivery milestone
```

#### 8. Payment Collected
```
Event Name:    student.paymentCollected
Trigger:       70% payment confirmed received
Recipient:     Student
Priority:      SMS → WhatsApp → Email
Purpose:       Payment receipt confirmation
Content:
  - Payment amount confirmed
  - Transaction reference/receipt
  - Thank you message
  - Invoice/payment proof
  - Remaining 30% payment info
Status Tracking: Payment verification log
```

---

### Admin Events (7 events)

#### 9. SRC Approved (Admin Alert)
```
Event Name:    admin.srcApproved
Trigger:       SRC approves application
Recipient:     Admin
Priority:      Email → WhatsApp → SMS
Purpose:       Action alert for admin review
Content:
  - SRC approval notification
  - Student name/reference
  - Summary of student/application
  - Link to admin dashboard for review
  - Timeline for admin decision
Status Tracking: Workflow progression
```

#### 10. SRC Rejected (Admin Alert)
```
Event Name:    admin.srcRejected
Trigger:       SRC rejects application
Recipient:     Admin
Priority:      Email → WhatsApp → SMS
Purpose:       Status notification, no action required
Content:
  - SRC rejection notification
  - Student name/reference
  - Reason for rejection (if provided)
  - Status: no further action needed
Status Tracking: Application closure log
```

#### 11. Admin Rejection
```
Event Name:    admin.adminRejected
Trigger:       Admin rejects application
Recipient:     Admin
Priority:      Email → WhatsApp → SMS
Purpose:       Decision log/record keeping
Content:
  - Rejection confirmation
  - Reason logged
  - Status: closed/archived
  - Audit trail for decision
Status Tracking: Decision audit log
```

#### 12. Delivery Assigned (Admin Alert)
```
Event Name:    admin.deliveryAssigned
Trigger:       Admin assigns delivery agent
Recipient:     Admin
Priority:      Email → WhatsApp → SMS
Purpose:       Delivery status tracking
Content:
  - Delivery assignment confirmation
  - Agent name/contact
  - Student name/reference
  - Delivery date/location
  - Expected payment collection timeline
Status Tracking: Delivery workflow progress
```

#### 13. Delivery Confirmed
```
Event Name:    admin.deliveryConfirmed
Trigger:       Delivery agent confirms completion
Recipient:     Admin
Priority:      Email → WhatsApp → SMS
Purpose:       Delivery verification, payment confirmation
Content:
  - Delivery completion confirmation
  - Student name/reference
  - Delivery date/time completed
  - Payment collection status
  - Payout readiness check
Status Tracking: Final delivery milestone
```

#### 14. Payment Collected (Admin Alert)
```
Event Name:    admin.paymentCollected
Trigger:       70% payment received from student
Recipient:     Admin
Priority:      Email → WhatsApp → SMS
Purpose:       Payment verification, payout trigger
Content:
  - Payment received notification
  - Amount collected
  - Student name/reference
  - Payment method/reference
  - Next step: prepare SRC payout
Status Tracking: Payment verification audit
```

#### 15. Payout Completed
```
Event Name:    admin.payoutCompleted
Trigger:       SRC payout sent
Recipient:     Admin
Priority:      Email → WhatsApp → SMS
Purpose:       Payout completion record
Content:
  - Payout completion confirmation
  - Amount transferred
  - Transfer method (Bank Transfer, Mobile Money, etc.)
  - Transaction reference/receipt
  - Account credited (SRC entity)
  - Application reference
Status Tracking: Financial transaction audit log
```

---

### Delivery Staff Events (4 events)

#### 16. Delivery Assigned (Agent)
```
Event Name:    delivery.assigned
Trigger:       Admin assigns delivery to agent
Recipient:     Delivery Staff
Priority:      WhatsApp → SMS → Email
Purpose:       New assignment notification
Content:
  - Assignment confirmation
  - Student name/phone/location
  - Delivery date/time
  - Laptop model/details
  - Payment collection reminder (70%)
  - Delivery agent commission info
Status Tracking: Agent task assignment tracking
```

#### 17. Delivery Reminder (24h before)
```
Event Name:    delivery.reminder
Trigger:       System reminder 24h before delivery
Recipient:     Delivery Staff
Priority:      WhatsApp → SMS → Email
Purpose:       Readiness confirmation, logistics prep
Content:
  - Delivery tomorrow reminder
  - Student contact info
  - Delivery location/directions
  - Time window
  - Payment collection reminder
  - Contact info if issue arises
Status Tracking: Reminder delivery tracking
```

#### 18. Payment Collection Prompt
```
Event Name:    delivery.paymentCollection
Trigger:       Manual trigger or pre-delivery
Recipient:     Delivery Staff
Priority:      WhatsApp → SMS → Email
Purpose:       Payment collection instructions
Content:
  - Reminder to collect 70% payment
  - Amount to collect
  - Payment method (Cash/Mobile Money)
  - Account/contact for payment
  - Receipt handling instructions
  - Commission calculation info
Status Tracking: Payment instruction audit
```

#### 19. Delivery Confirmation Pending
```
Event Name:    delivery.confirmationPending
Trigger:       After delivery completed
Recipient:     Delivery Staff
Priority:      WhatsApp → SMS → Email
Purpose:       Prompt for system status update
Content:
  - Request delivery confirmation in system
  - Student name/reference
  - Delivery completion checklist
  - Payment collected confirmation
  - System link for update
  - Support contact if issues
Status Tracking: Confirmation submission tracking
```

---

### SRC Events (3 events, with deduplication)

#### 20. New Application (SRC Alert)
```
Event Name:    src.newApplication
Trigger:       Student submits application
Recipient:     SRC
Priority:      WhatsApp → Email → SMS
Purpose:       New review task alert
Dedupe:        5-minute window per (studentName, appRef, type)
Content:
  - New application received
  - Student name/university
  - Application reference
  - Link to dashboard/review page
  - Submission date/time
  - Expected review timeline
Status Tracking: Review task assignment
```

#### 21. Admin Flag (Escalation)
```
Event Name:    src.adminFlag
Trigger:       Admin flags pending SRC approval
Recipient:     SRC
Priority:      WhatsApp → Email → SMS
Purpose:       Urgent escalation alert
Dedupe:        5-minute window per application
Content:
  - Urgent flag notification
  - Student name/reference
  - Reason for flag
  - Context/additional info
  - Request for priority review
  - Link to application
Status Tracking: Escalation tracking
```

#### 22. Escalated/Delayed
```
Event Name:    src.escalated
Trigger:       Application escalated or delayed
Recipient:     SRC
Priority:      WhatsApp → Email → SMS
Purpose:       Status alert and action request
Dedupe:        5-minute window per application
Content:
  - Escalation/delay notification
  - Student name/reference
  - Reason for escalation
  - Additional context/documents
  - Required actions
  - Escalation path/authority
Status Tracking: Escalation progress tracking
```

---

## Recipient-Centric View

### Students receive:
1. applicationSubmitted
2. srcApproved
3. srcRejected
4. adminApproved
5. adminRejected
6. deliveryAssigned
7. deliveryCompleted
8. paymentCollected

**Total: 8 events**
**Channel Order: SMS → WhatsApp → Email** (critical delivery preference)

### Admin receives:
1. srcApproved
2. srcRejected
3. adminRejected
4. deliveryAssigned
5. deliveryConfirmed
6. paymentCollected
7. payoutCompleted

**Total: 7 events**
**Channel Order: Email → WhatsApp → SMS** (professional/documentation preference)

### Delivery Staff receives:
1. assigned
2. reminder
3. paymentCollection
4. confirmationPending

**Total: 4 events**
**Channel Order: WhatsApp → SMS → Email** (mobile-first for field workers)

### SRC receives:
1. newApplication
2. adminFlag
3. escalated

**Total: 3 events**
**Channel Order: WhatsApp → Email → SMS** (urgent + documentation)
**Special: Deduplication enabled (5-min TTL per event)**

---

## Integration Examples

### Trigger from Controller
```javascript
import * as studentNotifications from './services/studentNotificationTriggers';

// After student submits application
await studentNotifications.notifyApplicationSubmitted({
  recipientName: 'John Doe',
  applicationRef: 'APP-2024-001',
  university: 'University of Ghana'
});

// After SRC approves
await studentNotifications.notifySRCApproved({
  recipientName: 'John Doe',
  applicationRef: 'APP-2024-001',
  university: 'University of Ghana'
});
```

### Admin Notifications
```javascript
import * as adminNotifications from './services/adminNotificationTriggers';

// SRC approved - alert admin
await adminNotifications.notifyAdminSRCApproved({
  studentName: 'John Doe',
  applicationRef: 'APP-2024-001'
});

// Payout to SRC
await adminNotifications.notifyAdminPayoutCompleted({
  studentName: 'John Doe',
  applicationRef: 'APP-2024-001',
  amount: 'GHS 450.00',
  method: 'Bank Transfer'
});
```

### Delivery Notifications
```javascript
import * as deliveryNotifications from './services/deliveryNotificationTriggers';

// Assign delivery
await deliveryNotifications.notifyDeliveryAssigned({
  recipientName: 'Agent Smith',
  studentName: 'John Doe',
  location: 'Accra, Ghana',
  deliveryDate: '2024-01-25'
});

// Payment collection reminder
await deliveryNotifications.notifyPaymentCollection({
  recipientName: 'Agent Smith',
  studentName: 'John Doe',
  location: 'Accra, Ghana',
  deliveryDate: '2024-01-25'
});
```

### SRC Notifications
```javascript
import * as srcNotifications from './services/srcNotificationTriggers';

// New application
await srcNotifications.notifySRCNewApplication({
  studentName: 'John Doe',
  applicationRef: 'APP-2024-001',
  submissionDate: '2024-01-15'
});

// Admin flag
await srcNotifications.notifySRCAdminFlag({
  studentName: 'John Doe',
  applicationRef: 'APP-2024-001',
  submissionDate: '2024-01-15'
});
```

---

## Implementation Checklist

- [x] Event catalog defined (22 total events)
- [x] Event handlers in NotificationService.js
- [x] Trigger functions in role-specific files
- [x] Channel prioritization configured
- [x] Deduplication logic for SRC events
- [x] Status tracking implementation
- [x] Admin dashboard updated
- [ ] Controller integration (next step)
- [ ] Real SMS/WhatsApp/Email APIs (future)
- [ ] Delivery tracking dashboard (future)

---

## Summary Table

| Role | Event Count | Primary Channel | Secondary Channel | Tertiary Channel |
|------|-------------|-----------------|-------------------|------------------|
| Student | 8 | SMS | WhatsApp | Email |
| Admin | 7 | Email | WhatsApp | SMS |
| Delivery Staff | 4 | WhatsApp | SMS | Email |
| SRC | 3 | WhatsApp | Email | SMS |
| **Total** | **22** | - | - | - |

