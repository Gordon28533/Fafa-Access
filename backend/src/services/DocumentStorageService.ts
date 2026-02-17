/**
 * Document Storage Service
 * Handles secure storage and retrieval of sensitive documents
 * - Ghana Card (front/back)
 * - Student selfie
 * - Admission letters
 */

import crypto from 'crypto';
import { BlobServiceClient } from '@azure/storage-blob';
import { db } from '../db/connection.ts';
import { sql } from 'drizzle-orm';

// Enable storage only when connection string is provided
const storageEnabled = !!process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = storageEnabled
  ? BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING || '')
  : null;

const containerClient = storageEnabled
  ? blobServiceClient!.getContainerClient(process.env.AZURE_STORAGE_CONTAINER || 'secure-documents')
  : null;

class DocumentStorageService {
  private getPlaceholderUrl(documentType: string) {
    const label = encodeURIComponent(documentType || 'DOCUMENT');
    return `https://placehold.co/720x480?text=${label}`;
  }
  /**
   * Upload a document with encryption and audit logging
   * @param {Object} params
   * @param {string} params.userId - User ID uploading document
   * @param {string} params.applicationId - Related application ID
   * @param {string} params.documentType - Type: GHANA_CARD_FRONT, GHANA_CARD_BACK, STUDENT_SELFIE, ADMISSION_LETTER
   * @param {Buffer} params.fileBuffer - File data
   * @param {string} params.mimeType - MIME type
   * @returns {Promise<{docId, url, hash, expiresAt}>}
   */
  async uploadDocument({ userId, applicationId, documentType, fileBuffer, mimeType }: { userId: string; applicationId: string; documentType: string; fileBuffer: Buffer; mimeType: string }) {
    try {
      if (!storageEnabled) {
        throw new Error('Document storage is not configured');
      }

      // Validate document type
      const validTypes = [
        'GHANA_CARD_FRONT',
        'GHANA_CARD_BACK',
        'STUDENT_SELFIE',
        'ADMISSION_LETTER'
      ];
      if (!validTypes.includes(documentType)) {
        throw new Error(`Invalid document type: ${documentType}`);
      }

      // Validate file size (5MB max)
      if (fileBuffer.length > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Generate secure document ID
      const docId = `${applicationId}/${documentType}/${crypto.randomBytes(8).toString('hex')}`;
      
      // Calculate file hash for integrity checking
      const fileHash = crypto
        .createHash('sha256')
        .update(fileBuffer)
        .digest('hex');

      // Upload to Azure Blob Storage with encryption
      const blockBlobClient = containerClient!.getBlockBlobClient(docId);
      
      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        metadata: {
          userId,
          applicationId,
          documentType,
          uploadedAt: new Date().toISOString(),
          fileHash,
          mimeType
        },
        blobHTTPHeaders: {
          blobContentType: mimeType,
          blobCacheControl: 'no-cache, no-store, must-revalidate'
        }
      });

      // Log document upload to audit trail
      await this.logAuditEvent({
        userId,
        applicationId,
        action: 'DOCUMENT_UPLOADED',
        documentId: docId,
        documentType,
        fileHash,
        mimeType
      });

      // Generate expiring URL valid for 15 minutes
      await this.generateExpiringUrl(docId);

      // Store document reference in database
      await db.execute(sql`
        INSERT INTO document_references (
          id, application_id, document_type, storage_id, file_hash, mime_type, uploaded_at
        ) VALUES (
          ${crypto.randomUUID()},
          ${applicationId},
          ${documentType},
          ${docId},
          ${fileHash},
          ${mimeType},
          NOW()
        )
      `);

      return {
        docId,
        storageId: docId,
        fileHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL that expires in 15 minutes
   * @param {string} docId - Document ID
   * @param {number} expirationMinutes - URL expiration time (default 15)
   * @returns {Promise<string>} Pre-signed URL
   */
  async generateExpiringUrl(docId: string, expirationMinutes: number = 15): Promise<string> {
    try {
      if (!storageEnabled) {
        const parts = docId.split('/') || [];
        const type = parts[1] || 'DOCUMENT';
        return this.getPlaceholderUrl(type);
      }

      const blockBlobClient = containerClient!.getBlockBlobClient(docId);
      
      const { BlobSASPermissions } = await import('@azure/storage-blob');
      const sasUrl = await blockBlobClient.generateSasUrl({
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expirationMinutes * 60 * 1000),
        permissions: BlobSASPermissions.parse('r'),
        // Cast to any to satisfy Azure SDK typing without changing runtime value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        protocol: 'https' as unknown as any
      });

      return sasUrl;
    } catch (error) {
      console.error('Error generating expiring URL:', error);
      throw error;
    }
  }

  /**
   * Retrieve a document with access control and audit logging
   * @param {Object} params
   * @param {string} params.userId - User requesting document
   * @param {string} params.applicationId - Application ID
   * @param {string} params.documentId - Document ID
   * @param {string} params.userRole - User role (ADMIN, STUDENT, SRC)
   * @returns {Promise<{url, expiresAt}>}
   */
  async getDocumentUrl({ userId, applicationId, documentId, userRole }: { userId: string; applicationId: string; documentId: string; userRole: string }): Promise<{ url: string; expiresAt: string }> {
    try {
      // Check access permissions
      const hasAccess = await this.checkDocumentAccess({
        userId,
        applicationId,
        userRole
      });

      if (!hasAccess) {
        throw new Error('Unauthorized: No access to this document');
      }

      // Log access attempt
      await this.logAuditEvent({
        userId,
        applicationId,
        action: 'DOCUMENT_ACCESSED',
        documentId,
        userRole
      });

      // Generate expiring URL (15 minutes)
      const expiringUrl = await this.generateExpiringUrl(documentId);

      return {
        url: expiringUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error retrieving document:', error);
      
      // Log failed access attempt
      await this.logAuditEvent({
        userId,
        applicationId,
        action: 'DOCUMENT_ACCESS_DENIED',
        documentId,
        userRole,
        error: (error as Error).message
      });

      throw error;
    }
  }

  /**
   * Check if user has permission to access document
   * @param {Object} params
   * @param {string} params.userId - User ID
   * @param {string} params.applicationId - Application ID
   * @param {string} params.userRole - User role
   * @returns {Promise<boolean>}
   */
  async checkDocumentAccess({ userId, applicationId, userRole }: { userId: string; applicationId: string; userRole: string }): Promise<boolean> {
    try {
      // ADMIN: Can access all documents
      if (userRole === 'ADMIN') {
        return true;
      }

      // STUDENT: Can only access their own application documents
      if (userRole === 'STUDENT') {
        const result = await db.execute(sql`
          SELECT id FROM applications
          WHERE id = ${applicationId}
          AND student_id IN (
            SELECT id FROM student_profiles WHERE user_id = ${userId}
          )
        `);
        return result.rows.length > 0;
      }

      // SRC: Can access applications from their university
      if (userRole === 'SRC') {
        const result = await db.execute(sql`
          SELECT a.id FROM applications a
          WHERE a.id = ${applicationId}
          AND a.student_id IN (
            SELECT sp.id FROM student_profiles sp
            WHERE sp.university_id IN (
              SELECT university_id FROM src_officers
              WHERE user_id = ${userId}
            )
          )
        `);
        return result.rows.length > 0;
      }

      // DELIVERY: Cannot access documents
      return false;
    } catch (error) {
      console.error('Error checking document access:', error);
      return false;
    }
  }

  /**
   * List documents for an application (used for admin review)
   */
  async listDocuments({ applicationId }: { applicationId: string }): Promise<Array<{ documentId: string; documentType: string; mimeType: string; uploadedAt: unknown; url?: string }>> {
    const result = await db.execute(sql`
      SELECT id, document_type, storage_id, mime_type, uploaded_at
      FROM document_references
      WHERE application_id = ${applicationId}
      ORDER BY uploaded_at DESC
    `);

    const documents = await Promise.all(result.rows.map(async (row) => {
      let url: string | undefined;
      try {
        url = await this.generateExpiringUrl(String(row.storage_id));
      } catch {
        url = undefined;
      }
      return {
        documentId: String(row.storage_id),
        documentType: String(row.document_type),
        mimeType: String(row.mime_type),
        uploadedAt: row.uploaded_at,
        url,
      };
    }));

    return documents;
  }

  /**
   * Log document access to audit trail
   * @param {Object} auditData - Audit log data
   */
  async logAuditEvent(auditData: Record<string, unknown>): Promise<void> {
    try {
      const {
        userId,
        applicationId,
        action,
        documentId,
        documentType,
        userRole,
        fileHash,
        mimeType,
        error
      } = auditData;

      await db.execute(sql`
        INSERT INTO document_audit_logs (
          id, user_id, application_id, action, document_id, document_type,
          user_role, file_hash, mime_type, error, timestamp
        ) VALUES (
          ${crypto.randomUUID()},
          ${userId},
          ${applicationId},
          ${action},
          ${documentId || null},
          ${documentType || null},
          ${userRole || null},
          ${fileHash || null},
          ${mimeType || null},
          ${error || null},
          NOW()
        )
      `);
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  }

  /**
   * Delete document (admin-only, logs deletion)
   * @param {Object} params
   * @param {string} params.userId - Admin user ID
   * @param {string} params.applicationId - Application ID
   * @param {string} params.documentId - Document ID
   * @returns {Promise<boolean>}
   */
  async deleteDocument({ userId, applicationId, documentId }: { userId: string; applicationId: string; documentId: string }): Promise<boolean> {
    try {
      const blockBlobClient = containerClient?.getBlockBlobClient(documentId);
      if (!blockBlobClient) {
        throw new Error('Document storage is not configured');
      }
      await blockBlobClient.delete();

      // Log deletion
      await this.logAuditEvent({
        userId,
        applicationId,
        action: 'DOCUMENT_DELETED',
        documentId,
        userRole: 'ADMIN'
      });

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get audit trail for a document or application
   * @param {Object} params
   * @param {string} params.userId - Requesting user
   * @param {string} params.applicationId - Application ID
   * @param {string} params.userRole - User role (must be ADMIN)
   * @returns {Promise<Array>}
   */
  async getAuditTrail({ applicationId, userRole }: { userId?: string; applicationId: string; userRole: string }): Promise<unknown[]> {
    try {
      if (userRole !== 'ADMIN') {
        throw new Error('Only admins can view audit trails');
      }

      const result = await db.execute(sql`
        SELECT
          id, user_id, action, document_type, user_role,
          error, timestamp
        FROM document_audit_logs
        WHERE application_id = ${applicationId}
        ORDER BY timestamp DESC
        LIMIT 100
      `);

      return result.rows;
    } catch (error) {
      console.error('Error retrieving audit trail:', error);
      throw error;
    }
  }
}

export default new DocumentStorageService();
