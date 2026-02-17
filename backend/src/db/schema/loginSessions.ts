import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const loginSessions = pgTable('login_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceName: varchar('device_name', { length: 255 }),
  deviceType: varchar('device_type', { length: 50 }), // mobile, desktop, tablet
  browserName: varchar('browser_name', { length: 100 }),
  browserVersion: varchar('browser_version', { length: 50 }),
  osName: varchar('os_name', { length: 100 }),
  osVersion: varchar('os_version', { length: 50 }),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  location: varchar('location', { length: 255 }), // City, Country
  userAgent: text('user_agent'),
  sessionToken: varchar('session_token', { length: 500 }), // Can link to refresh token
  isActive: varchar('is_active', { length: 10 }).notNull().default('true'),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('login_sessions_user_id_idx').on(table.userId),
  ipAddressIdx: index('login_sessions_ip_address_idx').on(table.ipAddress),
  sessionTokenIdx: index('login_sessions_session_token_idx').on(table.sessionToken),
}));

export type LoginSession = typeof loginSessions.$inferSelect;
export type NewLoginSession = typeof loginSessions.$inferInsert;
