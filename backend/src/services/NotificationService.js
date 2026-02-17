// NotificationService.js
// Event-driven notification orchestrator with channel fallbacks, retry, preferences, and delivery tracking
import notificationTemplates, { renderChannelTemplate } from './notificationTemplates';
import SMSService from './SMSService';
import WhatsAppService from './WhatsAppService';
import EmailService from './EmailService';
import logNotificationRecord from '../middleware/notificationLogger.js';

const NOTIFICATION_STORAGE_KEY = 'notifications';
const STATUS_STORAGE_KEY = 'notification-status';
const PREFERENCE_STORAGE_KEY = 'notification-preferences';

const DEFAULT_PREFERENCES = {
  Student: ['whatsapp', 'sms', 'email'],
  SRC: ['whatsapp', 'email', 'sms'],
  Admin: ['email', 'whatsapp', 'sms'],
  Delivery: ['whatsapp', 'sms', 'email'],
};

const CHANNEL_RELIABILITY = {
  sms: 0.93,
  whatsapp: 0.88,
  email: 0.97,
};

const CRITICAL_EVENTS = new Set([
  'student.deliveryAssigned',
  'student.deliveryCompleted',
  'student.paymentCollected',
  'admin.payoutCompleted',
]);

const eventCatalog = {
  'student.applicationSubmitted': ({ recipientName, university, applicationRef }) => ({
    recipientName,
    recipientRole: 'Student',
    title: 'Application Submitted',
    message: notificationTemplates.applicationSubmitted({
      studentName: recipientName,
      university: university ?? 'your university',
      applicationRef,
    }),
  }),
  'student.srcApproved': ({ recipientName, university, applicationRef }) => ({
    recipientName,
    recipientRole: 'Student',
    title: 'SRC Approval',
    message: notificationTemplates.srcApproved({
      studentName: recipientName,
      university: university ?? 'your university',
      applicationRef,
    }),
  }),
  'student.srcRejected': ({ recipientName, applicationRef, reason }) => ({
    recipientName,
    recipientRole: 'Student',
    title: 'SRC Rejection',
    message: `Dear ${recipientName},\n\nWe regret to inform you that your laptop application (Ref: ${applicationRef}) was not approved by the SRC. Reason: ${reason || 'Not specified'}. Please contact the SRC office if you have questions.`,
  }),
  'student.adminApproved': ({ recipientName, university, applicationRef }) => ({
    recipientName,
    recipientRole: 'Student',
    title: 'Admin Approval',
    message: notificationTemplates.adminApproved({
      studentName: recipientName,
      university: university ?? 'your university',
      applicationRef,
    }),
  }),
  'student.adminRejected': ({ recipientName, applicationRef, reason }) => ({
    recipientName,
    recipientRole: 'Student',
    title: 'Admin Rejection',
    message: `Dear ${recipientName},\n\nWe regret to inform you that your laptop application (Ref: ${applicationRef}) was not approved by the Admin office. Reason: ${reason || 'Not specified'}. Please contact the Admin office if you have questions.`,
  }),
  'student.deliveryAssigned': ({ recipientName, university, applicationRef, deliveryDate }) => ({
    recipientName,
    recipientRole: 'Student',
    title: 'Delivery Assigned',
    message: notificationTemplates.deliveryAssigned({
      studentName: recipientName,
      university: university ?? 'your university',
      applicationRef,
      deliveryDate,
    }),
  }),
  'student.deliveryCompleted': ({ recipientName, university, applicationRef }) => ({
    recipientName,
    recipientRole: 'Student',
    title: 'Delivery Completed',
    message: notificationTemplates.deliveryCompleted({
      studentName: recipientName,
      university: university ?? 'your university',
      applicationRef,
    }),
  }),
  'student.paymentCollected': ({ recipientName, university, applicationRef, amount }) => ({
    recipientName,
    recipientRole: 'Student',
    title: 'Payment Collected',
    message: notificationTemplates.paymentCollected({
      studentName: recipientName,
      university: university ?? 'your university',
      applicationRef,
      amount,
    }),
  }),
  'admin.srcApproved': ({ studentName, applicationRef }) => ({
    recipientName: 'Admin',
    recipientRole: 'Admin',
    title: 'SRC Approved Application',
    message: `SRC approved application for ${studentName} [${applicationRef}]. Please review for admin approval.`,
  }),
  'admin.srcRejected': ({ studentName, applicationRef }) => ({
    recipientName: 'Admin',
    recipientRole: 'Admin',
    title: 'SRC Rejected Application',
    message: `SRC rejected application for ${studentName} [${applicationRef}]. No further action required.`,
  }),
  'admin.adminRejected': ({ studentName, applicationRef, reason }) => ({
    recipientName: 'Admin',
    recipientRole: 'Admin',
    title: 'Application Rejected',
    message: `Application for ${studentName} [${applicationRef}] has been rejected. Reason: ${reason || 'Not specified'}. No further action required.`,
  }),
  'admin.deliveryAssigned': ({ studentName, applicationRef, deliveryAgent }) => ({
    recipientName: 'Admin',
    recipientRole: 'Admin',
    title: 'Delivery Assigned',
    message: `Delivery assigned for ${studentName} [${applicationRef}] to ${deliveryAgent}.`,
  }),
  'admin.deliveryConfirmed': ({ studentName, applicationRef }) => ({
    recipientName: 'Admin',
    recipientRole: 'Admin',
    title: 'Delivery Confirmed',
    message: `Delivery confirmed for ${studentName} [${applicationRef}].`,
  }),
  'admin.paymentCollected': ({ studentName, applicationRef, amount }) => ({
    recipientName: 'Admin',
    recipientRole: 'Admin',
    title: 'Payment Collected',
    message: `70% payment collected for ${studentName} [${applicationRef}]. Amount: ${amount}.`,
  }),
  'admin.payoutCompleted': ({ studentName, applicationRef, amount, method }) => ({
    recipientName: 'Admin',
    recipientRole: 'Admin',
    title: 'SRC Payout Completed',
    message: `Payout completed for SRC: ${amount} via ${method || 'Bank Transfer'} for application [${applicationRef}] (Student: ${studentName}).`,
  }),
  'admin.notificationFailure': ({ failedEvent, channelsTried, correlationId, reason }) => ({
    recipientName: 'Admin',
    recipientRole: 'Admin',
    title: 'Notification Delivery Failure',
    message: `A notification failed to deliver. Event: ${failedEvent}. Channels tried: ${channelsTried || 'n/a'}. Correlation: ${correlationId || 'n/a'}. Reason: ${reason || 'Unknown'}.`,
    channelOrder: ['email', 'whatsapp', 'sms'],
  }),
  'delivery.assigned': ({ recipientName, studentName, location, deliveryDate }) => ({
    recipientName,
    recipientRole: 'Delivery',
    title: 'Delivery Assigned',
    message: `Student: ${studentName}\nLocation: ${location}\nDate: ${deliveryDate}\nA new laptop delivery has been assigned to you. Please prepare for delivery and collect 70% payment on delivery.`,
  }),
  'delivery.reminder': ({ recipientName, studentName, location, deliveryDate }) => ({
    recipientName,
    recipientRole: 'Delivery',
    title: 'Delivery Reminder',
    message: `Student: ${studentName}\nLocation: ${location}\nDate: ${deliveryDate}\nReminder: Upcoming laptop delivery. Ensure readiness and payment collection.`,
  }),
  'delivery.paymentCollection': ({ recipientName, studentName, location, deliveryDate }) => ({
    recipientName,
    recipientRole: 'Delivery',
    title: 'Payment Collection Required',
    message: `Student: ${studentName}\nLocation: ${location}\nDate: ${deliveryDate}\nCollect 70% payment on delivery.`,
  }),
  'delivery.confirmationPending': ({ recipientName, studentName, location, deliveryDate }) => ({
    recipientName,
    recipientRole: 'Delivery',
    title: 'Delivery Confirmation Pending',
    message: `Student: ${studentName}\nLocation: ${location}\nDate: ${deliveryDate}\nPlease confirm the delivery status in the system after completion.`,
  }),
  'src.newApplication': ({ studentName, applicationRef, submissionDate }) => ({
    recipientName: 'SRC',
    recipientRole: 'SRC',
    title: 'New Application Submitted',
    message: `Student: ${studentName}\nRef: ${applicationRef}\nDate: ${submissionDate}\nA new student laptop application has been submitted for your review.`,
  }),
  'src.adminFlag': ({ studentName, applicationRef, submissionDate }) => ({
    recipientName: 'SRC',
    recipientRole: 'SRC',
    title: 'Pending SRC Approval Flagged',
    message: `Student: ${studentName}\nRef: ${applicationRef}\nDate: ${submissionDate}\nAdmin flagged a pending SRC approval. Please review immediately.`,
  }),
  'src.escalated': ({ studentName, applicationRef, submissionDate, reason }) => ({
    recipientName: 'SRC',
    recipientRole: 'SRC',
    title: 'Application Escalated/Delayed',
    message: `Student: ${studentName}\nRef: ${applicationRef}\nDate: ${submissionDate}\nEscalation/Delay: ${reason || 'No reason provided.'}`,
  }),
};

function parseEventName(eventName) {
  const [role, evt] = (eventName || '').split('.');
  return { role, event: evt };
}

function buildTemplateVars({ recipientName, recipientRole, metadata = {} }) {
  return {
    name: metadata.name || metadata.studentName || recipientName,
    ref: metadata.ref || metadata.applicationRef,
    amount: metadata.amount,
    reason: metadata.reason,
    agent: metadata.deliveryAgent || metadata.agent,
    date: metadata.deliveryDate || metadata.date,
    method: metadata.method,
    student: metadata.studentName || metadata.student,
    location: metadata.location,
    role: recipientRole,
  };
}

function renderChannelMessage({ channel, eventName, recipientName, recipientRole, metadata, fallback }) {
  const { role, event } = parseEventName(eventName);
  const vars = buildTemplateVars({ recipientName, recipientRole, metadata });
  const rendered = renderChannelTemplate({ role, event, channel, vars });
  if (channel === 'email' && rendered && typeof rendered === 'object') {
    return rendered;
  }
  if (rendered) return rendered;
  return fallback || '';
}

function isCritical(eventName, metadata) {
  if (metadata?.noEscalate) return false;
  if (metadata?.critical === true) return true;
  if (metadata?.priority === 'high') return true;
  return CRITICAL_EVENTS.has(eventName);
}

const dedupeCache = new Map();

const safeId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`);

function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

function readStore(key, fallback) {
  if (!storageAvailable()) return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStore(key, value) {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Ignore storage failures
  }
}

let cachedPreferences = { ...DEFAULT_PREFERENCES, ...readStore(PREFERENCE_STORAGE_KEY, {}) };

function getChannelOrder(recipientRole, override) {
  const base = override?.length ? override : cachedPreferences[recipientRole] || DEFAULT_PREFERENCES[recipientRole] || ['sms', 'whatsapp', 'email'];
  return Array.from(new Set(base));
}

function updatePreferences(recipientRole, channels) {
  cachedPreferences = { ...cachedPreferences, [recipientRole]: channels };
  writeStore(PREFERENCE_STORAGE_KEY, cachedPreferences);
  return cachedPreferences;
}

function shouldSkipDuplicate(key, ttlMs = 5 * 60 * 1000) {
  if (!key) return false;
  const now = Date.now();
  const lastSent = dedupeCache.get(key);
  if (lastSent && now - lastSent < ttlMs) return true;
  dedupeCache.set(key, now);
  return false;
}

function logStatus(entry) {
  const log = readStore(STATUS_STORAGE_KEY, []);
  const nextLog = [entry, ...log].slice(0, 200);
  writeStore(STATUS_STORAGE_KEY, nextLog);
}

function logNotification(notification) {
  const existing = readStore(NOTIFICATION_STORAGE_KEY, []);
  const next = [notification, ...existing].slice(0, 200);
  writeStore(NOTIFICATION_STORAGE_KEY, next);
  // Persist immutable server-side log when available
  logNotificationRecord(notification);
}

const smsService = new SMSService({ rateLimit: { capacity: 15, refillRatePerSec: 8 } });
const whatsappService = new WhatsAppService({
  smsFallbackService: smsService,
  statusStore: (entry) => logStatus(entry),
});
const emailService = new EmailService({
  providerName: 'smtp',
  providerConfig: {},
  statusStore: (entry) => logStatus(entry),
});

async function deliverOnChannel(channel, payload) {
  const { eventName, recipientName, recipientRole, metadata = {}, title, message } = payload;
  const rendered = renderChannelMessage({ channel, eventName, recipientName, recipientRole, metadata, fallback: message });
  const to = metadata.phone || metadata.to || metadata.recipientPhone;
  const vars = buildTemplateVars({ recipientName, recipientRole, metadata });

  if (channel === 'whatsapp') {
    const smsFallbackMessage = renderChannelMessage({ channel: 'sms', eventName, recipientName, recipientRole, metadata, fallback: message });
    const result = await whatsappService.sendWithTemplate({
      role: parseEventName(eventName).role,
      event: parseEventName(eventName).event,
      to,
      vars,
      smsFallbackPayload: { to, message: smsFallbackMessage },
    });
    return {
      channel: result.channel || 'whatsapp',
      status: result.status || 'sent',
      messageId: result.messageId,
      body: result.body || rendered,
    };
  }

  if (channel === 'sms') {
    const reliability = CHANNEL_RELIABILITY.sms ?? 0.93;
    const shouldFail = payload?.forceFailure?.[channel] || Math.random() > reliability;
    if (shouldFail) throw new Error('Simulated SMS send failure');
    const smsResult = smsService.sendSms({ to, message: rendered, senderId: metadata.senderId });
    return {
      channel: 'sms',
      status: smsResult.enqueued ? 'queued' : 'sent',
      messageId: smsResult.messageId,
      body: rendered,
    };
  }

  // Email delivery with HTML + text fallback
  const emailContent = typeof rendered === 'object' ? rendered : { subject: title, body: rendered };
  const envelope = emailService.renderEmailEnvelope({ subject: emailContent.subject || title, body: emailContent.body || message });
  const toEmail = metadata.email || metadata.recipientEmail || (typeof metadata.to === 'string' && metadata.to.includes('@') ? metadata.to : null);
  const fromEmail = metadata.from || metadata.senderEmail || emailService.provider?.from;
  if (!toEmail) throw new Error('Email recipient (email) is required');
  if (!fromEmail) throw new Error('Email sender (from) is required');
  const result = await emailService.sendEmail({ to: toEmail, subject: envelope.subject, html: envelope.html, text: envelope.text, from: fromEmail });
  return {
    channel: 'email',
    status: result.status || 'sent',
    messageId: result.messageId,
    body: envelope.html,
  };
}

async function dispatchNotification({
  eventName,
  recipientName,
  recipientRole,
  title,
  message,
  channelOrder,
  metadata,
  maxAttempts = 3,
  dedupeKey,
  dedupeTtlMs,
  forceFailure,
}) {
  if (shouldSkipDuplicate(dedupeKey, dedupeTtlMs)) {
    return { status: 'duplicate', correlationId: dedupeKey, delivered: false };
  }

  const correlationId = dedupeKey || safeId();
  const order = getChannelOrder(recipientRole, channelOrder);
  const baseStatus = { eventName, correlationId, recipientName, recipientRole, title, message, metadata };
  let delivered = false;
  let finalChannel = null;
  const channelsTried = [];

  for (const channel of order) {
    let attempts = 0;
    while (attempts < maxAttempts && !delivered) {
      attempts += 1;
      try {
        const result = await deliverOnChannel(channel, { recipientName, recipientRole, title, message, eventName, metadata, forceFailure });
        const timestamp = new Date().toISOString();
        const channelUsed = result.channel || channel;
        const status = result.status || 'sent';
        const record = { ...baseStatus, channel: channelUsed, status, attempts, timestamp, messageId: result.messageId };
        logStatus(record);
        logNotification({
          recipientName,
          recipientRole,
          channel: channelUsed,
          title,
          message: result.body || message,
          timestamp,
          status,
          eventName,
          correlationId,
          messageId: result.messageId,
          applicationId: metadata?.applicationId,
          userId: metadata?.userId || metadata?.actorId,
          recipientId: metadata?.recipientId,
        });
        delivered = true;
        finalChannel = channelUsed;
      } catch (err) {
        const timestamp = new Date().toISOString();
        channelsTried.push(channel);
        logStatus({ ...baseStatus, channel, status: 'failed', attempts, error: err?.message, timestamp });
      }
    }
    if (delivered) break;
  }

  if (!delivered) {
    const timestamp = new Date().toISOString();
    logStatus({ ...baseStatus, channel: order[order.length - 1], status: 'exhausted', attempts: maxAttempts, timestamp });
    logNotification({
      recipientName,
      recipientRole,
      channel: order[order.length - 1],
      title,
      message,
      timestamp,
      status: 'exhausted',
      eventName,
      correlationId,
      messageId: null,
      applicationId: metadata?.applicationId,
      userId: metadata?.userId || metadata?.actorId,
      recipientId: metadata?.recipientId,
    });
    if (isCritical(eventName, metadata)) {
      const reason = 'All channels exhausted';
      publishEvent('admin.notificationFailure', {
        failedEvent: eventName,
        channelsTried: channelsTried.join(',') || order.join(','),
        correlationId,
        reason,
      }, { dedupeKey: `esc-${correlationId}`, maxAttempts: 1, metadata: { noEscalate: true } });
    }
  }

  return { correlationId, delivered, channel: finalChannel };
}

function publishEvent(eventName, payload = {}, options = {}) {
  const builder = eventCatalog[eventName];
  if (!builder) {
    throw new Error(`Unknown notification event: ${eventName}`);
  }
  const event = builder(payload);
  return dispatchNotification({
    ...event,
    eventName,
    channelOrder: options.channels || event.channelOrder,
    metadata: { ...payload, ...options.metadata },
    maxAttempts: options.maxAttempts ?? 3,
    dedupeKey: options.dedupeKey,
    dedupeTtlMs: options.dedupeTtlMs,
    forceFailure: options.forceFailure,
  });
}

// Legacy channel-specific helpers retained for compatibility
function sendStudentNotification({ recipientName, channel, title, message }) {
  return dispatchNotification({ eventName: 'custom.student', recipientName, recipientRole: 'Student', title, message, channelOrder: [channel] });
}

function sendSRCNotification({ recipientName, channel, title, message }) {
  return dispatchNotification({ eventName: 'custom.src', recipientName, recipientRole: 'SRC', title, message, channelOrder: [channel] });
}

function sendAdminNotification({ recipientName, channel, title, message }) {
  return dispatchNotification({ eventName: 'custom.admin', recipientName, recipientRole: 'Admin', title, message, channelOrder: [channel] });
}

function sendDeliveryNotification({ recipientName, channel, title, message }) {
  return dispatchNotification({ eventName: 'custom.delivery', recipientName, recipientRole: 'Delivery', title, message, channelOrder: [channel] });
}

function getStoredNotifications() {
  return readStore(NOTIFICATION_STORAGE_KEY, []);
}

function getStatusLog() {
  return readStore(STATUS_STORAGE_KEY, []);
}

const NotificationService = {
  publishEvent,
  getStoredNotifications,
  getStatusLog,
  updatePreferences,
  getPreferences: () => ({ ...cachedPreferences }),
  sendStudentNotification,
  sendSRCNotification,
  sendAdminNotification,
  sendDeliveryNotification,
};

export default NotificationService;
