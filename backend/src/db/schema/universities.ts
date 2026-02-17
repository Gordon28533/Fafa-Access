import { pgTable, uuid, varchar, real, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const universities = pgTable('universities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  commissionRate: real('commission_rate').notNull().default(0.0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const srcOfficers = pgTable('src_officers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  universityId: uuid('university_id').notNull().references(() => universities.id),
  position: varchar('position', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentProfiles = pgTable('student_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  universityId: uuid('university_id').notNull().references(() => universities.id),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  ghanaCardRef: varchar('ghana_card_ref', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  address: text('address').notNull(),
  level: varchar('level', { length: 50 }),
  course: varchar('course', { length: 255 }),
  profilePhotoUrl: text('profile_photo_url'),
  verificationStatus: varchar('verification_status', { length: 50 }).notNull().default('PENDING'),
  verificationNotes: text('verification_notes'),
  verificationReviewedAt: timestamp('verification_reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentProfileAudits = pgTable('student_profile_audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => studentProfiles.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  field: varchar('field', { length: 100 }),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const universityWallets = pgTable('university_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  universityId: uuid('university_id').notNull().references(() => universities.id).unique(),
  balance: real('balance').notNull().default(0.0),
  totalEarned: real('total_earned').notNull().default(0.0),
  totalPaid: real('total_paid').notNull().default(0.0),
  pendingCommissions: real('pending_commissions').notNull().default(0.0),
  earnedCommissions: real('earned_commissions').notNull().default(0.0),
  lastPayoutDate: timestamp('last_payout_date'),
  lastPayoutAmount: real('last_payout_amount').default(0.0),
  payoutsFrozen: boolean('payouts_frozen').notNull().default(false),
  freezeReason: text('freeze_reason'),
  frozenAt: timestamp('frozen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type University = typeof universities.$inferSelect;
export type NewUniversity = typeof universities.$inferInsert;
export type SrcOfficer = typeof srcOfficers.$inferSelect;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type StudentProfileAudit = typeof studentProfileAudits.$inferSelect;
export type UniversityWallet = typeof universityWallets.$inferSelect;
