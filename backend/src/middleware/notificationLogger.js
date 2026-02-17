// notificationLogger.js
// Immutable notification logging for dispute resolution

import prisma from '../utils/prismaClient.js';

export async function logNotificationRecord({
  userId,
  recipientId,
  recipientRole,
  eventName,
  channel,
  title,
  message,
  status,
  messageId,
  correlationId,
  applicationId,
  sentAt,
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        userId: userId || null,
        recipientId: recipientId || null,
        recipientRole: recipientRole || null,
        eventName,
        channel,
        title: title || null,
        message: message || '',
        status,
        messageId: messageId || null,
        correlationId: correlationId || null,
        applicationId: applicationId || null,
        sentAt: sentAt ? new Date(sentAt) : undefined,
      },
    });
  } catch (err) {
    // Do not throw: logging must not break delivery paths
    console.warn('[notificationLogger] failed to persist notification log', err?.message || err);
  }
}

export default logNotificationRecord;
