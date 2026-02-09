/**
 * Document Upload & Management Routes
 * Secure endpoints for document operations with role-based access
 */

import express from 'express';
import multer from 'multer';
import DocumentStorageService from '../services/DocumentStorageService.ts';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { apiResponse } from '../utils/apiResponse.js';
import { db } from '../db/connection.js';
import { applications } from '../db/schema/applications.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF allowed.'));
    }
  }
});

/**
 * POST /api/documents/upload
 * Upload a document (Ghana Card, selfie, admission letter)
 * Requires: STUDENT role
 */
router.post('/upload', authenticate, requireRole('STUDENT'), upload.single('file'), async (req, res) => {
  try {
    const { applicationId, documentType } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Validate required fields
    if (!applicationId || !documentType) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: 'applicationId and documentType are required',
          data: null,
          errors: ['Missing required fields']
        })
      );
    }

    // Only students can upload documents for their applications
    if (userRole !== 'STUDENT') {
      return res.status(403).json(
        apiResponse({
          success: false,
          message: 'Only students can upload documents',
          data: null,
          errors: ['Unauthorized']
        })
      );
    }

    // Verify student owns this application
    // (Implementation depends on your DB schema)

    if (!req.file) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: 'No file provided',
          data: null,
          errors: ['File is required']
        })
      );
    }

    // Upload document
    const uploadResult = await DocumentStorageService.uploadDocument({
      userId,
      applicationId,
      documentType,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype
    });

    res.json(
      apiResponse({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          docId: uploadResult.docId,
          fileHash: uploadResult.fileHash,
          expiresAt: uploadResult.expiresAt
        }
      })
    );
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json(
      apiResponse({
        success: false,
        message: 'Failed to upload document',
        data: null,
        errors: [error.message]
      })
    );
  }
});

/**
 * GET /api/documents/:applicationId/:documentId
 * Retrieve a document with access control
 * Requires: ADMIN, STUDENT (own app), or SRC (university apps)
 */
router.get('/:applicationId/:documentId', authenticate, async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Get document URL with access control
    const result = await DocumentStorageService.getDocumentUrl({
      userId,
      applicationId,
      documentId,
      userRole
    });

    // Redirect to Azure Blob Storage SAS URL
    res.redirect(result.url);
  } catch (error) {
    console.error('Document retrieval error:', error);
    res.status(403).json(
      apiResponse({
        success: false,
        message: error.message || 'Failed to retrieve document',
        data: null,
        errors: ['Access denied']
      })
    );
  }
});

/**
 * GET /api/documents/audit/:applicationId
 * Get audit trail for document access (ADMIN ONLY)
 */
router.get('/audit/:applicationId', authenticate, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json(
        apiResponse({
          success: false,
          message: 'Only admins can view audit trails',
          data: null,
          errors: ['Unauthorized']
        })
      );
    }

    const auditLog = await DocumentStorageService.getAuditTrail({
      userId,
      applicationId,
      userRole
    });

    res.json(
      apiResponse({
        success: true,
        message: 'Audit trail retrieved',
        data: {
          applicationId,
          events: auditLog,
          totalEvents: auditLog.length
        }
      })
    );
  } catch (error) {
    console.error('Audit trail error:', error);
    res.status(500).json(
      apiResponse({
        success: false,
        message: 'Failed to retrieve audit trail',
        data: null,
        errors: [error.message]
      })
    );
  }
});

/**
 * GET /api/documents/review/:applicationId
 * List documents for admin facial/doc verification
 * Accepts both application UUID and application reference (APP-YYYY-XXXX)
 */
router.get('/review/:applicationId', authenticate, async (req, res) => {
  try {
    let { applicationId } = req.params;
    const userRole = req.user.role;

    console.log(`[documentRoutes] GET /review/${applicationId} by ${userRole}`);

    if (userRole !== 'ADMIN') {
      return res.status(403).json(
        apiResponse({
          success: false,
          message: 'Only admins can review documents',
          data: null,
          errors: ['Unauthorized']
        })
      );
    }

    // Check if applicationId looks like a reference (APP-YYYY-XXXX) rather than a UUID
    // References start with APP- and have the format APP-2024-0001
    if (applicationId.toUpperCase().startsWith('APP-')) {
      // It's a reference - resolve it to an ID
      const app = await db
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.reference, applicationId))
        .limit(1);

      if (!app || app.length === 0) {
        return res.status(404).json(
          apiResponse({
            success: false,
            message: 'Application not found',
            data: null,
            errors: ['No application with that reference']
          })
        );
      }

      applicationId = app[0].id;
    }

    const documents = await DocumentStorageService.listDocuments({ applicationId });

    res.json(
      apiResponse({
        success: true,
        message: 'Documents ready for review',
        data: { documents }
      })
    );
  } catch (error) {
    console.error('[documentRoutes] Document review listing error:', error);
    res.status(500).json(
      apiResponse({
        success: false,
        message: 'Failed to load documents',
        data: null,
        errors: [error.message]
      })
    );
  }
});

/**
 * DELETE /api/documents/:applicationId/:documentId
 * Delete a document (ADMIN ONLY)
 */
router.delete('/:applicationId/:documentId', authenticate, async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'ADMIN') {
      return res.status(403).json(
        apiResponse({
          success: false,
          message: 'Only admins can delete documents',
          data: null,
          errors: ['Unauthorized']
        })
      );
    }

    await DocumentStorageService.deleteDocument({
      userId,
      applicationId,
      documentId
    });

    res.json(
      apiResponse({
        success: true,
        message: 'Document deleted successfully',
        data: { documentId }
      })
    );
  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json(
      apiResponse({
        success: false,
        message: 'Failed to delete document',
        data: null,
        errors: [error.message]
      })
    );
  }
});

export default router;
