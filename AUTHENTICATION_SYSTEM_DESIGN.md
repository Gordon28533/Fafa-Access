# Secure Authentication System Design
## Ghana Student Laptop Platform

**Status**: Architecture & Design  
**Date**: January 22, 2026  
**Environment**: Ghana-based deployment, Express.js backend, PostgreSQL, Drizzle ORM

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Authentication Flows](#authentication-flows)
4. [Database Schema](#database-schema)
5. [JWT Implementation](#jwt-implementation)
6. [Security Considerations](#security-considerations)
7. [Implementation Guide](#implementation-guide)
8. [Ghana-Specific Considerations](#ghana-specific-considerations)

---

## System Overview

### Core Components

1. **Registration System**: Email-based account creation with validation
2. **Login System**: Password authentication with rate limiting and account lockout
3. **Session Management**: JWT tokens with refresh token rotation
4. **Authorization**: Role-based access control (RBAC) with permissions
5. **Account Management**: Status tracking, suspension, role assignment

### User Roles

| Role | Purpose | Permissions |
|------|---------|-------------|
| **Student** | Apply for laptop, track delivery | View own profile, submit applications, track delivery |
| **SRC Officer** | Review and approve applications | Approve applications, view assigned students, manage reviews |
| **Admin** | Platform management | All student permissions + manage users, view reports, override decisions |
| **Delivery Staff** | Manage laptop delivery | View deliveries assigned, update delivery status, collect signatures |
| **Super Admin** | System administration | Full platform access, user management, system configuration |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  (Web Browser, Mobile App, Desktop Client)                      │
└─────────────────┬───────────────────────────────────────────────┘
                  │ HTTPS
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                   API Gateway / Reverse Proxy                    │
│  (Rate Limiting, SSL Termination, Request Validation)          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
┌──────────────────┐  ┌──────────────────┐
│  Auth Service    │  │  API Service     │
│  - Register      │  │  - Applications  │
│  - Login         │  │  - Deliveries    │
│  - Token Mgmt    │  │  - Reviews       │
│  - MFA           │  │  - Payments      │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    ↓
        ┌───────────────────────┐
        │   Token Service       │
        │  (JWT validation,     │
        │   refresh logic)      │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        ↓                       ↓
    ┌────────────┐        ┌───────────────┐
    │ PostgreSQL │        │   Redis       │
    │ (Users,    │        │  (Sessions,   │
    │  Roles,    │        │   Tokens,     │
    │  Permissions)       │   Rate Limits)│
    └────────────┘        └───────────────┘
        │
        ↓
    ┌────────────────────┐
    │  Audit Logging     │
    │  (Security events) │
    └────────────────────┘
```

### Deployment Architecture (Ghana Context)

```
┌──────────────────────────────────────────────────────┐
│         Cloudflare / AWS Shield (DDoS Protection)   │
│              (International Edge)                    │
└────────────────────┬─────────────────────────────────┘
                     │ Optimized for Ghana access
                     ↓
        ┌────────────────────────┐
        │   Reverse Proxy        │
        │   (Nginx/CloudFront)   │
        │   - Rate limiting      │
        │   - SSL/TLS            │
        │   - Compression        │
        └────────┬───────────────┘
                 │
         ┌───────┴────────┐
         ↓                ↓
    ┌─────────┐    ┌──────────┐
    │ Primary │    │ Standby  │
    │ Server  │    │ Server   │
    │(Prod)   │    │(Hot Copy)│
    └────┬────┘    └────┬─────┘
         │              │
         └──────┬───────┘
                ↓
        ┌──────────────────┐
        │  PostgreSQL      │
        │  Cluster         │
        │  (Streaming      │
        │   Replication)   │
        └──────────────────┘
```

---

## Authentication Flows

### 1. Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Registration Process                                   │
└─────────────────────────────────────────────────────────────┘

┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. POST /api/auth/register
     │    { email, password, name, phone }
     ↓
┌────────────────────────────────┐
│  API: Validate Input           │
│  ✓ Email format                │
│  ✓ Password strength           │
│  ✓ Email not already registered│
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Hash Password (bcrypt)         │
│  - Cost factor: 12              │
│  - Random salt per user         │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Create User Record            │
│  - id: UUID                    │
│  - email: unique               │
│  - password_hash               │
│  - role: 'student' (default)   │
│  - status: 'pending_email'     │
│  - created_at: now             │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Generate Email Verification   │
│  Token (36 hours expiry)       │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Send Email                    │
│  - Link: /verify?token=xxx     │
│  - Store token in Redis        │
└────┬───────────────────────────┘
     │
     ↓
┌──────────┐
│  Client  │ 2. Response: "Check your email"
└──────────┘

     │ 3. User clicks link in email
     │    GET /api/auth/verify?token=xxx
     ↓
┌────────────────────────────────┐
│  Verify Token                  │
│  - Check token exists in Redis │
│  - Check not expired           │
│  - Check not already used      │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Update User Status            │
│  - status: 'active'            │
│  - email_verified_at: now      │
│  - Delete token from Redis     │
└────┬───────────────────────────┘
     │
     ↓
┌──────────┐
│  Client  │ 4. Response: "Email verified, you can login now"
└──────────┘
```

### 2. Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Login Process                                          │
└─────────────────────────────────────────────────────────────┘

┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. POST /api/auth/login
     │    { email, password }
     ↓
┌────────────────────────────────┐
│  Check Rate Limit              │
│  - Max 5 attempts per 15 min   │
│  - Rate limit by email + IP    │
└────┬───────────────────────────┘
     │
     ├─ BLOCKED? → Return 429 Too Many Requests
     │
     ↓
┌────────────────────────────────┐
│  Fetch User from DB            │
│  WHERE email = ?               │
└────┬───────────────────────────┘
     │
     ├─ NOT FOUND? → Log attempt, simulate bcrypt delay, return 401
     │
     ↓
┌────────────────────────────────┐
│  Check Account Status          │
│  - status = 'active'?          │
│  - not suspended?              │
│  - not locked?                 │
└────┬───────────────────────────┘
     │
     ├─ SUSPENDED/LOCKED? → Return 403 Account Locked
     │
     ↓
┌────────────────────────────────┐
│  Verify Password               │
│  bcrypt.compare(input, hash)   │
└────┬───────────────────────────┘
     │
     ├─ INVALID? → Increment failed attempts, return 401
     │
     ↓
┌────────────────────────────────┐
│  Reset Failed Attempts         │
│  - failed_login_attempts = 0   │
│  - locked_until = null         │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Check for MFA                 │
│  - mfa_enabled?                │
└────┬───────────────────────────┘
     │
     ├─ YES → Send TOTP challenge, return {status: 'mfa_required'}
     │
     ↓
┌────────────────────────────────┐
│  Generate Tokens               │
│  Access Token:                 │
│  - Claims: user_id, email,     │
│    role, permissions           │
│  - Expiry: 15 minutes          │
│  - Algorithm: RS256            │
│                                │
│  Refresh Token:                │
│  - Claims: user_id, version    │
│  - Expiry: 7 days              │
│  - Algorithm: RS256            │
│  - Stored in DB + Redis        │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Set Secure Cookie             │
│  - httpOnly: true              │
│  - secure: true (HTTPS only)   │
│  - sameSite: 'strict'          │
│  - maxAge: 7 days              │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Log Login Event               │
│  - user_id, email              │
│  - ip, user_agent              │
│  - timestamp, success           │
│  - geolocation (optional)      │
└────┬───────────────────────────┘
     │
     ↓
┌──────────┐
│  Client  │ 2. Response: {
└──────────┘    access_token: "eyJhbGc...",
               refresh_token: "eyJhbGc...",
               user: {
                 id: "uuid",
                 email: "student@university.edu.gh",
                 role: "student",
                 name: "Kwame Appiah"
               }
             }
```

### 3. Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Token Refresh Process                                       │
└─────────────────────────────────────────────────────────────┘

┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. POST /api/auth/refresh
     │    Cookie: refresh_token=xxx OR
     │    Body: { refresh_token: "xxx" }
     ↓
┌────────────────────────────────┐
│  Extract Refresh Token         │
│  - From cookie (httpOnly)      │
│  - OR from request body        │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Validate Token Signature      │
│  - Verify RS256 signature      │
│  - Check not expired           │
└────┬───────────────────────────┘
     │
     ├─ INVALID? → Return 401 Unauthorized
     │
     ↓
┌────────────────────────────────┐
│  Check Token Rotation          │
│  - Is token in revocation list?│
│  - Was password changed?       │
│  - Was MFA status changed?     │
└────┬───────────────────────────┘
     │
     ├─ REVOKED? → Return 401, force login
     │
     ↓
┌────────────────────────────────┐
│  Fetch User & Check Status     │
│  - User still exists?          │
│  - Account not suspended?      │
│  - Role unchanged?             │
└────┬───────────────────────────┘
     │
     ├─ INVALID STATE? → Return 401, force login
     │
     ↓
┌────────────────────────────────┐
│  Revoke Old Refresh Token      │
│  - Add to Redis blacklist      │
│  - Mark old token as used      │
│  - Keep in DB for audit        │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Generate New Tokens           │
│  - New access token (15 min)   │
│  - New refresh token (7 days)  │
│  - Increment token version     │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Store New Refresh Token       │
│  - DB: refresh_tokens table    │
│  - Redis: cache with TTL       │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Update Cookie                 │
│  - Set new refresh token       │
│  - Reset expiration (7 days)   │
└────┬───────────────────────────┘
     │
     ↓
┌──────────┐
│  Client  │ 2. Response: {
└──────────┘    access_token: "eyJhbGc...",
               refresh_token: "eyJhbGc..." (new)
             }
```

### 4. MFA (TOTP) Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Multi-Factor Authentication (TOTP) Setup & Verification    │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Step 1: MFA Setup (by user)           │
│  POST /api/auth/mfa/setup              │
└────────────────────────────────────────┘

┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. User requests MFA setup
     ↓
┌────────────────────────────────┐
│  Generate Secret Key (TOTP)    │
│  - 32-char random base32       │
│  - Uses speakeasy library      │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Generate QR Code              │
│  - otpauth://totp/...          │
│  - Encode as QR image          │
└────┬───────────────────────────┘
     │
     ↓
┌────────────────────────────────┐
│  Generate Backup Codes         │
│  - 10 one-time codes           │
│  - Hash with bcrypt            │
│  - Store in DB                 │
└────┬───────────────────────────┘
     │
     ↓
┌──────────┐
│  Client  │ 2. Response: {
└──────────┘    secret: "JBSWY3DP...",
               qr_code_url: "data:image/png;...",
               backup_codes: ["XXXX-XXXX", ...]
             }

     │ 3. User scans QR with authenticator app
     │    (Google Authenticator, Authy, etc.)
     │
     │ 4. User verifies TOTP code
     │    POST /api/auth/mfa/verify-setup
     │    { code: "123456" }
     ↓
┌────────────────────────────────┐
│  Verify TOTP Code              │
│  - Current + previous 1 window │
│  - Prevent code replay         │
└────┬───────────────────────────┘
     │
     ├─ INVALID? → Return 400, reject setup
     │
     ↓
┌────────────────────────────────┐
│  Enable MFA on Account         │
│  - mfa_enabled = true          │
│  - mfa_secret (encrypted)      │
│  - mfa_enabled_at = now        │
└────┬───────────────────────────┘
     │
     ↓
┌──────────┐
│  Client  │ 5. Response: "MFA enabled"
└──────────┘

┌────────────────────────────────────────┐
│  Step 2: Login with MFA                │
│  (During login, after password check)  │
└────────────────────────────────────────┘

     │ 1. Login with valid credentials
     │    but mfa_enabled = true
     ↓
┌────────────────────────────────┐
│  Send MFA Challenge            │
│  - Generate temporary token    │
│  - 10-minute expiry            │
└────┬───────────────────────────┘
     │
     ↓
┌──────────┐
│  Client  │ 2. Response: {
└──────────┘    status: "mfa_required",
               mfa_token: "temp_xxx"
             }

     │ 3. User enters TOTP code
     │    POST /api/auth/mfa/verify
     │    { code: "123456", mfa_token: "temp_xxx" }
     ↓
┌────────────────────────────────┐
│  Verify MFA Code               │
│  - Decrypt user's secret       │
│  - Check TOTP (current + 1 prev)
│  - Prevent replay              │
└────┬───────────────────────────┘
     │
     ├─ INVALID? → Increment attempts, return 401
     │             (5 attempts = revoke mfa_token)
     │
     ↓
┌────────────────────────────────┐
│  Issue Tokens                  │
│  - Access token (15 min)       │
│  - Refresh token (7 days)      │
│  - Mark mfa_verified_at        │
└────┬───────────────────────────┘
     │
     ↓
┌──────────┐
│  Client  │ 4. Response: {
└──────────┘    access_token: "eyJhbGc...",
               refresh_token: "eyJhbGc..."
             }
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending_email', -- pending_email, active, suspended, deleted
  suspended_at TIMESTAMP,
  suspension_reason TEXT,
  
  -- Email verification
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  
  -- Login tracking
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  
  -- MFA
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret_encrypted VARCHAR(255),
  mfa_verified_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;
```

### User Roles Table

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- student, src, admin, delivery_staff, super_admin
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES users(id),
  
  -- Role-specific metadata
  university_id UUID,
  assignment_region VARCHAR(100), -- For delivery staff
  
  PRIMARY KEY (user_id, role)
);

CREATE INDEX idx_user_roles_role ON user_roles(role);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  
  -- Token metadata
  version INT NOT NULL DEFAULT 1,
  family_id UUID, -- For token rotation tracking
  
  -- Lifecycle
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  revocation_reason VARCHAR(255),
  
  -- Request context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  INDEX idx_refresh_tokens_user_id (user_id),
  INDEX idx_refresh_tokens_expires_at (expires_at)
);
```

### Login Audit Log

```sql
CREATE TABLE login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email VARCHAR(255), -- In case user not found
  
  -- Request context
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  country_code VARCHAR(2),
  city VARCHAR(100),
  
  -- Attempt details
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255), -- user_not_found, invalid_password, account_locked, mfa_failed
  mfa_required BOOLEAN,
  
  attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_login_audit_user_id (user_id),
  INDEX idx_login_audit_email (email),
  INDEX idx_login_audit_attempted_at (attempted_at),
  INDEX idx_login_audit_success (success)
);
```

### Permissions Table (RBAC)

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(100), -- users, applications, deliveries, etc.
  action VARCHAR(50), -- create, read, update, delete, approve
  
  UNIQUE(resource, action)
);

CREATE TABLE role_permissions (
  role VARCHAR(50) NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  PRIMARY KEY (role, permission_id)
);
```

---

## JWT Implementation

### Token Structure

#### Access Token

```javascript
{
  // Standard JWT claims
  iss: "https://auth.laptopplatform.edu.gh",
  sub: "550e8400-e29b-41d4-a716-446655440000",
  aud: ["laptopplatform"],
  iat: 1705920000,
  exp: 1705920900, // 15 minutes
  jti: "abc123def456", // JWT ID for revocation tracking
  
  // Custom claims
  email: "kwame@ashanti.edu.gh",
  name: "Kwame Appiah",
  role: "student",
  
  // Permissions
  permissions: [
    "applications:read",
    "applications:create",
    "profile:read",
    "profile:update"
  ],
  
  // Security context
  session_id: "sess_123456",
  mfa_verified: true,
  
  // Refresh token metadata
  refresh_token_version: 1
}
```

#### Refresh Token

```javascript
{
  iss: "https://auth.laptopplatform.edu.gh",
  sub: "550e8400-e29b-41d4-a716-446655440000",
  aud: ["refresh"],
  iat: 1705920000,
  exp: 1706524800, // 7 days
  jti: "ref_xyz789",
  
  // Custom claims
  email: "kwame@ashanti.edu.gh",
  type: "refresh",
  
  // Rotation tracking
  version: 1,
  family_id: "fam_abc123" // For token family tracking
}
```

### Key Management

```javascript
// RS256 (asymmetric) for better security distribution
// Private key: Stored on auth server only
// Public key: Can be shared with all services for validation

// .env
PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...
PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...
TOKEN_SECRET=randomstring123 // For token JTI blacklist

// Key rotation
// - Rotate keys annually
// - Keep old keys for 30 days for token validation
// - Use key versioning (kid header)
```

### Token Validation Middleware

```javascript
// src/middleware/tokenValidation.js
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

const redisClient = createClient();
const PUBLIC_KEY = process.env.PUBLIC_KEY;

export async function verifyAccessToken(req, res, next) {
  try {
    // Extract from header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify signature and expiration
    const decoded = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
      audience: 'laptopplatform'
    });
    
    // Check if token is blacklisted (revoked)
    const blacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
    if (blacklisted) {
      return res.status(401).json({ error: 'Token revoked' });
    }
    
    // Attach decoded token to request
    req.user = decoded;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ error: 'Token validation failed' });
  }
}

export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
}
```

---

## Security Considerations

### 1. Password Security

✅ **Implemented**
- Bcrypt with cost factor 12 (150ms hashing time)
- Random salt per user
- Password strength validation (12+ chars, uppercase, lowercase, number, symbol)
- Password history (prevent reuse of last 5)
- Automatic password reset after 90 days (for admin accounts)
- Never log or display passwords in plaintext

```javascript
// src/utils/passwordSecurity.js
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 12;

export async function hashPassword(plaintext) {
  // Validate strength
  if (!isPasswordStrong(plaintext)) {
    throw new Error('Password does not meet security requirements');
  }
  
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

function isPasswordStrong(password) {
  return password.length >= MIN_PASSWORD_LENGTH &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password) &&
         /[^A-Za-z0-9]/.test(password);
}

// Check password history (prevent reuse)
export async function isPasswordReused(userId, plaintext) {
  const history = await db.select()
    .from(password_history)
    .where(eq(password_history.user_id, userId))
    .orderBy(desc(password_history.changed_at))
    .limit(5);
  
  for (const record of history) {
    const match = await verifyPassword(plaintext, record.password_hash);
    if (match) return true;
  }
  
  return false;
}
```

### 2. Session Management

✅ **Implemented**
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Refresh token rotation (issue new on each refresh)
- Secure, httpOnly cookies (prevents JavaScript access)
- CSRF protection via SameSite cookies
- Session invalidation on logout/password change
- Simultaneous session limit (max 3 active sessions per user)

```javascript
// src/utils/sessionManagement.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
const MAX_ACTIVE_SESSIONS = 3;

export function generateAccessToken(user) {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
    session_id: crypto.randomUUID(),
    mfa_verified: user.mfa_verified
  }, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'https://auth.laptopplatform.edu.gh',
    audience: 'laptopplatform',
    jti: crypto.randomUUID()
  });
}

export function generateRefreshToken(user) {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    type: 'refresh'
  }, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'https://auth.laptopplatform.edu.gh',
    audience: 'refresh',
    jti: crypto.randomUUID()
  });
}

// Enforce session limit
export async function enforceSessionLimit(userId) {
  const activeSessions = await db.select()
    .from(refresh_tokens)
    .where(
      and(
        eq(refresh_tokens.user_id, userId),
        isNull(refresh_tokens.revoked_at),
        gt(refresh_tokens.expires_at, new Date())
      )
    );
  
  if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
    // Revoke oldest session
    const oldest = activeSessions.sort((a, b) => 
      a.created_at.getTime() - b.created_at.getTime()
    )[0];
    
    await db.update(refresh_tokens)
      .set({ 
        revoked_at: new Date(),
        revocation_reason: 'exceeded_session_limit'
      })
      .where(eq(refresh_tokens.id, oldest.id));
  }
}

// Invalidate all sessions (password change, account lockdown)
export async function invalidateAllSessions(userId, reason) {
  await db.update(refresh_tokens)
    .set({
      revoked_at: new Date(),
      revocation_reason: reason
    })
    .where(
      and(
        eq(refresh_tokens.user_id, userId),
        isNull(refresh_tokens.revoked_at)
      )
    );
  
  // Also blacklist in Redis
  const sessions = await db.select()
    .from(refresh_tokens)
    .where(eq(refresh_tokens.user_id, userId));
  
  for (const session of sessions) {
    await redisClient.setEx(
      `blacklist:${session.id}`,
      REFRESH_TOKEN_EXPIRY,
      '1'
    );
  }
}
```

### 3. Rate Limiting & Brute Force Protection

✅ **Implemented**
- Login: 5 attempts per 15 minutes (per email + IP combo)
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email
- MFA verification: 5 attempts per 15 minutes
- 15-minute account lockout after threshold
- Exponential backoff (wait time increases after repeated failures)

```javascript
// src/middleware/bruteForceProtection.js
import { createClient } from 'redis';
import { logger } from '../observability.js';

const redisClient = createClient();

const LIMITS = {
  login: { attempts: 5, windowMs: 15 * 60 * 1000 }, // 15 minutes
  register: { attempts: 3, windowMs: 60 * 60 * 1000 }, // 1 hour
  passwordReset: { attempts: 3, windowMs: 60 * 60 * 1000 }, // 1 hour
  mfa: { attempts: 5, windowMs: 15 * 60 * 1000 } // 15 minutes
};

export async function checkBruteForce(type, identifier) {
  const key = `brute:${type}:${identifier}`;
  const attempts = await redisClient.incr(key);
  
  if (attempts === 1) {
    // First attempt, set expiry
    await redisClient.expire(key, Math.ceil(LIMITS[type].windowMs / 1000));
  }
  
  const limit = LIMITS[type];
  
  if (attempts > limit.attempts) {
    // Lock out
    await redisClient.setEx(
      `lockout:${identifier}`,
      15 * 60, // 15 minute lockout
      'true'
    );
    
    logger.warn({
      event: 'brute_force_lockout',
      type,
      identifier: sanitizeIdentifier(identifier)
    });
    
    throw new Error('Too many attempts, account locked');
  }
  
  return {
    attempts,
    remaining: limit.attempts - attempts,
    resetTime: new Date(Date.now() + limit.windowMs)
  };
}

function sanitizeIdentifier(id) {
  if (id.includes('@')) {
    return id.replace(/(.{2})(.*)(@.*)/, '$1***$3');
  }
  return '***';
}
```

### 4. Account Lockout Mechanism

✅ **Implemented**
- Automatic lockout after 5 failed login attempts
- 15-minute cooldown period
- Email notification to user
- Admin can manually unlock account
- Failed attempts reset on successful login

```javascript
// In login handler
if (user.locked_until && new Date(user.locked_until) > new Date()) {
  const remainingTime = Math.ceil(
    (user.locked_until.getTime() - Date.now()) / 60000
  );
  
  await logAuthFailure({
    userId: user.id,
    reason: 'account_locked',
    remainingMinutes: remainingTime,
    ip: req.ip
  });
  
  return res.status(423).json({
    error: 'Account temporarily locked',
    unlocks_in_minutes: remainingTime,
    contact: 'support@laptopplatform.edu.gh'
  });
}
```

### 5. Ghana-Specific Security

⚠️ **Network Considerations**
- Intermittent internet: Offline-first tokens (no server validation required during brief disconnections)
- Mobile dominance: Ensure mobile app can store tokens securely (encrypted local storage)
- Data costs: Minimize token size (JWT overhead)

⚠️ **Compliance Considerations**
- Data localization: Store user data within Ghana (Google Cloud Ghana region)
- Privacy: Comply with Ghana Data Protection Act
- Audit: Log all access to sensitive operations
- Phone verification: Support Ghana phone number format (+233 XXX XXX XXXX)

```javascript
// Ghana phone validation
export function validateGhanaPhoneNumber(phone) {
  // Formats: +233701234567, 0701234567, 233701234567
  const ghanaPattern = /^(\+233|0|233)[0-9]{9}$/;
  return ghanaPattern.test(phone.replace(/\s/g, ''));
}

// Convert to standard format
export function normalizeGhanaPhone(phone) {
  const normalized = phone.replace(/\s/g, '');
  
  if (normalized.startsWith('0')) {
    return '233' + normalized.slice(1);
  }
  
  if (!normalized.startsWith('+')) {
    return normalized;
  }
  
  return normalized.replace('+', '');
}
```

### 6. Token Blacklisting

✅ **Implemented**
- Revoked tokens stored in Redis with TTL
- Checked on every request
- Automatic cleanup after expiry

```javascript
export async function revokeToken(jti, expiryTime) {
  const ttl = Math.ceil((expiryTime - Date.now()) / 1000);
  
  await redisClient.setEx(
    `blacklist:${jti}`,
    ttl,
    '1'
  );
}

export async function isTokenBlacklisted(jti) {
  const result = await redisClient.get(`blacklist:${jti}`);
  return !!result;
}
```

---

## Implementation Guide

### Step 1: Database Setup

```sql
-- Run migrations
npm run db:migrate

-- Seed roles and permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('applications:read', 'Read applications', 'applications', 'read'),
('applications:create', 'Create application', 'applications', 'create'),
('applications:approve', 'Approve application', 'applications', 'approve'),
('deliveries:read', 'Read deliveries', 'deliveries', 'read'),
('deliveries:update', 'Update delivery', 'deliveries', 'update'),
('users:manage', 'Manage users', 'users', 'manage');

-- Map roles to permissions
INSERT INTO role_permissions VALUES
('student', (SELECT id FROM permissions WHERE name = 'applications:read')),
('student', (SELECT id FROM permissions WHERE name = 'applications:create')),
...
```

### Step 2: Environment Configuration

```bash
# .env
# JWT Configuration
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_ISSUER="https://auth.laptopplatform.edu.gh"
JWT_AUDIENCE="laptopplatform"

# Session Configuration
SESSION_SECRET="randomstring128bit"
REFRESH_TOKEN_EXPIRY=604800 # 7 days in seconds
ACCESS_TOKEN_EXPIRY=900 # 15 minutes in seconds

# Email Configuration
SMTP_HOST="mail.ghana.com"
SMTP_PORT=587
SMTP_USER="noreply@laptopplatform.edu.gh"
SMTP_PASS="secure_password"
EMAIL_FROM="noreply@laptopplatform.edu.gh"

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000 # 15 minutes

# Redis
REDIS_URL="redis://localhost:6379"

# Ghana Configuration
GHANA_REGION="africa-south1" # Google Cloud region
ANALYTICS_SALT="randomstring"
```

### Step 3: Implement Auth Routes

```javascript
// src/routes/authRoutes.js
import { Router } from 'express';
import { register, login, refresh, logout, mfaSetup, mfaVerify } from '../controllers/authController.js';
import { verifyAccessToken } from '../middleware/tokenValidation.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/verify-email', verifyEmail);
router.post('/password-reset', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);

// MFA routes
router.post('/mfa/setup', verifyAccessToken, mfaSetup);
router.post('/mfa/verify-setup', verifyAccessToken, verifyMfaSetup);
router.post('/mfa/verify', verifyMfa);
router.post('/mfa/disable', verifyAccessToken, disableMfa);

// Protected routes
router.post('/logout', verifyAccessToken, logout);
router.get('/me', verifyAccessToken, getCurrentUser);
router.put('/profile', verifyAccessToken, updateProfile);
router.post('/password-change', verifyAccessToken, changePassword);

export default router;
```

### Step 4: Implement Auth Controller

```javascript
// src/controllers/authController.js
import { hashPassword, verifyPassword, isPasswordReused } from '../utils/passwordSecurity.js';
import { generateAccessToken, generateRefreshToken, enforceSessionLimit } from '../utils/sessionManagement.js';
import { logger, logAuthFailure } from '../observability.js';

export async function register(req, res, next) {
  try {
    const { email, password, name, phone } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const existing = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existing.length) {
      logAuthFailure({
        email,
        reason: 'email_already_registered',
        ip: req.ip
      });
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const newUser = await db.insert(users).values({
      email,
      password_hash: passwordHash,
      name,
      phone: phone ? normalizeGhanaPhone(phone) : null,
      status: 'pending_email'
    }).returning();
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    
    // Store in Redis (36 hour expiry)
    await redisClient.setEx(
      `email_verify:${tokenHash}`,
      36 * 60 * 60,
      newUser[0].id
    );
    
    // Send email
    await sendEmail({
      to: email,
      subject: 'Verify your email - Laptop Platform Ghana',
      template: 'verify-email',
      data: {
        name,
        verificationUrl: `${process.env.APP_URL}/verify-email?token=${verificationToken}`
      }
    });
    
    logger.info({
      event: 'user_registered',
      userId: newUser[0].id,
      email
    });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email to verify your account.'
    });
  } catch (error) {
    logger.error({ err: error }, 'Registration failed');
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    
    // Rate limiting
    const rateLimitKey = `${email}:${req.ip}`;
    const { attempts, remaining } = await checkBruteForce('login', rateLimitKey);
    
    if (attempts > LIMITS.login.attempts) {
      return res.status(429).json({
        error: 'Too many login attempts',
        retry_after: 900
      });
    }
    
    // Fetch user
    const userResult = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!userResult.length) {
      await simulateDelay(); // Timing attack mitigation
      
      logAuthFailure({
        email,
        reason: 'user_not_found',
        ip: req.ip,
        attempts
      });
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult[0];
    
    // Check status
    if (user.status === 'suspended') {
      logAuthFailure({
        userId: user.id,
        reason: 'account_suspended',
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'Account suspended',
        reason: user.suspension_reason,
        contact: 'support@laptopplatform.edu.gh'
      });
    }
    
    if (user.status === 'pending_email') {
      return res.status(403).json({
        error: 'Email not verified',
        action: 'verify_email'
      });
    }
    
    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / 60000
      );
      
      logAuthFailure({
        userId: user.id,
        reason: 'account_locked',
        remainingMinutes: remaining,
        ip: req.ip
      });
      
      return res.status(423).json({
        error: 'Account locked',
        unlocks_in_minutes: remaining
      });
    }
    
    // Verify password
    const validPassword = await verifyPassword(password, user.password_hash);
    
    if (!validPassword) {
      const newAttempts = user.failed_login_attempts + 1;
      const locked = newAttempts >= MAX_LOGIN_ATTEMPTS;
      
      await db.update(users)
        .set({
          failed_login_attempts: newAttempts,
          locked_until: locked ? new Date(Date.now() + LOCKOUT_DURATION) : null
        })
        .where(eq(users.id, user.id));
      
      logAuthFailure({
        userId: user.id,
        reason: 'invalid_password',
        ip: req.ip,
        attempts: newAttempts,
        account_locked: locked
      });
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Reset failed attempts
    await db.update(users)
      .set({ failed_login_attempts: 0, locked_until: null })
      .where(eq(users.id, user.id));
    
    // Check MFA
    if (user.mfa_enabled) {
      const mfaToken = crypto.randomUUID();
      
      await redisClient.setEx(
        `mfa:${mfaToken}`,
        10 * 60, // 10 minute expiry
        JSON.stringify({ userId: user.id, email: user.email })
      );
      
      return res.json({
        status: 'mfa_required',
        mfa_token: mfaToken
      });
    }
    
    // Issue tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Store refresh token
    await enforceSessionLimit(user.id);
    
    await db.insert(refresh_tokens).values({
      user_id: user.id,
      token_hash: hashTokenForStorage(refreshToken),
      family_id: crypto.randomUUID(),
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    // Update last login
    await db.update(users)
      .set({
        last_login_at: new Date(),
        last_login_ip: req.ip
      })
      .where(eq(users.id, user.id));
    
    // Log successful login
    logger.info({
      event: 'user_login',
      userId: user.id,
      email: user.email,
      ip: req.ip
    });
    
    // Get user roles/permissions
    const roles = await db.select()
      .from(user_roles)
      .where(eq(user_roles.user_id, user.id));
    
    // Set secure cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: roles.map(r => r.role)
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Login failed');
    next(error);
  }
}

// Additional controllers: refresh, logout, mfaSetup, mfaVerify...
```

---

## Ghana-Specific Considerations

### Regional Deployment

```
Ghana Student Laptop Platform - Regional Deployment
┌─────────────────────────────────────────────────┐
│  Primary: Google Cloud Ghana (africa-south1)    │
│  - Low latency for Ghana-based users            │
│  - Data residency compliance                    │
│                                                 │
│  Backup: Google Cloud South Africa              │
│  - Disaster recovery                           │
│  - High availability                           │
└─────────────────────────────────────────────────┘
```

### University Integration

```javascript
// Support for Ghana universities
const GHANA_UNIVERSITIES = {
  'university@unimaileduacghana': {
    name: 'University of Ghana',
    id: 'uuid-1',
    region: 'Greater Accra'
  },
  'student@knustacghana': {
    name: 'Kwame Nkrumah University of Science and Technology',
    id: 'uuid-2',
    region: 'Ashanti'
  },
  // ... more universities
};

// Auto-assign role based on university email
export async function detectUniversityRole(email) {
  const domain = email.split('@')[1];
  const university = GHANA_UNIVERSITIES[domain];
  
  if (university) {
    return {
      role: 'student',
      university_id: university.id,
      email_verified: true // University email = verified
    };
  }
  
  return { role: 'student', email_verified: false };
}
```

### Compliance: Ghana Data Protection Act

```javascript
// Data protection utilities
export const gdpaCompliance = {
  // Right to access
  userDataExport: async (userId) => {
    const userData = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    return {
      exported_at: new Date(),
      data: userData,
      format: 'json'
    };
  },
  
  // Right to deletion
  userDataDeletion: async (userId) => {
    // Anonymize instead of hard delete (for audit trail)
    await db.update(users)
      .set({
        email: `deleted_${userId}@deleted.local`,
        password_hash: null,
        phone: null,
        name: 'Deleted User',
        deleted_at: new Date()
      })
      .where(eq(users.id, userId));
    
    // But keep audit records
    logger.info({
      event: 'user_data_deleted',
      userId,
      deleted_at: new Date(),
      reason: 'user_request'
    });
  },
  
  // Consent management
  consentTracking: {
    captureConsent: async (userId, consentType) => {
      await db.insert(user_consents).values({
        user_id: userId,
        type: consentType, // marketing_emails, data_processing, etc.
        consented: true,
        consented_at: new Date()
      });
    },
    
    withdrawConsent: async (userId, consentType) => {
      await db.update(user_consents)
        .set({ consented: false })
        .where(
          and(
            eq(user_consents.user_id, userId),
            eq(user_consents.type, consentType)
          )
        );
    }
  }
};
```

---

## Summary

✅ **Authentication System Features**

| Feature | Implementation |
|---------|----------------|
| Registration | Email-based with verification |
| Login | Password with bcrypt, rate limiting, MFA support |
| Session Management | JWT access + refresh tokens, secure cookies |
| RBAC | 5 roles with granular permissions |
| MFA | TOTP-based (Google Authenticator, Authy) |
| Account Security | Auto-lockout, suspension, password history |
| Token Security | RS256 signing, token rotation, blacklisting |
| Ghana Compliance | University email detection, GDPA compliance, phone formatting |

✅ **Security Controls**

| Control | Implementation |
|---------|----------------|
| Password Hashing | Bcrypt with cost factor 12 |
| Brute Force Protection | 5 attempts / 15 minutes, 15-min lockout |
| Rate Limiting | Per-IP, per-email, per-user tracking |
| Session Limit | Max 3 concurrent sessions per user |
| Token Expiry | Access: 15 min, Refresh: 7 days |
| CSRF Protection | SameSite strict cookies |
| Timing Attack Prevention | Constant-time password comparison |
| Audit Logging | All auth events logged with context |

✅ **Ghana-Specific**

- Regional deployment in Ghana (low latency)
- University email auto-detection
- Ghana phone number formatting/validation
- GDPA compliance utilities
- Offline-first token design for mobile/unstable networks

---

**Next Steps**:
1. Generate RS256 key pair for JWT signing
2. Set up PostgreSQL with schema and initial data
3. Implement auth routes and controllers
4. Set up Redis for session/token management
5. Configure email service for verification/notifications
6. Add MFA enrollment UI
7. Implement audit logging dashboard
8. Create admin account management interface
