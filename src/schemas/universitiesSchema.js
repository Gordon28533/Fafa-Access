/**
 * University Schema
 * 
 * Database schema for the universities table.
 * This defines the structure for storing university information and managing
 * which universities are accepting student applications.
 * 
 * TABLE: universities
 * 
 * CREATED: February 8, 2024
 */

// Drizzle ORM schema definition
import { pgTable, text, varchar, boolean, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

export const universities = pgTable('universities', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // University Information
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address'),

  // Status (whether accepting applications)
  active: boolean('active').notNull().default(true),

  // System Fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    // Indexes for query performance
    codeIdx: uniqueIndex('universities_code_idx').on(table.code),
    emailIdx: uniqueIndex('universities_email_idx').on(table.email),
    activeIdx: uniqueIndex('universities_active_idx').on(table.active),
    createdAtIdx: uniqueIndex('universities_created_at_idx').on(table.createdAt),
  }
});

/**
 * SQL Migration Script
 * 
 * Run this if creating table manually in PostgreSQL:
 */

export const createUniversitiesTableSQL = `
  CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS universities_code_idx ON universities(code);
  CREATE INDEX IF NOT EXISTS universities_email_idx ON universities(email);
  CREATE INDEX IF NOT EXISTS universities_active_idx ON universities(active);
  CREATE INDEX IF NOT EXISTS universities_created_at_idx ON universities(created_at);

  -- Sample data
  INSERT INTO universities (name, code, email, phone, address, active)
  VALUES
    ('University of Lagos', 'UNILAG', 'info@unilag.edu.ng', '234-1-222-2222', '123 Akoka Road, Yaba, Lagos', true),
    ('Covenant University', 'COVENANTUNIV', 'contact@covenantuniversity.edu.ng', '234-7-012-345-678', 'Ota, Ogun State', true),
    ('University of Ibadan', 'UI', 'info@ui.edu.ng', '234-2-751-3000', 'Ibadan, Oyo State', true),
    ('Obafemi Awolowo University', 'OAU', 'info@oauife.edu.ng', '234-3-620-5100', 'Ile-Ife, Osun State', true),
    ('Ahmadu Bello University', 'ABU', 'info@abu.edu.ng', '234-6-169-000', 'Zaria, Kaduna State', true)
  ON CONFLICT (code) DO NOTHING;
`;

/**
 * Field Descriptions:
 * 
 * id (UUID):
 *   - Primary key, auto-generated UUID
 *   - Unique identifier for each university
 *   - Example: '550e8400-e29b-41d4-a716-446655440000'
 * 
 * name (VARCHAR 255):
 *   - Full name of the university
 *   - Required field
 *   - Examples: 'University of Lagos', 'Covenant University'
 * 
 * code (VARCHAR 50):
 *   - Unique code/abbreviation for the university
 *   - Required field
 *   - Unique constraint (no duplicates)
 *   - Used for quick lookup and student displays
 *   - Examples: 'UNILAG', 'COVENANTUNIV', 'UI'
 * 
 * email (VARCHAR 255):
 *   - Contact email for the university
 *   - Required field
 *   - Unique constraint (no duplicates)
 *   - Used for notifications and communication
 *   - Example: 'info@unilag.edu.ng'
 * 
 * phone (VARCHAR 20):
 *   - Contact phone number
 *   - Required field
 *   - Format: International format recommended
 *   - Example: '234-1-222-2222'
 * 
 * address (TEXT):
 *   - Physical address of the university
 *   - Optional field (can be NULL)
 *   - Example: '123 Akoka Road, Yaba, Lagos'
 * 
 * active (BOOLEAN):
 *   - Whether university is accepting applications
 *   - Default: true (accepting applications)
 *   - false = not accepting new applications
 *   - Critical for application eligibility
 * 
 * created_at (TIMESTAMP):
 *   - Timestamp when university record was created
 *   - Auto-set to current timestamp
 *   - Used for audit trails
 * 
 * updated_at (TIMESTAMP):
 *   - Timestamp when university record was last updated
 *   - Auto-set to current timestamp
 *   - Used for tracking changes
 * 
 * 
 * UNIQUE CONSTRAINTS:
 * - code: Must be unique across all universities
 * - email: Must be unique across all universities
 * 
 * These prevent duplicate university records.
 * 
 * 
 * INDEXES:
 * - universities_code_idx: Fastest lookup by university code
 * - universities_email_idx: Fastest lookup by email
 * - universities_active_idx: Faster filtering by active status
 * - universities_created_at_idx: Better performance for date-based queries
 * 
 * These improve query performance for common operations.
 * 
 * 
 * RELATIONSHIPS:
 * - applications.university_id → universities.id
 *   (Optional - if you want to track which university each application is for)
 * 
 * 
 * USAGE PATTERNS:
 * 
 * 1. Get all active universities (for student application):
 *    SELECT * FROM universities WHERE active = true
 * 
 * 2. Get specific university:
 *    SELECT * FROM universities WHERE id = $1
 * 
 * 3. Deactivate university (stop accepting applications):
 *    UPDATE universities SET active = false WHERE id = $1
 * 
 * 4. Get university by code:
 *    SELECT * FROM universities WHERE code = $1
 * 
 * 5. Get university statistics:
 *    SELECT count(*) as total,
 *           sum(CASE WHEN active = true THEN 1 ELSE 0 END) as active,
 *           sum(CASE WHEN active = false THEN 1 ELSE 0 END) as inactive
 *    FROM universities
 * 
 * 6. Check if specific university is accepting:
 *    SELECT active FROM universities WHERE id = $1
 */
