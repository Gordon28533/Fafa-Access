import { pgTable, uuid, real, varchar, timestamp, boolean, index, pgEnum, text } from 'drizzle-orm/pg-core';
import { applications } from './applications';

export const paymentTypeEnum = pgEnum('payment_type', ['INITIAL_70', 'FINAL_30']);
export const paymentStatusEnum = pgEnum('payment_status', ['COLLECTED', 'PENDING', 'INITIATED', 'VERIFIED', 'FAILED']);
export const paymentMethodEnum = pgEnum('payment_method', ['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'PAYSTACK']);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  type: paymentTypeEnum('type').notNull(),
  status: paymentStatusEnum('status').notNull(),
  method: paymentMethodEnum('method').default('CASH'),
  // Paystack integration fields
  paystackReference: varchar('paystack_reference', { length: 255 }).unique(),
  paystackAccessCode: varchar('paystack_access_code', { length: 255 }),
  paystackAuthorizationUrl: text('paystack_authorization_url'),
  paystackVerifiedAt: timestamp('paystack_verified_at'),
  // Manual collection fields  
  collectedBy: varchar('collected_by', { length: 255 }),
  collectedAt: timestamp('collected_at'),
  // Metadata
  currency: varchar('currency', { length: 3 }).default('GHS'),
  metadata: text('metadata'), // JSON string for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdIdx: index('payments_application_id_idx').on(table.applicationId),
  typeIdx: index('payments_type_idx').on(table.type),
  paystackRefIdx: index('payments_paystack_ref_idx').on(table.paystackReference),
  statusIdx: index('payments_status_idx').on(table.status),
}));

export const deliveries = pgTable('deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id).unique(),
  staffName: varchar('staff_name', { length: 255 }).notNull(),
  deliveryDate: timestamp('delivery_date').notNull(),
  location: varchar('location', { length: 500 }).notNull(),
  delivered: boolean('delivered').notNull().default(false),
  deliveryPhotoRef: varchar('delivery_photo_ref', { length: 255 }),
  studentSignatureRef: varchar('student_signature_ref', { length: 255 }),
  paymentConfirmed: boolean('payment_confirmed').notNull().default(false),
  confirmedBy: varchar('confirmed_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  applicationIdIdx: index('deliveries_application_id_idx').on(table.applicationId),
  staffNameIdx: index('deliveries_staff_name_idx').on(table.staffName),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Delivery = typeof deliveries.$inferSelect;
export type NewDelivery = typeof deliveries.$inferInsert;
