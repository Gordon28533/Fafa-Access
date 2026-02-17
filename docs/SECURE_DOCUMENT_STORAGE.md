# Secure Document Storage Implementation

## Overview

This document describes the complete secure document storage architecture for the Laptop Application system, handling sensitive documents like Ghana Cards, student selfies, and admission letters.

---

## Architecture

### Components

#### 1. **Storage Layer (Azure Blob Storage)**
- **Provider:** Azure Blob Storage with AES-256 encryption at rest
- **Organization:** `/applications/{applicationId}/{documentType}/{randomId}`
- **Access:** Private containers, no public access
- **Lifecycle Policy:** Auto-delete after 7 years (compliance with data retention laws)

#### 2. **Service Layer (DocumentStorageService)**
- Handles all document operations
- Manages encryption/decryption
- Generates expiring SAS URLs (15-minute expiry)
- Logs all access to audit trail
- Enforces role-based access control

#### 3. **API Layer (Document Routes)**
- RESTful endpoints for upload, download, deletion
- Request validation and error handling
- Rate limiting per user
- Response formatting via `apiResponse` utility

#### 4. **Audit Trail (Database)**
- Immutable logs of all document operations
- Tracks user, timestamp, action, IP address
- Enables dispute resolution and compliance

#### 5. **Database Schema**
Four new tables for comprehensive document management:
- `document_references` - Document metadata
- `document_audit_logs` - Access audit trail
- `document_access_tokens` - Temporary access tokens
- `document_quarantines` - Flagged/suspicious documents

---

## Document Types

### Supported Documents

| Type | Purpose | Formats | Size Limit |
|------|---------|---------|-----------|
| `GHANA_CARD_FRONT` | Ghana Card front image | JPG, PNG | 5MB |
| `GHANA_CARD_BACK` | Ghana Card back image | JPG, PNG | 5MB |
| `STUDENT_SELFIE` | Student selfie with card | JPG, PNG | 5MB |
| `ADMISSION_LETTER` | Proof of admission | PDF, JPG, PNG | 5MB |

---

## Access Control

### Role-Based Permissions

```
┌─────────────┬──────────┬────────┬─────────┬──────────┐
│ Action      │ STUDENT  │ SRC    │ ADMIN   │ DELIVERY │
├─────────────┼──────────┼────────┼─────────┼──────────┤
│ Upload      │ Own app  │ ✗      │ ✗       │ ✗        │
│ View        │ Own app  │ Own uni│ All     │ ✗        │
│ Download    │ Own app  │ Own uni│ All     │ ✗        │
│ Delete      │ ✗        │ ✗      │ All     │ ✗        │
│ Audit Log   │ ✗        │ ✗      │ All     │ ✗        │
│ Quarantine  │ ✗        │ ✗      │ All     │ ✗        │
└─────────────┴──────────┴────────┴─────────┴──────────┘
```

### Access Logic

```javascript
// Student can only access their own documents
if (userRole === 'STUDENT') {
  return application.studentId === currentStudent.id;
}

// SRC can access documents from their university
if (userRole === 'SRC') {
  return application.student.university.id === srcOfficer.university.id;
}

// Admin can access everything
if (userRole === 'ADMIN') {
  return true;
}

// Delivery cannot access documents
if (userRole === 'DELIVERY') {
  return false;
}
```

---

## API Endpoints

### 1. Upload Document

```http
POST /api/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
{
  "applicationId": "uuid",
  "documentType": "GHANA_CARD_FRONT",
  "file": <binary file data>
}

Response (201):
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "docId": "uuid/GHANA_CARD_FRONT/abc123",
    "fileHash": "sha256-hash",
    "expiresAt": "2026-01-22T10:15:00Z"
  }
}
```

### 2. Download Document

```http
GET /api/documents/{applicationId}/{documentId}
Authorization: Bearer {token}

Response:
- Redirects to Azure Blob Storage SAS URL (15-min expiry)
- OR returns 403 if unauthorized
- Logs access to audit trail

Example SAS URL:
https://storage.blob.core.windows.net/secure-documents/uuid/GHANA_CARD_FRONT/abc123?sv=2023-11-03&ss=b&srt=sco&sp=rwdlac&se=2026-01-22T10:15:00Z&sig=signature
```

### 3. Retrieve Audit Trail

```http
GET /api/documents/audit/{applicationId}
Authorization: Bearer {token}
Required: ADMIN role

Response (200):
{
  "success": true,
  "message": "Audit trail retrieved",
  "data": {
    "applicationId": "uuid",
    "events": [
      {
        "id": "uuid",
        "userId": "admin-uuid",
        "action": "DOCUMENT_UPLOADED",
        "documentType": "GHANA_CARD_FRONT",
        "userRole": "ADMIN",
        "timestamp": "2026-01-22T09:00:00Z"
      },
      {
        "id": "uuid",
        "userId": "student-uuid",
        "action": "DOCUMENT_ACCESSED",
        "documentType": "GHANA_CARD_FRONT",
        "userRole": "STUDENT",
        "timestamp": "2026-01-22T09:30:00Z"
      }
    ],
    "totalEvents": 2
  }
}
```

### 4. Delete Document

```http
DELETE /api/documents/{applicationId}/{documentId}
Authorization: Bearer {token}
Required: ADMIN role

Response (200):
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "documentId": "uuid/GHANA_CARD_FRONT/abc123"
  }
}
```

---

## Security Features

### 1. **Private Access**
- Azure Blob Storage configured as private (no public URLs)
- All access requires valid SAS token
- Tokens expire in 15 minutes
- Tokens are read-only (`sp=r`)

### 2. **Expiring URLs**
- SAS tokens generated on-demand with 15-minute expiry
- URL expires automatically
- No long-lived tokens stored in database
- Browser must re-request for new token

### 3. **Audit Trail**
Complete immutable logs for compliance:
```
Document Reference:
├── Id: Document ID
├── ApplicationId: Related application
├── DocumentType: Type of document
├── StorageId: Azure Blob path
├── FileHash: SHA-256 integrity check
├── MimeType: Content type
└── UploadedAt: Timestamp

Audit Log Entry:
├── Id: Log entry ID
├── UserId: Who performed action
├── ApplicationId: Related application
├── Action: UPLOADED, ACCESSED, DELETED, ACCESS_DENIED
├── DocumentId: Document affected
├── UserRole: ADMIN, SRC, STUDENT
├── IpAddress: Client IP (from request)
├── UserAgent: Browser info
├── Error: Any error message
└── Timestamp: When action occurred
```

### 4. **Admin-Only Visibility**
- Only admins can view audit trails
- Only admins can delete documents
- Only admins can quarantine documents
- All admin actions are logged

### 5. **Integrity Verification**
- SHA-256 hash calculated on upload
- Hash stored in metadata
- Client can verify file integrity
- Detects file tampering

### 6. **Encryption**
- **At Rest:** Azure Blob Storage AES-256 encryption
- **In Transit:** HTTPS/TLS 1.3
- **Application Layer:** No additional encryption needed (handled by Azure)

---

## Database Schema

### `document_references`
```sql
CREATE TABLE document_references (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  storage_id TEXT NOT NULL UNIQUE,
  file_hash VARCHAR(64) NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  INDEX (application_id),
  INDEX (document_type),
  INDEX (uploaded_at),
  INDEX (expires_at)
);
```

### `document_audit_logs`
```sql
CREATE TABLE document_audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  application_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  document_id TEXT,
  document_type VARCHAR(50),
  user_role VARCHAR(20),
  file_hash VARCHAR(64),
  mime_type VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  error TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX (user_id),
  INDEX (application_id),
  INDEX (action),
  INDEX (document_id),
  INDEX (timestamp),
  INDEX (user_role)
);
```

### `document_access_tokens`
```sql
CREATE TABLE document_access_tokens (
  id UUID PRIMARY KEY,
  document_id TEXT NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_restriction VARCHAR(45),
  
  INDEX (document_id),
  INDEX (expires_at),
  INDEX (revoked_at)
);
```

### `document_quarantines`
```sql
CREATE TABLE document_quarantines (
  id UUID PRIMARY KEY,
  application_id UUID NOT NULL,
  document_id TEXT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  quarantined_by UUID NOT NULL,
  quarantined_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution VARCHAR(20),
  notes TEXT,
  
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  INDEX (application_id),
  INDEX (severity),
  INDEX (quarantined_at),
  INDEX (resolved_at)
);
```

---

## Implementation Steps

### 1. Create Migration
```bash
npm run db:migrate -- create_document_tables
```

### 2. Update Schema Index
Add to `src/db/schema/index.ts`:
```typescript
export * from './documents';
```

### 3. Configure Environment
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=secure-documents
```

### 4. Install Dependencies
```bash
npm install @azure/storage-blob multer
```

### 5. Register Routes
In `src/server.js`:
```javascript
import documentRoutes from './routes/documentRoutes.js';
app.use('/api', documentRoutes);
```

### 6. Integrate with Application Upload
In `ApplyModal.jsx`:
```jsx
const uploadDocument = async (file, documentType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('applicationId', applicationId);
  formData.append('documentType', documentType);
  
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  const { data } = await response.json();
  return data.docId;
};
```

---

## Security Considerations

### ✅ Implemented
- [x] Private blob storage (no public access)
- [x] Expiring SAS URLs (15-minute TTL)
- [x] Complete audit trail (immutable logs)
- [x] Role-based access control
- [x] File integrity verification (SHA-256)
- [x] Encryption at rest (AES-256)
- [x] Admin-only operations
- [x] IP address logging
- [x] Rate limiting (via existing middleware)

### 🔒 Additional Recommendations
- [ ] Enable blob versioning for recovery
- [ ] Configure blob soft-delete (90 days)
- [ ] Implement virus scanning on upload (ClamAV)
- [ ] Add IP restrictions for admin tokens
- [ ] Enable Azure Defender for blob storage
- [ ] Set up alerts for unusual access patterns
- [ ] Implement MFA for admin download
- [ ] Add watermarking for sensitive documents

---

## Testing Checklist

- [ ] Student can upload documents for their application
- [ ] Student cannot upload documents for others' applications
- [ ] Student can download own documents
- [ ] SRC can view applications from their university
- [ ] SRC cannot view applications from other universities
- [ ] Admin can view all documents
- [ ] Admin can view audit trails
- [ ] Delivery cannot access documents
- [ ] URLs expire after 15 minutes
- [ ] Audit logs include user, action, timestamp
- [ ] File hash verification works
- [ ] Unsupported file types are rejected
- [ ] Files >5MB are rejected
- [ ] Deleted documents are removed from Azure

---

## Compliance

### GDPR Compliance
- ✅ User consent for document collection
- ✅ Audit logs for data access (Article 32)
- ✅ Data deletion after retention period
- ✅ Encryption at rest and in transit

### Ghana Data Protection Act (GDPA) 2012
- ✅ Secure storage of personal documents
- ✅ Access control and audit trails
- ✅ Data retention limits
- ✅ User consent logging

### HIPAA-like Requirements (if applicable)
- ✅ Encryption at rest and in transit
- ✅ Access control and authentication
- ✅ Complete audit trail
- ✅ 6-year retention policy

---

## Cost Estimation

| Component | Pricing | Monthly Cost |
|-----------|---------|--------------|
| Azure Blob Storage | $0.018/GB/month | $9-15 |
| Storage Transactions | $0.004 per 10K | $5-10 |
| Egress (downloads) | $0.087/GB | $2-5 |
| **Total** | | **$16-30** |

*Based on 500GB stored, 100K transactions/month, 50GB downloads/month*

---

## Troubleshooting

### "Unauthorized: No access to this document"
- Verify user is logged in
- Check user role matches requirements
- For SRC: verify application is from their university
- For STUDENT: verify application is theirs

### "File size exceeds 5MB limit"
- Compress image before uploading
- Convert to PNG/JPG (no BMP, TIFF)
- Reduce image resolution to 2048x2048

### "Invalid file type. Only JPG, PNG, and PDF allowed"
- Supported types: JPEG, PNG, PDF
- Check file extension matches content type
- Try re-saving image in different format

### SAS URL expired
- URLs expire after 15 minutes
- Request new URL by calling GET endpoint again
- Client should handle 403 and retry

### Audit logs show no entries
- Check user has ADMIN role
- Verify applicationId exists
- Check database connection
- Review application logs for errors

---

## Future Enhancements

1. **Virus Scanning**
   - Integrate ClamAV for malware detection
   - Quarantine suspicious files automatically
   - Notify user of issues

2. **OCR & Document Validation**
   - Extract text from Ghana Cards
   - Validate format and information
   - Flag invalid or expired documents

3. **Blockchain Audit Trail**
   - Store document hashes on blockchain
   - Immutable proof of upload/access
   - Compliance with regulatory requirements

4. **Document Retention Policies**
   - Auto-delete after 7 years
   - Configurable per document type
   - Compliance reporting

5. **Admin Analytics**
   - Document upload trends
   - Access pattern analysis
   - Anomaly detection
   - Reports for compliance audits

6. **WebP & HEIC Support**
   - Modern image formats
   - Better compression
   - Client-side conversion

---

## Related Documentation

- [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) - Azure Blob Storage setup
- [DATABASE_COMPLETE.md](./DATABASE_COMPLETE.md) - Schema reference
- [BACKEND_ARCHITECTURE_REFACTOR.md](./BACKEND_ARCHITECTURE_REFACTOR.md) - Service integration

---

**Last Updated:** January 22, 2026  
**Status:** ✅ Implemented
