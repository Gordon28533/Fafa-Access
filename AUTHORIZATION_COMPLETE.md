# Backend Authorization & Role Enforcement

## Overview
Complete role-based access control (RBAC) system with strict enforcement of:
- JWT authentication on all protected routes
- Role-based authorization (requireRole middleware)
- University-level access control for SRC
- Application ownership verification
- Valid status transition enforcement

---

## Authentication Flow

### 1. User Registration & Login
```javascript
POST /auth/register - Public, rate-limited
  Input: { email, password, fullName, phone, role (optional) }
  Returns: Access token + refresh token
  - Password hashed with bcrypt
  - Email verification token sent
  - Default role: STUDENT (non-admin only)

POST /auth/login - Public, rate-limited  
  Input: { email, password }
  Returns: Access token + refresh token
  - Account status checked (must be ACTIVE)
  - Failed login tracked for lockout
  - Successful login audited

POST /auth/refresh - Public
  Input: Refresh token (from cookie or body)
  Returns: New access token + refresh token (rotated)
  - Old token family invalidated
  - Prevents token compromise

POST /auth/logout - Protected (requires JWT)
  - Revokes refresh token
  - Clears cookie
```

### 2. Token Structure
**Access Token (JWT)**
```
Header: Bearer <jwt>
Stored in: Memory (XSS protection)
Expires: 15 minutes
Contains: userId, email, role, status
```

**Refresh Token**
```
Storage: HttpOnly cookie (CSRF protection)
Expires: 7 days
Rotation: Enabled (familyId tracking)
Compromise Detection: Token chain validation
```

---

## Authorization Layers

### Layer 1: JWT Authentication Middleware
```javascript
// middleware/authMiddleware.js - authenticate()
✅ Validates JWT signature
✅ Checks token expiration
✅ Verifies account status (ACTIVE required)
✅ Attaches user info to req.user
✅ Returns 401 if invalid/missing
```

**Usage:**
```javascript
router.get('/profile', authenticate, controller);
```

### Layer 2: Role-Based Authorization
```javascript
// middleware/authMiddleware.js - requireRole()
✅ Checks req.user.role against allowed roles
✅ Supports multiple allowed roles
✅ Returns 403 if unauthorized
✅ Logs authorization failures
```

**Usage:**
```javascript
router.post('/admin/action', authenticate, requireRole('ADMIN'), controller);
router.get('/src/data', authenticate, requireRole('SRC', 'ADMIN'), controller);
```

### Layer 3: Advanced Authorization
```javascript
// middleware/authorizationMiddleware.js
✅ University-level access (SRC can only see their university)
✅ Resource ownership (Student can only access own applications)
✅ Status transition validation (Prevent invalid state changes)
✅ Role-specific action enforcement (Only ADMIN can approve)
```

**Usage:**
```javascript
router.patch(
  '/:applicationId',
  authenticate,
  verifyApplicationOwnership,
  validateStatusTransition,
  controller
);
```

---

## Protected Routes by Role

### STUDENT Routes (Default Role)
```
✅ POST   /applications              - Create application (STUDENT only)
✅ GET    /applications/my           - View own applications (STUDENT only)
✅ PATCH  /applications/:id          - Update own application (STUDENT only)
✅ POST   /applications/:id/withdraw - Withdraw application (STUDENT only)
✅ GET    /payments/status/my        - View own payment status (STUDENT only)
✅ POST   /payments/paystack/*       - Initiate Paystack payment (STUDENT only)
✅ POST   /support/tickets           - Create support ticket (STUDENT only)
✅ GET    /support/tickets           - View own tickets (STUDENT only)
```

### SRC Routes (University Representatives)
```
✅ GET    /applications/src/pending           - View pending applications for their university
✅ POST   /applications/src/:id/decision      - Approve/reject applications (SRC only)
✅ GET    /revenue/summary                    - View revenue for their university
✅ GET    /revenue/applications               - View per-application commissions
✅ GET    /revenue/payouts                    - View payout history
✅ GET    /commissions/summary                - View commission summary (SRC only)
✅ GET    /commissions/unpaid/:universityId   - View unpaid commissions (SRC only)
✅ GET    /commissions/wallet/:universityId   - View university wallet (SRC only)
✅ GET    /commissions/payouts/:universityId  - View payouts (SRC only)
✅ POST   /support/tickets/:id/replies        - Reply to support tickets
```

**University-Level Enforcement:**
- SRC can only see applications from their university
- SRC can only see revenue/commissions for their university
- Verified via enforceSRCUniversityAccess middleware

### ADMIN Routes (System Administrators)
```
✅ GET    /laptops/all                              - View all laptops
✅ GET    /laptops/summary                          - Inventory summary
✅ POST   /laptops/create                           - Create laptop
✅ PATCH  /laptops/:id                              - Update laptop
✅ DELETE /laptops/:id                              - Delete laptop (deactivate)
✅ POST   /laptops/:id/activate                     - Reactivate laptop
✅ POST   /laptops/:id/adjust-stock                 - Adjust stock

✅ GET    /applications                             - View all applications
✅ GET    /applications/admin/pending               - View pending for approval
✅ POST   /applications/admin/:id/decision          - Approve/reject (ADMIN only)
✅ PATCH  /applications/admin/:id/verify            - Update verification status
✅ PATCH  /applications/admin/:id/laptop            - Assign laptop

✅ POST   /delivery/confirm                         - Confirm delivery
✅ POST   /delivery/confirm-payment                 - Confirm payment

✅ POST   /commissions/mark-paid/:appId             - Mark commission as paid
✅ POST   /commissions/ready                        - Mark ready for payout
✅ GET    /commissions/report                       - View all commissions
✅ POST   /commissions/payout/create                - Create payout batch
✅ POST   /commissions/payout/process/:payoutId     - Process payout

✅ GET    /admin/commissions/earnings               - View earnings per university
✅ POST   /admin/commissions/rate                   - Set commission rate
✅ POST   /admin/commissions/freeze                 - Set payout freeze
✅ GET    /admin/notifications/logs                 - View notification logs
✅ POST   /admin/notifications/resend               - Resend notification
✅ GET    /admin/notifications/metrics              - View notification metrics
```

### DELIVERY Routes (Delivery Staff)
```
✅ POST   /delivery/confirm           - Confirm delivery (DELIVERY only)
✅ POST   /delivery/confirm-payment   - Confirm payment (DELIVERY only)
```

---

## Status Transition Enforcement

### Valid Application Status Transitions
```
PENDING_SRC (Student submits)
    ↓ [SRC decision]
    → APPROVED_SRC (SRC approves)
    → REJECTED_SRC (SRC rejects)
    → WITHDRAWN (Student withdraws)

APPROVED_SRC (Waiting for ADMIN)
    ↓ [ADMIN decision]
    → APPROVED_ADMIN (ADMIN approves)
    → REJECTED_ADMIN (ADMIN rejects)

PENDING_ADMIN (Admin holds for review)
    ↓ [ADMIN decision]
    → APPROVED_ADMIN (ADMIN approves)
    → REJECTED_ADMIN (ADMIN rejects)
    → WITHDRAWN (Student withdraws)

APPROVED_ADMIN (Ready for delivery)
    ↓ [Admin/System action]
    → PENDING_DELIVERY (Assigned to delivery)
    → CANCELLED (Admin cancels)

IN_TRANSIT (Delivery in progress)
    ↓ [Delivery confirms]
    → DELIVERED (Completed)
```

### Server-Side Validation
Implemented via `validateStatusTransition` middleware:
```javascript
req.validateTransition(currentStatus, newStatus, userRole)
// Returns: { valid: true/false, error: string, allowed: [] }
```

Example controller usage:
```javascript
const validation = req.validateTransition(
  application.status,
  newStatus,
  req.user.role
);

if (!validation.valid) {
  return res.status(400).json({
    error: 'Invalid status transition',
    message: validation.error,
    allowedStatuses: validation.allowed
  });
}
```

---

## HTTP Status Codes

### 200 OK
- Successful GET request
- Successful state read operation

### 201 Created
- Successful POST creating new resource

### 400 Bad Request
- Missing required fields
- Invalid status transition
- Malformed request

### 401 Unauthorized
- Missing JWT token
- Expired/invalid token
- Token verification failed

### 403 Forbidden
- Authenticated but insufficient permissions
- User role not allowed for endpoint
- Student accessing other student's data
- SRC accessing different university's data

### 404 Not Found
- Resource doesn't exist
- Application/laptop/user not found

### 423 Locked
- Account temporarily locked (failed login attempts)

### 500 Internal Server Error
- Database error
- Unexpected server error

---

## Middleware Configuration

### On All Protected Routes
```javascript
import { authenticate } from '../middleware/authMiddleware.js';

// Validates JWT, attaches user info
router.get('/endpoint', authenticate, controller);
```

### With Role Requirement
```javascript
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

// Only ADMIN can access
router.post('/admin', authenticate, requireRole('ADMIN'), controller);

// ADMIN or SRC can access
router.get('/data', authenticate, requireRole('SRC', 'ADMIN'), controller);
```

### With Advanced Authorization
```javascript
import {
  authenticate,
  requireRole,
  verifyApplicationOwnership,
  enforceSRCApplicationAccess,
  validateStatusTransition
} from '../middleware/authMiddleware.js';
import { authorizationMiddleware } from '../middleware/authorizationMiddleware.js';

// Student can only update own application
router.patch(
  '/:id',
  authenticate,
  requireRole('STUDENT'),
  verifyApplicationOwnership,
  validateStatusTransition,
  controller
);

// SRC can only access their university's applications
router.get(
  '/src/pending',
  authenticate,
  requireRole('SRC'),
  enforceSRCUniversityAccess,
  controller
);
```

---

## Security Features

### 1. Password Security
- ✅ Bcrypt hashing (12 rounds)
- ✅ No plaintext storage
- ✅ Timing attack mitigation
- ✅ Password reset with expiring tokens

### 2. Token Security
- ✅ JWT with signature verification
- ✅ Token expiration (15 min access, 7 day refresh)
- ✅ HttpOnly cookies (CSRF protection)
- ✅ Secure flag in production
- ✅ SameSite=Lax (dev) / Strict (production)
- ✅ Token rotation with familyId
- ✅ Compromise detection via chain validation

### 3. Account Security
- ✅ Email verification required
- ✅ Account status enforcement (ACTIVE/SUSPENDED/BANNED)
- ✅ Failed login tracking
- ✅ Account lockout (15 min after 5 failed attempts)
- ✅ Login audit logging (IP, user agent, timestamp)

### 4. Authorization Security
- ✅ Role-based access control
- ✅ University-level isolation (SRC)
- ✅ Resource ownership verification
- ✅ Status transition validation
- ✅ Detailed error logging for failed attempts

### 5. Rate Limiting
- ✅ 100 requests per 15 minutes on auth endpoints
- ✅ Prevents brute force attacks

### 6. Future Enhancements
- [ ] Multi-factor authentication (MFA) - infrastructure ready
- [ ] OAuth2 social login
- [ ] API key authentication for services
- [ ] Session revocation across all devices
- [ ] Geolocation-based login alerts

---

## Testing Authorization

### 1. Test Missing Authentication
```bash
curl http://localhost:3000/api/applications
# Expected: 401 Unauthorized
```

### 2. Test Invalid Role
```bash
# Login as STUDENT
curl -H "Authorization: Bearer <student_token>" \
  http://localhost:3000/api/laptops/create
# Expected: 403 Forbidden
```

### 3. Test University-Level Access
```bash
# SRC from University A trying to access University B's data
curl -H "Authorization: Bearer <src_token_a>" \
  http://localhost:3000/api/commissions/wallet/university-b-id
# Expected: 403 Forbidden
```

### 4. Test Resource Ownership
```bash
# Student A trying to access Student B's application
curl -H "Authorization: Bearer <student_a_token>" \
  http://localhost:3000/api/applications/student-b-app-id
# Expected: 403 Forbidden
```

### 5. Test Invalid Status Transition
```bash
# STUDENT trying to directly approve (should be PENDING_SRC -> APPROVED_SRC)
PATCH /api/applications/123 
  Body: { status: 'APPROVED_ADMIN' }
  Role: STUDENT
# Expected: 400 Bad Request with explanation of allowed transitions
```

---

## Deployment Checklist

- [ ] All route files use `authenticate` middleware
- [ ] All admin routes use `requireRole('ADMIN')`
- [ ] All SRC routes use `requireRole('SRC')` or `requireRole('SRC', 'ADMIN')`
- [ ] All student routes use `requireRole('STUDENT')`
- [ ] Database schema has user status enums
- [ ] Refresh token table created with token rotation fields
- [ ] Login audit log table created
- [ ] Environment variables set: JWT_SECRET, NODE_ENV
- [ ] Rate limiter configured (100 req/15min)
- [ ] CORS configured correctly for frontend origin
- [ ] Error responses return proper HTTP status codes (401, 403, etc)
- [ ] Authorization failures are logged

---

## Files Modified

- ✅ `src/middleware/authMiddleware.js` - JWT & role validation
- ✅ `src/middleware/authorizationMiddleware.js` - Advanced access control
- ✅ `src/routes/srcRevenueRoutes.js` - Added requireRole
- ✅ `src/routes/notificationPreferencesRoutes.js` - Added role requirement
- ✅ `src/routes/commissionRoutes.js` - Added role requirements
- ✅ All other routes - Pre-configured with correct authorization

---

## References

- JWT Spec: https://tools.ietf.org/html/rfc7519
- OWASP Authentication: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- RBAC Best Practices: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
