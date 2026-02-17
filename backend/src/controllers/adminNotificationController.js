// adminNotificationController.js
// Admin oversight APIs for notification logs, resend, and delivery metrics

import prisma from '../utils/prismaClient.js';
import NotificationService from '../services/NotificationService.js';
import { apiResponse } from '../utils/apiResponse.js';

// GET /admin/notifications/logs?limit=50&cursor=...&status=failed&event=student.deliveryAssigned
export async function listNotificationLogs(req, res) {
  const {
    limit = 50,
    cursor,
    status,
    event,
    channel,
    recipientRole,
    applicationId,
  } = req.query;

  const take = Math.min(Number(limit) || 50, 200);
  const where = {};
  if (status) where.status = status;
  if (event) where.eventName = event;
  if (channel) where.channel = channel;
  if (recipientRole) where.recipientRole = recipientRole;
  if (applicationId) where.applicationId = applicationId;

  try {
    const logs = await prisma.notificationLog.findMany({
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where,
      orderBy: { createdAt: 'desc' },
    });
    const nextCursor = logs.length === take ? logs[logs.length - 1].id : null;
    return res.json(apiResponse({ success: true, data: { logs, nextCursor } }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: 'Failed to fetch logs', errors: [err.message] }));
  }
}

// POST /admin/notifications/resend
// Body: { logId, channelOverride?, metadataOverrides? }
export async function resendNotification(req, res) {
  const { logId, channelOverride, metadataOverrides = {} } = req.body || {};
  if (!logId) return res.status(400).json(apiResponse({ success: false, message: 'logId is required' }));

  try {
    const log = await prisma.notificationLog.findUnique({ where: { id: logId } });
    if (!log) return res.status(404).json(apiResponse({ success: false, message: 'Log not found' }));

    const channels = channelOverride ? [channelOverride] : undefined;
    const result = await NotificationService.publishEvent(log.eventName, {
      recipientName: log.recipientName || 'Recipient',
      recipientRole: log.recipientRole,
      applicationId: log.applicationId,
      recipientId: log.recipientId,
      userId: req.user?.userId,
      ...metadataOverrides,
    }, { channels, metadata: { ...metadataOverrides } });

    return res.json(apiResponse({ success: true, data: { correlationId: result.correlationId, channel: result.channel } }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: 'Resend failed', errors: [err.message] }));
  }
}

// GET /admin/notifications/metrics
export async function notificationMetrics(_req, res) {
  try {
    const total = await prisma.notificationLog.count();
    const byStatus = await prisma.notificationLog.groupBy({ by: ['status'], _count: { status: true } });
    const byChannel = await prisma.notificationLog.groupBy({ by: ['channel'], _count: { channel: true } });
    const success = byStatus.find((s) => s.status === 'sent')?._count.status || 0;
    const failed = byStatus.find((s) => s.status === 'failed')?._count.status || 0;
    const exhausted = byStatus.find((s) => s.status === 'exhausted')?._count.status || 0;
    const successRate = total ? Math.round((success / total) * 1000) / 10 : 0;

    return res.json(apiResponse({
      success: true,
      data: {
        total,
        success,
        failed,
        exhausted,
        successRate, // percentage with 1 decimal
        byStatus,
        byChannel,
      },
    }));
  } catch (err) {
    return res.status(500).json(apiResponse({ success: false, message: 'Failed to compute metrics', errors: [err.message] }));
  }
}

export default {
  listNotificationLogs,
  resendNotification,
  notificationMetrics,
};
