import { pgTable, uuid, real, varchar, timestamp, boolean, text, index, pgEnum } from 'drizzle-orm/pg-core';
import { applications } from './applications';
import { universities, srcOfficers } from './universities';

export const commissionStatusEnum = pgEnum('commission_status', [
  'PENDING',
  'EARNED',
  'READY_FOR_PAYOUT',
  'PAID',
  'CANCELLED',
  'DISPUTED',
]);

export const payoutStatusEnum = pgEnum('payout_status', [
  'PENDING',
  'SCHEDULED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const srcCommissionConfigs = pgTable('src_commission_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  universityId: uuid('university_id').notNull().references(() => universities.id).unique(),
  commissionRate: real('commission_rate').notNull().default(0.0),
  isActive: boolean('is_active').notNull().default(true),
  effectiveFrom: timestamp('effective_from').defaultNow().notNull(),
  effectiveTo: timestamp('effective_to'),
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  universityIdIdx: index('commission_configs_university_id_idx').on(table.universityId),
  isActiveIdx: index('commission_configs_is_active_idx').on(table.isActive),
}));

export const srcCommissionRecords = pgTable('src_commission_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id).unique(),
  applicationRef: varchar('application_ref', { length: 50 }).notNull(),
  universityId: uuid('university_id').notNull().references(() => universities.id),
  srcOfficerId: uuid('src_officer_id').references(() => srcOfficers.id),
  laptopPrice: real('laptop_price').notNull(),
  commissionRate: real('commission_rate').notNull(),
  commissionAmount: real('commission_amount').notNull(),
  status: commissionStatusEnum('status').notNull().default('PENDING'),
  earnedAt: timestamp('earned_at'),
  readyAt: timestamp('ready_at'),
  paidAt: timestamp('paid_at'),
  payoutReference: varchar('payout_reference', { length: 255 }),
  payoutChannel: varchar('payout_channel', { length: 50 }),
  paidBatchId: varchar('paid_batch_id', { length: 255 }),
  payoutId: uuid('payout_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdIdx: index('commission_records_application_id_idx').on(table.applicationId),
  applicationRefIdx: index('commission_records_application_ref_idx').on(table.applicationRef),
  universityIdIdx: index('commission_records_university_id_idx').on(table.universityId),
  srcOfficerIdIdx: index('commission_records_src_officer_id_idx').on(table.srcOfficerId),
  statusIdx: index('commission_records_status_idx').on(table.status),
  payoutIdIdx: index('commission_records_payout_id_idx').on(table.payoutId),
}));

export const srcPayouts = pgTable('src_payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  universityId: uuid('university_id').notNull().references(() => universities.id),
  payoutRef: varchar('payout_ref', { length: 50 }).notNull().unique(),
  totalAmount: real('total_amount').notNull(),
  commissionCount: real('commission_count').notNull(),
  paymentMethod: varchar('payment_method', { length: 100 }),
  paymentReference: varchar('payment_reference', { length: 255 }),
  status: payoutStatusEnum('status').notNull().default('PENDING'),
  scheduledDate: timestamp('scheduled_date'),
  processedDate: timestamp('processed_date'),
  processedBy: varchar('processed_by', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  universityIdIdx: index('payouts_university_id_idx').on(table.universityId),
  payoutRefIdx: index('payouts_payout_ref_idx').on(table.payoutRef),
  statusIdx: index('payouts_status_idx').on(table.status),
  scheduledDateIdx: index('payouts_scheduled_date_idx').on(table.scheduledDate),
}));

export type SrcCommissionConfig = typeof srcCommissionConfigs.$inferSelect;
export type SrcCommissionRecord = typeof srcCommissionRecords.$inferSelect;
export type NewSrcCommissionRecord = typeof srcCommissionRecords.$inferInsert;
export type SrcPayout = typeof srcPayouts.$inferSelect;
export type NewSrcPayout = typeof srcPayouts.$inferInsert;
