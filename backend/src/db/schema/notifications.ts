import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  recipientId: uuid('recipient_id'),
  recipientRole: varchar('recipient_role', { length: 50 }),
  eventName: varchar('event_name', { length: 100 }).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }),
  message: text('message').notNull(),
  messageId: varchar('message_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull(),
  correlationId: varchar('correlation_id', { length: 255 }),
  applicationId: uuid('application_id'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  recipientRoleIdx: index('notification_logs_recipient_role_idx').on(table.recipientRole),
  applicationIdIdx: index('notification_logs_application_id_idx').on(table.applicationId),
  eventNameIdx: index('notification_logs_event_name_idx').on(table.eventName),
  channelIdx: index('notification_logs_channel_idx').on(table.channel),
  statusIdx: index('notification_logs_status_idx').on(table.status),
  sentAtIdx: index('notification_logs_sent_at_idx').on(table.sentAt),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: varchar('action', { length: 100 }).notNull(),
  actorId: varchar('actor_id', { length: 255 }).notNull(),
  actorRole: varchar('actor_role', { length: 50 }).notNull(),
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  applicationId: uuid('application_id'),
}, (table) => ({
  actorIdIdx: index('audit_logs_actor_id_idx').on(table.actorId),
  applicationIdIdx: index('audit_logs_application_id_idx').on(table.applicationId),
}));

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
