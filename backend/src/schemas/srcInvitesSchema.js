/**
 * SRC Invites Schema
 * 
 * Manages SRC officer onboarding invitations
 * Features:
 * - Time-limited invitation links
 * - Partner agreement acceptance
 * - University association
 * - Secure token generation
 * 
 * CREATED: February 8, 2026
 */

import { pgTable, varchar, uuid, timestamp, boolean } from 'drizzle-orm/pg-core';
import { universities } from './universitiesSchema.js';
import { users } from '../db/schema/users.js';

/**
 * SRC Invites Table
 * 
 * Stores pending SRC officer invitations
 * Once accepted, user account is created and row marked as accepted
 */
export const srcInvites = pgTable('src_invites', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // University Association
  universityId: uuid('university_id').notNull().references(() => universities.id),

  // Invitee Information
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),

  // Invitation Token & Security
  inviteToken: varchar('invite_token', { length: 255 }).notNull().unique(),
  tokenExpiry: timestamp('token_expiry').notNull(),
  isExpired: boolean('is_expired').notNull().default(false),

  // Agreement Acceptance
  agreementAccepted: boolean('agreement_accepted').notNull().default(false),
  agreementAcceptedAt: timestamp('agreement_accepted_at'),

  // Account Creation Status
  accountCreated: boolean('account_created').notNull().default(false),
  createdUserId: uuid('created_user_id').references(() => users.id),

  // Admin Info
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * SRC Invites Indexes
 * For query performance
 */
srcInvites.indexes = {
  tokenIdx: 'CREATE INDEX IF NOT EXISTS src_invites_token_idx ON src_invites(invite_token)',
  emailIdx: 'CREATE INDEX IF NOT EXISTS src_invites_email_idx ON src_invites(email)',
  universityIdx: 'CREATE INDEX IF NOT EXISTS src_invites_university_idx ON src_invites(university_id)',
  expiryIdx: 'CREATE INDEX IF NOT EXISTS src_invites_expiry_idx ON src_invites(token_expiry)',
  statusIdx: 'CREATE INDEX IF NOT EXISTS src_invites_status_idx ON src_invites(agreement_accepted, account_created)',
};

/**
 * SQL Migration Script
 * 
 * Run this to create the table in PostgreSQL:
 */
export const createSrcInvitesTableSQL = `
  CREATE TABLE IF NOT EXISTS src_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    invite_token VARCHAR(255) NOT NULL UNIQUE,
    token_expiry TIMESTAMP NOT NULL,
    is_expired BOOLEAN NOT NULL DEFAULT false,
    agreement_accepted BOOLEAN NOT NULL DEFAULT false,
    agreement_accepted_at TIMESTAMP,
    account_created BOOLEAN NOT NULL DEFAULT false,
    created_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS src_invites_token_idx ON src_invites(invite_token);
  CREATE INDEX IF NOT EXISTS src_invites_email_idx ON src_invites(email);
  CREATE INDEX IF NOT EXISTS src_invites_university_idx ON src_invites(university_id);
  CREATE INDEX IF NOT EXISTS src_invites_token_expiry_idx ON src_invites(token_expiry);
  CREATE INDEX IF NOT EXISTS src_invites_status_idx ON src_invites(agreement_accepted, account_created);
`;

/**
 * Field Descriptions:
 * 
 * id (UUID):
 *   - Primary key, auto-generated UUID
 *   - Unique identifier for this invitation
 * 
 * university_id (UUID):
 *   - Foreign key to universities table
 *   - Identifies which university this SRC officer manages
 *   - Required: Must be a valid university
 *   - Cascade delete: Remove invite if university deleted
 * 
 * first_name (VARCHAR 255):
 *   - SRC officer's first name
 *   - Required
 * 
 * last_name (VARCHAR 255):
 *   - SRC officer's last name
 *   - Required
 * 
 * email (VARCHAR 255):
 *   - SRC officer's email address
 *   - Required
 *   - Unique: No two invites for same email
 *   - Used for: Sending invite link, future login
 * 
 * phone (VARCHAR 20):
 *   - SRC officer's contact phone
 *   - Optional
 * 
 * invite_token (VARCHAR 255):
 *   - Secure random token for invitation link
 *   - Generated: crypto.randomBytes(32).toString('hex')
 *   - Unique: No two invites have same token
 *   - Used in: /src/accept/:token endpoint
 *   - Format: 64-character hex string
 * 
 * token_expiry (TIMESTAMP):
 *   - When the invitation expires
 *   - Required
 *   - Default: 7 days from creation
 *   - Example: 2026-02-15 10:30:00 (7 days from now)
 * 
 * is_expired (BOOLEAN):
 *   - Flag for soft expiry (easy filtering)
 *   - Default: false
 *   - Set to true: When token_expiry passes
 *   - Check before allowing acceptance
 * 
 * agreement_accepted (BOOLEAN):
 *   - Whether SRC accepted partnership agreement
 *   - Default: false
 *   - Set to true: When SRC clicks "I Accept" button
 *   - Required before account creation
 * 
 * agreement_accepted_at (TIMESTAMP):
 *   - When SRC accepted the agreement
 *   - Null until acceptance
 *   - Audit trail for compliance
 * 
 * account_created (BOOLEAN):
 *   - Whether SRC account has been created
 *   - Default: false
 *   - Set to true: After agreement acceptance + account setup
 *   - Prevents duplicate account creation
 * 
 * created_user_id (UUID):
 *   - Foreign key to users table (SRC user created)
 *   - Null until account_created = true
 *   - Links SRC invite to actual user account
 *   - Set null on user delete: cascade
 * 
 * invited_by (UUID):
 *   - Foreign key to users table (admin who created invite)
 *   - Required
 *   - Restrict delete: Can't delete admin while invites exist
 *   - Audit trail: Who invited this SRC
 * 
 * created_at (TIMESTAMP):
 *   - When invitation was created
 *   - Auto-set to current timestamp
 *   - Used for: Sorting, audit trails
 * 
 * updated_at (TIMESTAMP):
 *   - When invitation was last updated
 *   - Auto-set on creation and updates
 *   - Updated when: Agreement accepted, account created
 * 
 * 
 * WORKFLOWS:
 * 
 * 1. CREATION (Admin Action):
 *    INSERT INTO src_invites (
 *      university_id = <university>,
 *      first_name = 'John',
 *      last_name = 'Doe',
 *      email = 'john@example.com',
 *      invite_token = crypto_random_token(),
 *      token_expiry = NOW() + INTERVAL '7 days',
 *      invited_by = <admin_id>
 *    )
 *    → Send email with: http://example.com/src/accept/{invite_token}
 * 
 * 2. AGREEMENT ACCEPTANCE (SRC Action):
 *    UPDATE src_invites
 *    SET agreement_accepted = true,
 *        agreement_accepted_at = NOW()
 *    WHERE invite_token = <token>
 *      AND token_expiry > NOW()
 *      AND is_expired = false
 *      AND account_created = false
 * 
 * 3. ACCOUNT CREATION (Backend Action):
 *    BEGIN TRANSACTION
 *    1. INSERT INTO users (email, role='SRC', ...)
 *    2. UPDATE src_invites
 *       SET account_created = true,
 *           created_user_id = <new_user_id>
 *    COMMIT TRANSACTION
 * 
 * 4. RESEND INVITATION (Admin Action):
 *    UPDATE src_invites
 *    SET invite_token = crypto_random_token(),
 *        token_expiry = NOW() + INTERVAL '7 days'
 *    WHERE id = <invite_id>
 *    → Send email again with new token
 * 
 * 5. CANCEL INVITATION (Admin Action):
 *    UPDATE src_invites
 *    SET is_expired = true
 *    WHERE id = <invite_id>
 *    → SRC can no longer accept
 * 
 * 
 * QUERIES:
 * 
 * 1. Find invitation by token:
 *    SELECT * FROM src_invites
 *    WHERE invite_token = $1
 *      AND is_expired = false
 *      AND token_expiry > NOW()
 * 
 * 2. Get pending invitations (not yet accepted):
 *    SELECT * FROM src_invites
 *    WHERE agreement_accepted = false
 *      AND token_expiry > NOW()
 *    ORDER BY created_at DESC
 * 
 * 3. Get by university:
 *    SELECT * FROM src_invites
 *    WHERE university_id = $1
 *    ORDER BY created_at DESC
 * 
 * 4. Get expired invitations:
 *    SELECT * FROM src_invites
 *    WHERE token_expiry < NOW()
 *      AND is_expired = false
 *    ORDER BY token_expiry DESC
 * 
 * 5. Get SRC invites awaiting account creation:
 *    SELECT * FROM src_invites
 *    WHERE agreement_accepted = true
 *      AND account_created = false
 *    ORDER BY agreement_accepted_at DESC
 * 
 * 6. Statistics by university:
 *    SELECT university_id,
 *           COUNT(*) as total,
 *           SUM(CASE WHEN agreement_accepted THEN 1 ELSE 0 END) as accepted,
 *           SUM(CASE WHEN account_created THEN 1 ELSE 0 END) as accounts_created
 *    FROM src_invites
 *    GROUP BY university_id
 */
