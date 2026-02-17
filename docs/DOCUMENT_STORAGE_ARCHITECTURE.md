# Secure Document Storage Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (React)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ApplyModal Component          StudentDashboard              AdminDashboard │
│  ├── File Input               ├── View Documents            ├── View Audit  │
│  ├── Validation               ├── Download URLs             ├── Delete Docs │
│  └── Upload Trigger           └── Regenerate SAS            └── Quarantine  │
│         │                            │                              │       │
│         └─────────────────────────┬──┴──────────────────────────────┘       │
│                                   │                                         │
│                            Authenticated Requests                           │
│                          (JWT + Authorization Header)                       │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                    ┌───────────────┴──────────────┐
                    │   API LAYER (Express)        │
                    │                              │
┌───────────────────┼──────────────────────────────┼──────────────────────────┐
│                   │                              │                          │
│  POST /documents/upload                 GET /documents/audit/{appId}        │
│  ├── Auth check (STUDENT)               ├── Auth check (ADMIN)             │
│  ├── File validation                    └── Query audit logs               │
│  ├── Size check (5MB)                                                      │
│  ├── MIME type check                    GET /documents/{appId}/{docId}      │
│  └── Trigger upload                     ├── Access control check           │
│                                         ├── Generate SAS URL               │
│  DELETE /documents/{appId}/{docId}      ├── Log access event               │
│  ├── Auth check (ADMIN)                 └── Redirect to blob               │
│  ├── Delete from storage                                                   │
│  └── Log deletion                       DELETE /documents/{appId}/{docId}   │
│                                         ├── Auth check (ADMIN)             │
│                                         ├── Delete from blob               │
│                                         └── Log deletion                   │
│                                                                              │
└──────────────────────┬───────────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐  ┌──────────────┐  ┌─────────────┐
   │ DATABASE│  │ AZURE BLOB   │  │AUDIT LOGGER │
   │ SERVICE │  │  STORAGE     │  │   SERVICE   │
   └─────────┘  └──────────────┘  └─────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER (PostgreSQL)                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  document_references          document_audit_logs       document_quarantines│
│  ├── id (PK)                  ├── id (PK)               ├── id (PK)         │
│  ├── application_id (FK)      ├── user_id               ├── application_id   │
│  ├── document_type            ├── application_id        ├── document_id      │
│  ├── storage_id               ├── action                ├── reason           │
│  ├── file_hash                ├── timestamp             ├── severity         │
│  ├── mime_type                ├── user_role             ├── quarantined_by   │
│  ├── uploaded_at              ├── ip_address            ├── resolved_by      │
│  ├── expires_at               └── error                 └── resolution       │
│  └── metadata (JSON)                                                        │
│                                                                               │
│  Indexes: (application_id, document_type, uploaded_at, expires_at)          │
│           (user_id, application_id, action, timestamp)                      │
│           (application_id, severity, quarantined_at)                        │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER (Azure Blob Storage)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Container: secure-documents                                                │
│  Access Level: PRIVATE (no public access)                                   │
│  Encryption: AES-256 at rest                                                │
│                                                                               │
│  Organization:                                                              │
│  /applications/                                                             │
│  ├── {applicationId}/                                                       │
│  │   ├── GHANA_CARD_FRONT/                                                  │
│  │   │   └── {random-uuid}  (file)                                          │
│  │   ├── GHANA_CARD_BACK/                                                   │
│  │   │   └── {random-uuid}  (file)                                          │
│  │   ├── STUDENT_SELFIE/                                                    │
│  │   │   └── {random-uuid}  (file)                                          │
│  │   └── ADMISSION_LETTER/                                                  │
│  │       └── {random-uuid}  (file)                                          │
│  └── {applicationId}/                                                       │
│      └── ...                                                                │
│                                                                               │
│  File Metadata (Blob Properties):                                           │
│  ├── userId: Uploader ID                                                    │
│  ├── applicationId: Related application                                      │
│  ├── documentType: Document classification                                  │
│  ├── uploadedAt: ISO timestamp                                              │
│  ├── fileHash: SHA-256 integrity                                            │
│  └── mimeType: Content type                                                 │
│                                                                               │
│  Lifecycle Policies:                                                        │
│  └── Delete blobs older than 2555 days (7 years)                            │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Authentication & Access Control Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REQUEST RECEIVED                                     │
└────────────────────────────┬────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Check JWT Token │
                    └────────┬────────┘
                             │
                    ┌────────▼─────────────┐
                    │ Valid Token?         │
                    └──┬──────────────┬────┘
                      │ NO           │ YES
                    [403]       ┌────▼──────────────┐
                                │ Extract User Info │
                                │ - userId         │
                                │ - userRole       │
                                └────┬─────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ACTION:           ACTION:         ACTION:
           UPLOAD DOC       ACCESS DOC         DELETE DOC
                    │                │                │
         ┌──────────▼──┐  ┌──────────▼──┐  ┌─────────▼────┐
         │ ROLE CHECK  │  │ ROLE CHECK  │  │ ROLE CHECK   │
         └──────┬──────┘  └──────┬──────┘  └─────┬────────┘
                │                │              │
         ┌──────▼──────┐  ┌──────▼──────┐  ┌────▼────────┐
         │ STUDENT?    │  │ ADMIN/      │  │ ADMIN ONLY? │
         │             │  │ SRC/        │  │             │
         │ YES: OK     │  │ STUDENT?    │  │ YES: OK     │
         │ NO: [403]   │  │ YES: OK     │  │ NO: [403]   │
         └──────┬──────┘  │ NO: [403]   │  └────┬────────┘
                │         └────┬───────┘       │
         ┌──────▼──────┐       │         ┌─────▼──────┐
         │ OWNER CHECK │       │         │ DELETE FROM│
         │             │       │         │ BLOB       │
         │ Own App?    │       │         │ STORAGE    │
         │ YES: OK     │  ┌────▼──────┐ └─────┬──────┘
         │ NO: [403]   │  │ APP ACCESS│       │
         └──────┬──────┘  │ LOGIC     │ ┌─────▼──────┐
                │         │           │ │ LOG AUDIT  │
         ┌──────▼──────┐  │ STUDENT:  │ │ EVENT      │
         │VALIDATE FILE│  │ Own app   │ │            │
         │             │  │ only      │ │ "DELETED"  │
         │ Type/Size   │  │           │ └─────┬──────┘
         │ Check       │  │ SRC: Univ │       │
         │             │  │ apps only │ ┌─────▼──────┐
         │ OK: [200]   │  │           │ │ RETURN 200 │
         │ ERROR:[400] │  │ ADMIN:    │ └────────────┘
         └──────┬──────┘  │ All apps  │
                │         │           │
         ┌──────▼──────┐  └────┬──────┘
         │ UPLOAD TO   │       │
         │ BLOB        │  ┌────▼──────┐
         │ STORAGE     │  │GENERATE   │
         │             │  │SAS URL    │
         │ Generate    │  │(15 min)   │
         │ SAS URL     │  └────┬──────┘
         │ (15 min)    │       │
         └──────┬──────┘  ┌────▼──────┐
                │         │ LOG ACCESS│
         ┌──────▼──────┐  │ EVENT     │
         │ CALCULATE   │  │           │
         │ SHA-256     │  │ "ACCESSED"│
         │ HASH        │  └────┬──────┘
         │             │       │
         └──────┬──────┘  ┌────▼──────┐
                │         │ RETURN    │
         ┌──────▼──────┐  │ REDIRECT  │
         │ LOG UPLOAD  │  │ + SAS URL │
         │ EVENT       │  └───────────┘
         │             │
         │ "UPLOADED"  │
         │             │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │ RETURN 201  │
         │ + docId     │
         │ + hash      │
         │ + expires   │
         └─────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 1: EDGE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Cloudflare WAF (Optional)                                                   │
│ ├── DDoS protection                                                         │
│ ├── Bot detection                                                           │
│ └── Rate limiting                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: APPLICATION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Express.js Middleware                                                       │
│ ├── HTTPS/TLS 1.3 only                                                      │
│ ├── CORS restrictions (whitelist frontend domain)                           │
│ ├── Helmet.js security headers                                              │
│ ├── Rate limiting per IP/user                                               │
│ ├── Input validation (file type, size)                                      │
│ ├── Request sanitization                                                    │
│ └── Authentication (JWT tokens)                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                  LAYER 3: AUTHORIZATION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Role-Based Access Control                                                   │
│ ├── User role verification (ADMIN, SRC, STUDENT, DELIVERY)                 │
│ ├── Application ownership verification                                      │
│ ├── University affiliation verification (for SRC)                           │
│ └── Audit logging of all access attempts (allowed & denied)                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: DATA TRANSIT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Transport Security                                                          │
│ ├── HTTPS/TLS 1.3 for all connections                                       │
│ ├── Certificate pinning (optional)                                          │
│ ├── Perfect forward secrecy (PFS)                                           │
│ └── No unencrypted communication                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 5: DATA AT REST                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Encryption & Storage                                                        │
│ ├── Azure Blob Storage AES-256 encryption (server-managed keys)             │
│ ├── Database AES-256 encryption (at rest)                                   │
│ ├── Private blob container (no public access)                               │
│ ├── SAS tokens (short-lived, read-only)                                     │
│ ├── File integrity verification (SHA-256 hash)                              │
│ └── Lifecycle policies (auto-retention & deletion)                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 6: AUDIT & COMPLIANCE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Logging & Monitoring                                                        │
│ ├── Immutable audit logs (append-only)                                      │
│ ├── Complete access history (user, action, time, IP)                        │
│ ├── Anomaly detection (unusual patterns)                                    │
│ ├── Admin-only audit trail access                                           │
│ ├── Compliance reporting (GDPR, GDPA)                                       │
│ └── Incident response procedures                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ UPLOAD FLOW                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Student selects file in ApplyModal                                          │
│  ↓                                                                            │
│  Client validates: file type, size (5MB max)                                │
│  ↓                                                                            │
│  FormData created: { file, applicationId, documentType }                    │
│  ↓                                                                            │
│  POST /api/documents/upload (with JWT token)                                │
│  ↓                                                                            │
│  Server validates: authentication, authorization (STUDENT role)            │
│  ↓                                                                            │
│  Server validates file again: MIME type, size                              │
│  ↓                                                                            │
│  Generate document ID: `{appId}/{docType}/{randomUuid}`                    │
│  ↓                                                                            │
│  Calculate file hash: SHA-256(file_buffer)                                 │
│  ↓                                                                            │
│  Upload to Azure Blob Storage with metadata                                │
│  ├── userId: Student ID                                                     │
│  ├── applicationId: Application ID                                          │
│  ├── documentType: Type                                                     │
│  ├── fileHash: Integrity check                                              │
│  └── uploadedAt: Timestamp                                                  │
│  ↓                                                                            │
│  Log to audit: "DOCUMENT_UPLOADED" with metadata                           │
│  ↓                                                                            │
│  Store document reference in PostgreSQL                                     │
│  ├── id, application_id, document_type                                      │
│  ├── storage_id, file_hash, mime_type                                       │
│  └── uploaded_at, expires_at                                                │
│  ↓                                                                            │
│  Return 201: { docId, fileHash, expiresAt }                                │
│  ↓                                                                            │
│  Client receives and stores reference                                       │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DOWNLOAD FLOW                                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  User clicks "Download Document" button                                      │
│  ↓                                                                            │
│  GET /api/documents/{applicationId}/{documentId} (with JWT token)          │
│  ↓                                                                            │
│  Server validates: authentication, authorization                            │
│  ├── If STUDENT: verify document is in own application                      │
│  ├── If SRC: verify document is from own university                         │
│  ├── If ADMIN: access allowed to any document                               │
│  └── If DELIVERY: access denied                                             │
│  ↓                                                                            │
│  Access check passes                                                        │
│  ↓                                                                            │
│  Log to audit: "DOCUMENT_ACCESSED"                                         │
│  ├── user_id, user_role, ip_address                                        │
│  └── timestamp, document_id, document_type                                 │
│  ↓                                                                            │
│  Generate SAS URL with 15-minute expiration                                │
│  ├── Permissions: read-only (sp=r)                                         │
│  ├── Protocol: HTTPS only                                                   │
│  └── Signed with storage account key                                        │
│  ↓                                                                            │
│  Return 302 redirect to SAS URL                                            │
│  ↓                                                                            │
│  Browser follows redirect to Azure Blob Storage                             │
│  ↓                                                                            │
│  Azure Blob validates SAS signature and expiration                          │
│  ↓                                                                            │
│  If valid: return file content (200)                                        │
│  If invalid/expired: return 403                                             │
│  ↓                                                                            │
│  Browser downloads file                                                     │
│                                                                               │
│  Note: SAS URL expires after 15 minutes - must request new URL for retry   │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ AUDIT TRAIL FLOW                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Admin accesses audit dashboard                                              │
│  ↓                                                                            │
│  GET /api/documents/audit/{applicationId} (with JWT token)                 │
│  ↓                                                                            │
│  Server validates: authentication, authorization                            │
│  ├── Check JWT token valid                                                  │
│  ├── Verify user role is ADMIN                                              │
│  └── Only ADMIN can view audit logs                                         │
│  ↓                                                                            │
│  Query PostgreSQL document_audit_logs table                                 │
│  WHERE application_id = {applicationId}                                     │
│  ORDER BY timestamp DESC                                                    │
│  LIMIT 100                                                                   │
│  ↓                                                                            │
│  Return audit events:                                                       │
│  ├── Event: "DOCUMENT_UPLOADED"                                             │
│  │   └── User: student-uuid, Role: STUDENT, Time: 09:00:00                 │
│  ├── Event: "DOCUMENT_ACCESSED"                                             │
│  │   └── User: admin-uuid, Role: ADMIN, Time: 09:05:00, IP: 192.168.1.1  │
│  ├── Event: "DOCUMENT_ACCESSED"                                             │
│  │   └── User: src-uuid, Role: SRC, Time: 09:15:00                         │
│  ├── Event: "DOCUMENT_ACCESS_DENIED"                                        │
│  │   └── User: delivery-uuid, Role: DELIVERY, Time: 09:20:00, Error: No access
│  └── ... (up to 100 events)                                                 │
│  ↓                                                                            │
│  Admin reviews events, identifies patterns, compliance                       │
│  ↓                                                                            │
│  Admin can generate compliance report                                        │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

**Diagram Version:** 1.0  
**Last Updated:** January 22, 2026  
**Status:** ✅ Complete
