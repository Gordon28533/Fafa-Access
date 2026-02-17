import { pgEnum, pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const supportIssueTypeEnum = pgEnum('support_issue_type', ['VERIFICATION', 'PAYMENT', 'DELIVERY', 'OTHER']);
export const supportTicketStatusEnum = pgEnum('support_ticket_status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  issueType: supportIssueTypeEnum('issue_type').notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  status: supportTicketStatusEnum('status').notNull().default('OPEN'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('support_tickets_user_id_idx').on(table.userId),
  statusIdx: index('support_tickets_status_idx').on(table.status),
  lastMessageIdx: index('support_tickets_last_message_idx').on(table.lastMessageAt),
}));

export const supportTicketMessages = pgTable('support_ticket_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  senderRole: varchar('sender_role', { length: 20 }).notNull(),
  message: text('message').notNull(),
  attachments: jsonb('attachments').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index('support_ticket_messages_ticket_id_idx').on(table.ticketId),
  senderIdIdx: index('support_ticket_messages_sender_id_idx').on(table.senderId),
}));

export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type NewSupportTicketMessage = typeof supportTicketMessages.$inferInsert;
