import { pgTable, uuid, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Notification Preferences Table
 * 
 * Stores user notification preferences for different notification types
 * and channels (email, in-app).
 * 
 * Each user has one record with all notification preference flags.
 */
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Application Status Updates
  applicationStatusEmailEnabled: boolean('application_status_email_enabled').notNull().default(true),
  applicationStatusInAppEnabled: boolean('application_status_in_app_enabled').notNull().default(true),
  
  // Approval Notifications
  approvalEmailEnabled: boolean('approval_email_enabled').notNull().default(true),
  approvalInAppEnabled: boolean('approval_in_app_enabled').notNull().default(true),
  
  // Delivery Updates
  deliveryEmailEnabled: boolean('delivery_email_enabled').notNull().default(true),
  deliveryInAppEnabled: boolean('delivery_in_app_enabled').notNull().default(true),
  
  // Payment Reminders
  paymentEmailEnabled: boolean('payment_email_enabled').notNull().default(true),
  paymentInAppEnabled: boolean('payment_in_app_enabled').notNull().default(true),
  
  // Marketing/General (optional)
  marketingEmailEnabled: boolean('marketing_email_enabled').notNull().default(false),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('notification_preferences_user_id_idx').on(table.userId),
}));

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
