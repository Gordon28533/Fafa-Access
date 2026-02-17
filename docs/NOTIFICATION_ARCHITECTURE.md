# Notification Architecture: Event-Driven System

## Overview

The notification system has been upgraded to an **event-driven orchestrator** with support for:
- **Channel fallbacks**: SMS → WhatsApp → Email (configurable per role)
- **Retry logic**: Up to 2 attempts per channel before fallback
- **Delivery tracking**: Real-time status (sent, failed, exhausted) and correlation IDs
- **User preferences**: Per-role channel ordering with defaults
- **Deduplication**: Time-window based (5 min default) to prevent duplicate sends
- **Simulated reliability**: Channel reliability weights (SMS 93%, WhatsApp 88%, Email 97%)

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Event Publisher (Trigger)                                       │
│  e.g., notifyApplicationSubmitted({ recipientName, ... })       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ publishEvent('student.applicationSubmitted', payload)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  NotificationService.publishEvent()                              │
│  - Resolve event from catalog                                    │
│  - Generate correlation ID                                       │
│  - Check dedupe cache                                            │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ dispatchNotification()
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Channel Orchestrator                                            │
│  - Get channel preferences (per role)                            │
│  - Iterate channels: SMS → WhatsApp → Email                     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
┌──────────┐┌──────────┐┌──────────┐
│   SMS    ││WhatsApp  ││  Email   │
│ (93%)    ││ (88%)    ││ (97%)    │
└────┬─────┘└────┬─────┘└────┬─────┘
     │           │           │
     │ Retry up to 2x on failure
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Logging & Storage                                               │
│  - Status Log: [eventName, status, channel, attempts, ...]      │
│  - Notification Log: [recipientName, title, message, status]    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Catalog

The system includes pre-defined events for common scenarios:

### Student Events
- `student.applicationSubmitted` → SMS → WhatsApp → Email
- `student.srcApproved` → SMS → WhatsApp → Email
- `student.srcRejected` → SMS → WhatsApp → Email
- `student.adminApproved` → SMS → WhatsApp → Email
- `student.deliveryAssigned` → SMS → WhatsApp → Email
- `student.deliveryCompleted` → SMS → WhatsApp → Email
- `student.paymentCollected` → SMS → WhatsApp → Email

### Admin Events
- `admin.srcApproved` → Email → WhatsApp → SMS
- `admin.srcRejected` → Email → WhatsApp → SMS
- `admin.deliveryAssigned` → Email → WhatsApp → SMS
- `admin.deliveryConfirmed` → Email → WhatsApp → SMS
- `admin.paymentCollected` → Email → WhatsApp → SMS

### Delivery Events
- `delivery.assigned` → WhatsApp → SMS
- `delivery.reminder` → WhatsApp → SMS
- `delivery.paymentCollection` → WhatsApp → SMS
- `delivery.confirmationPending` → WhatsApp → SMS

### SRC Events
- `src.newApplication` → WhatsApp → Email → SMS (with dedupe)
- `src.adminFlag` → WhatsApp → Email → SMS (with dedupe)
- `src.escalated` → WhatsApp → Email → SMS (with dedupe)

---

## API Reference

### `publishEvent(eventName, payload, options)`

Publishes an event through the orchestrator.

```javascript
import NotificationService from './services/NotificationService';

// Simple usage (uses default preferences)
NotificationService.publishEvent('student.applicationSubmitted', {
  recipientName: 'John Doe',
  applicationRef: 'APP-2024-001',
  university: 'University of Ghana',
});

// With custom options
NotificationService.publishEvent('student.applicationSubmitted', {
  recipientName: 'John Doe',
  applicationRef: 'APP-2024-001',
  university: 'University of Ghana',
}, {
  channels: ['email', 'sms'],  // Override default order
  maxAttempts: 3,
  dedupeKey: 'APP-2024-001',
  dedupeTtlMs: 10 * 60 * 1000,  // 10 minutes
  metadata: { userId: 123 },
  forceFailure: { email: true },  // Simulate failure for testing
});
```

### `updatePreferences(recipientRole, channels)`

Update channel preferences for a role.

```javascript
NotificationService.updatePreferences('Student', ['email', 'sms', 'whatsapp']);
NotificationService.updatePreferences('Admin', ['whatsapp', 'email']);
```

### `getStoredNotifications()`

Retrieve all sent notifications.

```javascript
const notifications = NotificationService.getStoredNotifications();
// Returns: [{ recipientName, recipientRole, channel, title, message, timestamp, status, ... }]
```

### `getStatusLog()`

Retrieve delivery status log (new API).

```javascript
const log = NotificationService.getStatusLog();
// Returns: [{ eventName, correlationId, channel, status, attempts, timestamp, ... }]
```

---

## Status Tracking

Each notification dispatch generates a status entry:

### Status Values
- **`sent`**: Successfully delivered on this channel
- **`failed`**: Attempt failed, will try next channel
- **`exhausted`**: All channels exhausted, notification not delivered
- **`duplicate`**: Skipped due to dedupe window

### Status Entry Structure
```javascript
{
  eventName: 'student.applicationSubmitted',
  correlationId: 'evt-1234567890-abc123',
  recipientName: 'John Doe',
  recipientRole: 'Student',
  title: 'Application Submitted',
  message: '...',
  channel: 'sms',
  status: 'sent',
  attempts: 1,
  timestamp: '2024-01-15T10:30:45.123Z',
  messageId: 'sms-1234567890-abc123',
  metadata: { ... }
}
```

---

## Default Channel Preferences

```javascript
const DEFAULT_PREFERENCES = {
  Student: ['sms', 'whatsapp', 'email'],        // Critical first
  SRC: ['whatsapp', 'email', 'sms'],            // Urgent + backup
  Admin: ['email', 'whatsapp', 'sms'],          // Professional + urgent
  Delivery: ['whatsapp', 'sms', 'email'],       // Mobile-first
};
```

---

## Deduplication

To prevent duplicate notifications:

```javascript
NotificationService.publishEvent('student.applicationSubmitted', {
  recipientName: 'John Doe',
  applicationRef: 'APP-2024-001',
  university: 'University of Ghana',
}, {
  dedupeKey: 'APP-2024-001',
  dedupeTtlMs: 5 * 60 * 1000,  // 5 minutes (default)
});
```

If the same `dedupeKey` is published within the TTL window, the event is skipped and returns:
```javascript
{ status: 'duplicate', correlationId: 'APP-2024-001', delivered: false }
```

---

## Updated Trigger Functions

All trigger functions now route through `publishEvent`:

### Student Triggers
```javascript
import { notifyApplicationSubmitted } from './services/studentNotificationTriggers';

// Old approach (multi-channel)
// Now simplified - single call handles fallbacks
await notifyApplicationSubmitted({
  recipientName: 'John Doe',
  applicationRef: 'APP-2024-001',
  university: 'University of Ghana',
});
```

### Admin Triggers
```javascript
import { notifyAdminSRCApproved } from './services/adminNotificationTriggers';

await notifyAdminSRCApproved({
  studentName: 'John Doe',
  applicationRef: 'APP-2024-001',
});
```

### Delivery Triggers
```javascript
import { notifyDeliveryAssigned } from './services/deliveryNotificationTriggers';

await notifyDeliveryAssigned({
  recipientName: 'Agent Smith',
  studentName: 'John Doe',
  location: 'Accra, Ghana',
  deliveryDate: '2024-01-20',
});
```

### SRC Triggers (with dedupe)
```javascript
import { notifySRCNewApplication } from './services/srcNotificationTriggers';

await notifySRCNewApplication({
  studentName: 'John Doe',
  applicationRef: 'APP-2024-001',
  submissionDate: '2024-01-15',
});
```

---

## Admin Dashboard

The **Notification Log** component (updated) now displays:
- **Timestamp**: When the notification was sent
- **Recipient**: Name of the recipient
- **Role**: Student, Admin, SRC, or Delivery
- **Channel**: SMS, WhatsApp, or Email
- **Status**: Color-coded (✓ sent, ⚠ failed, ✗ exhausted)
- **Title**: Event title
- **Correlation ID**: For tracking multi-channel retries

Filters available:
- By Role
- By Channel
- By Status

---

## Local Storage Keys

- **`notifications`**: Historical notification log (last 200)
- **`notification-status`**: Delivery status log (last 200)
- **`notification-preferences`**: User channel preferences per role

---

## Testing

Simulate failures for a specific channel:

```javascript
NotificationService.publishEvent('student.applicationSubmitted', {
  recipientName: 'John Doe',
  applicationRef: 'APP-2024-001',
  university: 'University of Ghana',
}, {
  forceFailure: { sms: true },  // Simulate SMS failure → fallback to WhatsApp
});
```

---

## Future Enhancements

1. **Backend Integration**: Replace simulated `deliverOnChannel()` with real SMS/WhatsApp/Email APIs
   - Twilio for SMS & WhatsApp
   - SendGrid/Mailgun for Email

2. **Queue System**: Integrate with Bull/RabbitMQ for async processing

3. **Analytics**: Track delivery rates, channel preferences, and bounce handling

4. **User Preferences UI**: Allow users to manage their own channel preferences

5. **Rate Limiting**: Prevent notification spam per user/role

6. **Webhooks**: Real-time delivery status updates from external providers

7. **Scheduled Notifications**: Support delayed/batch sends

---

## Summary

| Feature | Implementation |
|---------|-----------------|
| Event-Driven | ✓ Catalog-based event dispatch |
| Fallbacks | ✓ SMS → WhatsApp → Email |
| Retry Logic | ✓ 2 attempts per channel |
| Preferences | ✓ Per-role channel ordering |
| Deduplication | ✓ Time-window based |
| Tracking | ✓ Status log with correlation IDs |
| Storage | ✓ localStorage with 200-entry limit |
| Admin UI | ✓ Filterable notification log |
| Legacy Support | ✓ Backward-compatible trigger functions |

