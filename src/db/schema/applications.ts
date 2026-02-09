import { pgTable, uuid, varchar, text, real, boolean, timestamp, pgEnum, index, integer } from 'drizzle-orm/pg-core';
import { studentProfiles } from './universities';

export const applicationStatusEnum = pgEnum('application_status', [
  'PENDING_SRC',
  'SRC_APPROVED',
  'SRC_REJECTED',
  'ADMIN_APPROVED',
  'ADMIN_REJECTED',
  'DELIVERY_ASSIGNED',
  'DELIVERED',
  'COMPLETED',
]);

export const verificationStatusEnum = pgEnum('verification_status', [
  'PENDING',
  'VERIFIED',
  'FLAGGED',
  'ESCALATED',
  'REJECTED',
]);

export const laptops = pgTable('laptops', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  processor: varchar('processor', { length: 100 }),
  ram: varchar('ram', { length: 50 }),
  storage: varchar('storage', { length: 50 }),
  screen: varchar('screen', { length: 50 }),
  serialNumber: varchar('serial_number', { length: 100 }).notNull().unique(),
  // Pricing in GHS (Ghana Cedis)
  originalPrice: real('original_price').notNull(),
  discountedPrice: real('discounted_price').notNull(),
  // Inventory management
  stockQuantity: integer('stock_quantity').notNull().default(0),
  // Image URL (to Azure Blob or S3)
  imageUrl: varchar('image_url', { length: 500 }),
  // Status
  isActive: boolean('is_active').notNull().default(true), // Soft delete
  universityId: uuid('university_id'), // Optional: can be university-specific
  assigned: boolean('assigned').notNull().default(false), // Legacy field
  price: real('price').notNull(), // Legacy field - kept for backward compatibility
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => studentProfiles.id, { onDelete: 'cascade' }),
  laptopId: uuid('laptop_id').references(() => laptops.id, { onDelete: 'set null' }),
  status: applicationStatusEnum('status').notNull().default('PENDING_SRC'),
  reference: varchar('reference', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  level: varchar('level', { length: 20 }).notNull(),
  course: varchar('course', { length: 255 }).notNull(),
  address: text('address').notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  studentIdDoc: varchar('student_id_doc', { length: 255 }),
  admissionLetterRef: varchar('admission_letter_ref', { length: 255 }),
  ghanaCardRef: varchar('ghana_card_ref', { length: 255 }).notNull(),
  totalPrice: real('total_price').notNull().default(0.0),
  commissionEarned: real('commission_earned').notNull().default(0.0),
  commissionPaid: boolean('commission_paid').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  studentIdIdx: index('applications_student_id_idx').on(table.studentId),
  statusIdx: index('applications_status_idx').on(table.status),
  referenceIdx: index('applications_reference_idx').on(table.reference),
  ghanaCardIdx: index('applications_ghana_card_idx').on(table.ghanaCardRef),
  phoneIdx: index('applications_phone_idx').on(table.phoneNumber),
}));

export const verificationStatuses = pgTable('verification_statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }).unique(),
  ghanaCardNumber: varchar('ghana_card_number', { length: 50 }).notNull(),
  frontImageHash: varchar('front_image_hash', { length: 255 }).notNull(),
  backImageHash: varchar('back_image_hash', { length: 255 }).notNull(),
  selfieHash: varchar('selfie_hash', { length: 255 }).notNull(),
  status: verificationStatusEnum('status').notNull().default('PENDING'),
  flaggedFraud: boolean('flagged_fraud').notNull().default(false),
  fraudReason: text('fraud_reason'),
  reviewedBy: varchar('reviewed_by', { length: 255 }),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const applicationStatusHistory = pgTable('application_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(),
  changedBy: varchar('changed_by', { length: 255 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  applicationIdIdx: index('status_history_application_id_idx').on(table.applicationId),
  statusIdx: index('status_history_status_idx').on(table.status),
}));

export type Laptop = typeof laptops.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type VerificationStatus = typeof verificationStatuses.$inferSelect;
export type ApplicationStatusHistory = typeof applicationStatusHistory.$inferSelect;
