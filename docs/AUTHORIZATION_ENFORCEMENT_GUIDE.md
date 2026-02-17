# Authorization Enforcement Guide

**Comprehensive guide for using authorization helpers to enforce university-level access and status transitions.**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Authorization Helpers Reference](#authorization-helpers-reference)
3. [Usage Examples](#usage-examples)
4. [Route Protection Patterns](#route-protection-patterns)
5. [Status Transition Enforcement](#status-transition-enforcement)
6. [Testing Authorization](#testing-authorization)

---

## Overview

The `authorizationHelpers.js` module provides **strict enforcement** for:

✅ **University-Level Access** - SRC can only access their assigned university  
✅ **Status Transition Validation** - Enforces valid application workflow  
✅ **Ownership Verification** - Students can only access their own applications  
✅ **Role-Based Transitions** - Only authorized roles can trigger status changes  

---

## Authorization Helpers Reference

### 1. `verifySRCUniversityAccess(userId, universityId)`

**Purpose:** Verify SRC officer can access a specific university.

**Parameters:**
- `userId` (string) - User ID of the SRC officer
- `universityId` (string) - University ID to access

**Returns:**
```javascript
{
  allowed: boolean,
  error?: string,
  universityId?: string
}
```

**Example:**
```javascript
const access = await verifySRCUniversityAccess(req.user.userId, req.params.universityId);
if (!access.allowed) {
  return res.status(403).json({ error: access.error });
}
```

---

### 2. `verifyStudentApplicationAccess(studentId, applicationId)`

**Purpose:** Verify student owns the application they're trying to access.

**Parameters:**
- `studentId` (string) - Student profile ID
- `applicationId` (string) - Application ID

**Returns:**
```javascript
{
  allowed: boolean,
  error?: string,
  application?: object
}
```

**Example:**
```javascript
const access = await verifyStudentApplicationAccess(studentProfileId, req.params.id);
if (!access.allowed) {
  return res.status(403).json({ error: access.error });
}
```

---

### 3. `verifySRCApplicationAccess(srcUserId, applicationId)`

**Purpose:** Verify SRC can access an application (must be from their university).

**Parameters:**
- `srcUserId` (string) - User ID of SRC officer
- `applicationId` (string) - Application ID

**Returns:**
```javascript
{
  allowed: boolean,
  error?: string,
  application?: object
}
```

**Example:**
```javascript
const access = await verifySRCApplicationAccess(req.user.userId, req.params.id);
if (!access.allowed) {
  return res.status(403).json({ error: access.error });
}
```

---

### 4. `validateStatusTransition(currentStatus, newStatus, userRole)`

**Purpose:** Validate if a status transition is allowed for the current role.

**Parameters:**
- `currentStatus` (string) - Current application status
- `newStatus` (string) - Desired new status
- `userRole` (string) - Role attempting the transition

**Returns:**
```javascript
{
  valid: boolean,
  error?: string
}
```

**Example:**
```javascript
const validation = validateStatusTransition(
  application.status,
  'SRC_APPROVED',
  req.user.role
);

if (!validation.valid) {
  return res.status(400).json({ error: validation.error });
}
```

---

### 5. `enforceStatusTransition(applicationId, newStatus, userId, userRole)`

**Purpose:** Complete enforcement with validation + database update + audit logging.

**Parameters:**
- `applicationId` (string) - Application ID
- `newStatus` (string) - New status to set
- `userId` (string) - User performing the transition
- `userRole` (string) - Role of the user

**Returns:**
```javascript
{
  success: boolean,
  error?: string,
  application?: object
}
```

**Example:**
```javascript
const result = await enforceStatusTransition(
  req.params.id,
  'SRC_APPROVED',
  req.user.userId,
  req.user.role
);

if (!result.success) {
  return res.status(400).json({ error: result.error });
}

return res.json({ success: true, application: result.application });
```

---

### 6. `requireUniversityAccess()`

**Purpose:** Express middleware to automatically enforce SRC university access.

**Returns:** Express middleware function

**Example:**
```javascript
import { requireUniversityAccess } from '../middleware/authorizationHelpers.js';

router.get(
  '/revenue/:universityId',
  authenticate,
  requireRole('SRC', 'ADMIN'),
  requireUniversityAccess(), // ← Automatically validates university access
  getRevenueByUniversity
);
```

---

### 7. `requireApplicationAccess(accessType)`

**Purpose:** Express middleware to enforce application ownership or university access.

**Parameters:**
- `accessType` (string) - 'student' | 'src' | 'admin'

**Returns:** Express middleware function

**Example:**
```javascript
import { requireApplicationAccess } from '../middleware/authorizationHelpers.js';

// Student accessing their own application
router.get(
  '/:id',
  authenticate,
  requireRole('STUDENT'),
  requireApplicationAccess('student'), // ← Validates ownership
  getApplicationById
);

// SRC accessing application from their university
router.put(
  '/:id/src-decision',
  authenticate,
  requireRole('SRC'),
  requireApplicationAccess('src'), // ← Validates university match
  srcDecision
);
```

---

## Usage Examples

### Example 1: SRC Reviewing Application

**Route:** `PUT /api/applications/:id/src-decision`

```javascript
import { 
  verifySRCApplicationAccess,
  enforceStatusTransition 
} from '../middleware/authorizationHelpers.js';

export const srcDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    // ✅ Step 1: Verify SRC can access this application
    const access = await verifySRCApplicationAccess(req.user.userId, id);
    if (!access.allowed) {
      return res.status(403).json({ error: access.error });
    }

    // ✅ Step 2: Determine new status
    const newStatus = decision === 'approve' ? 'SRC_APPROVED' : 'SRC_REJECTED';

    // ✅ Step 3: Enforce status transition with validation
    const result = await enforceStatusTransition(
      id,
      newStatus,
      req.user.userId,
      req.user.role
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ 
      success: true, 
      message: `Application ${decision}d successfully`,
      application: result.application 
    });
  } catch (error) {
    console.error('SRC decision error:', error);
    return res.status(500).json({ error: 'Decision failed' });
  }
};
```

---

### Example 2: Student Updating Their Application

**Route:** `PATCH /api/applications/:id`

```javascript
import { verifyStudentApplicationAccess } from '../middleware/authorizationHelpers.js';

export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const studentProfileId = req.user.studentProfileId; // From auth context

    // ✅ Step 1: Verify ownership
    const access = await verifyStudentApplicationAccess(studentProfileId, id);
    if (!access.allowed) {
      return res.status(403).json({ error: access.error });
    }

    // ✅ Step 2: Check if application is still editable
    const app = access.application;
    if (app.status !== 'PENDING_SRC') {
      return res.status(400).json({ 
        error: 'Cannot edit application after SRC review has started' 
      });
    }

    // ✅ Step 3: Proceed with update
    const updated = await db.update(applications)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    return res.json({ success: true, application: updated[0] });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Update failed' });
  }
};
```

---

### Example 3: SRC Accessing University Revenue

**Route:** `GET /api/src-revenue/:universityId`

```javascript
import { verifySRCUniversityAccess } from '../middleware/authorizationHelpers.js';

export const getRevenueByUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;

    // ✅ Step 1: Verify SRC can access this university
    const access = await verifySRCUniversityAccess(req.user.userId, universityId);
    if (!access.allowed) {
      return res.status(403).json({ error: access.error });
    }

    // ✅ Step 2: Fetch revenue data (now guaranteed to be their university)
    const revenue = await db.select()
      .from(srcRevenue)
      .where(eq(srcRevenue.universityId, universityId));

    return res.json({ success: true, revenue });
  } catch (error) {
    console.error('Revenue fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch revenue' });
  }
};
```

---

## Route Protection Patterns

### Pattern 1: Middleware-Based Protection

**Use Case:** Automatic enforcement on every request.

```javascript
import { requireApplicationAccess } from '../middleware/authorizationHelpers.js';

// Student routes
router.get('/:id', 
  authenticate, 
  requireRole('STUDENT'),
  requireApplicationAccess('student'), // ← Automatic ownership check
  getApplicationById
);

// SRC routes
router.put('/:id/src-decision',
  authenticate,
  requireRole('SRC'),
  requireApplicationAccess('src'), // ← Automatic university check
  srcDecision
);
```

---

### Pattern 2: Controller-Based Validation

**Use Case:** Custom logic or multiple checks.

```javascript
export const complexOperation = async (req, res) => {
  // Manual checks for complex scenarios
  const accessCheck1 = await verifySRCApplicationAccess(req.user.userId, appId);
  const accessCheck2 = await verifySRCUniversityAccess(req.user.userId, uniId);
  
  if (!accessCheck1.allowed || !accessCheck2.allowed) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Proceed with operation
};
```

---

## Status Transition Enforcement

### Valid Status Flow

```
PENDING_SRC
    ↓
    ├─→ SRC_APPROVED (by SRC/ADMIN)
    │       ↓
    │       ├─→ ADMIN_APPROVED (by ADMIN)
    │       │       ↓
    │       │       └─→ DELIVERY_ASSIGNED (by ADMIN/DELIVERY)
    │       │               ↓
    │       │               └─→ DELIVERED (by DELIVERY/ADMIN)
    │       │                       ↓
    │       │                       └─→ COMPLETED (by ADMIN)
    │       │
    │       └─→ ADMIN_REJECTED (by ADMIN) [DEAD END]
    │
    └─→ SRC_REJECTED (by SRC/ADMIN) [DEAD END]
```

### Enforcing Transitions in Controllers

```javascript
import { enforceStatusTransition } from '../middleware/authorizationHelpers.js';

export const adminApprove = async (req, res) => {
  const result = await enforceStatusTransition(
    req.params.id,
    'ADMIN_APPROVED', // ← Will validate transition is valid
    req.user.userId,
    req.user.role // ← Will check role has permission
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error }); // Auto-rejects invalid transitions
  }

  return res.json({ success: true, application: result.application });
};
```

---

## Testing Authorization

### Test 1: SRC Cannot Access Other Universities

```javascript
// Test: SRC from University A tries to access University B's data
const access = await verifySRCUniversityAccess(srcUserIdA, universityIdB);
assert.equal(access.allowed, false);
assert.equal(access.error, 'Not authorized to access this university');
```

### Test 2: Invalid Status Transition Blocked

```javascript
// Test: Try to skip from PENDING_SRC → DELIVERED
const validation = validateStatusTransition('PENDING_SRC', 'DELIVERED', 'SRC');
assert.equal(validation.valid, false);
assert.include(validation.error, 'Invalid status transition');
```

### Test 3: Student Cannot Access Others' Applications

```javascript
// Test: Student A tries to access Student B's application
const access = await verifyStudentApplicationAccess(studentIdA, appIdB);
assert.equal(access.allowed, false);
assert.equal(access.error, 'Application not found or not owned by this student');
```

---

## Best Practices

✅ **Always validate before operations** - Check access before querying data  
✅ **Use middleware for common patterns** - `requireApplicationAccess()`, `requireUniversityAccess()`  
✅ **Log unauthorized attempts** - All helpers automatically log to audit trail  
✅ **Return proper HTTP codes** - 401 (unauthenticated), 403 (unauthorized), 400 (invalid transition)  
✅ **Use transaction wrappers** - `enforceStatusTransition()` handles DB updates atomically  

---

## Summary

| Helper | Purpose | Returns |
|--------|---------|---------|
| `verifySRCUniversityAccess()` | SRC university validation | `{allowed, error?, universityId?}` |
| `verifyStudentApplicationAccess()` | Student ownership validation | `{allowed, error?, application?}` |
| `verifySRCApplicationAccess()` | SRC application + university validation | `{allowed, error?, application?}` |
| `validateStatusTransition()` | Status transition logic check | `{valid, error?}` |
| `enforceStatusTransition()` | Full transition enforcement + DB update | `{success, error?, application?}` |
| `requireUniversityAccess()` | Express middleware for university routes | Middleware function |
| `requireApplicationAccess()` | Express middleware for application routes | Middleware function |

---

**All critical routes are now protected with strict authorization enforcement.**
