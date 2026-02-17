/**
 * Document Storage Schema for Drizzle ORM
 * Tables for secure document management and audit trails
 */

import {
  pgTable,
  text,
  uuid,
  timestamp,
  varchar,
  jsonb,
  index
} from 'drizzle-orm/pg-core';

export const documentReferences = pgTable(
  'document_references',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id').notNull(),
    documentType: varchar('document_type', { length: 50 }).notNull(), // GHANA_CARD_FRONT, GHANA_CARD_BACK, STUDENT_SELFIE, ADMISSION_LETTER
    storageId: text('storage_id').notNull().unique(), // Azure Blob path
    fileHash: varchar('file_hash', { length: 64 }).notNull(), // SHA-256 hash for integrity
    mimeType: varchar('mime_type', { length: 50 }).notNull(), // image/jpeg, application/pdf, etc.
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // Optional: auto-deletion date
    metadata: jsonb('metadata'), // Additional metadata: original filename, size, etc.
  },
  (table) => ({
    applicationIdIndex: index('idx_doc_ref_app_id').on(table.applicationId),
    documentTypeIndex: index('idx_doc_ref_type').on(table.documentType),
    uploadedAtIndex: index('idx_doc_ref_uploaded').on(table.uploadedAt),
    expiresAtIndex: index('idx_doc_ref_expires').on(table.expiresAt),
  })
);

export const documentAuditLogs = pgTable(
  'document_audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(), // Who performed the action
    applicationId: uuid('application_id').notNull(), // Related application
    action: varchar('action', { length: 50 }).notNull(), // DOCUMENT_UPLOADED, DOCUMENT_ACCESSED, DOCUMENT_DELETED, DOCUMENT_ACCESS_DENIED
    documentId: text('document_id'), // Document being accessed/modified
    documentType: varchar('document_type', { length: 50 }), // Document type
    userRole: varchar('user_role', { length: 20 }), // ADMIN, STUDENT, SRC, DELIVERY
    fileHash: varchar('file_hash', { length: 64 }), // File hash for integrity audit
    mimeType: varchar('mime_type', { length: 50 }), // Content type
    ipAddress: varchar('ip_address', { length: 45 }), // IPv4 or IPv6
    userAgent: text('user_agent'), // Browser/client info
    error: text('error'), // Error message if action failed
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIndex: index('idx_audit_user_id').on(table.userId),
    applicationIdIndex: index('idx_audit_app_id').on(table.applicationId),
    actionIndex: index('idx_audit_action').on(table.action),
    documentIdIndex: index('idx_audit_doc_id').on(table.documentId),
    timestampIndex: index('idx_audit_timestamp').on(table.timestamp),
    userRoleIndex: index('idx_audit_user_role').on(table.userRole),
  })
);

export const documentAccessTokens = pgTable(
  'document_access_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: text('document_id').notNull(), // Document reference
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(), // SHA-256 hash of token
    createdBy: uuid('created_by').notNull(), // User who created token
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // Token expiration
    usedAt: timestamp('used_at', { withTimezone: true }), // When token was used
    revokedAt: timestamp('revoked_at', { withTimezone: true }), // If manually revoked
    ipRestriction: varchar('ip_restriction', { length: 45 }), // Optional: limit token to specific IP
  },
  (table) => ({
    documentIdIndex: index('idx_token_doc_id').on(table.documentId),
    expiresAtIndex: index('idx_token_expires').on(table.expiresAt),
    revokedAtIndex: index('idx_token_revoked').on(table.revokedAt),
  })
);

export const documentQuarantines = pgTable(
  'document_quarantines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id').notNull(),
    documentId: text('document_id').notNull(),
    documentType: varchar('document_type', { length: 50 }).notNull(),
    reason: text('reason').notNull(), // Reason for quarantine (virus detected, fraud suspected, etc.)
    severity: varchar('severity', { length: 20 }).notNull(), // CRITICAL, HIGH, MEDIUM, LOW
    quarantinedBy: uuid('quarantined_by').notNull(), // Admin user who quarantined
    quarantinedAt: timestamp('quarantined_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedBy: uuid('resolved_by'), // Admin who resolved
    resolvedAt: timestamp('resolved_at', { withTimezone: true }), // When resolved
    resolution: varchar('resolution', { length: 20 }), // APPROVED, REJECTED, DELETED
    notes: text('notes'), // Admin notes on resolution
  },
  (table) => ({
    applicationIdIndex: index('idx_quarantine_app_id').on(table.applicationId),
    severityIndex: index('idx_quarantine_severity').on(table.severity),
    quarantinedAtIndex: index('idx_quarantine_date').on(table.quarantinedAt),
    resolvedAtIndex: index('idx_quarantine_resolved').on(table.resolvedAt),
  })
);
