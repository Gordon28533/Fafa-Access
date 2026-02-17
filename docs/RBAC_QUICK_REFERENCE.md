# RBAC Quick Reference Guide

## Overview
This application enforces strict role-based access control (RBAC) at multiple layers to ensure users can only access resources appropriate to their assigned role.

## User Roles

| Role | Description | Home Route |
|------|-------------|------------|
| `STUDENT` | Regular students applying for laptops | `/dashboard` |
| `SRC` | Student Representative Council - Reviews applications | `/src/dashboard` |
| `ADMIN` | System administrators - Final approval authority | `/admin` |
| `DELIVERY` | Delivery personnel - Manages laptop deliveries | `/delivery/queue` |

## Access Control Flow

```
Request → Frontend ProtectedRoute → Backend authenticate → Backend requireRole → Controller Validation → Response
```

### Layer 1: Frontend Route Protection
**File:** `src/components/auth/ProtectedRoute.jsx`

```jsx
<ProtectedRoute allowedRoles={["STUDENT"]}>
  <StudentDashboard />
</ProtectedRoute>
```

- Checks if user is authenticated
- Validates user role matches allowed roles
- Redirects to login if not authenticated
- Redirects to role home if unauthorized

### Layer 2: Backend Authentication
**File:** `src/middleware/authMiddleware.js`

```javascript
router.get('/api/some-route', authenticate, requireRole('STUDENT'), handler);
```

**authenticate middleware:**
- Verifies JWT token
- Checks account status is ACTIVE
- Returns 401 if no/invalid token
- Returns 403 if account not active

**requireRole middleware:**
- Validates user role
- Returns 403 if role not allowed
- Logs all authorization failures

### Layer 3: Controller Validation
**Pattern:** Always validate ownership in controllers

```javascript
// ✅ CORRECT - Validates ownership
const applications = await db
  .select()
  .from(applications)
  .where(and(
    eq(applications.id, requestedId),
    eq(applications.studentId, authenticatedStudentId)
  ));

// ❌ WRONG - No ownership check
const application = await db
  .select()
  .from(applications)
  .where(eq(applications.id, requestedId));
```

## HTTP Status Codes

| Code | Meaning | Scenario | Frontend Action |
|------|---------|----------|-----------------|
| 200 | OK | Successful request | Display data |
| 201 | Created | Resource created successfully | Show success message |
| 400 | Bad Request | Invalid input data | Show validation errors |
| 401 | Unauthorized | No/invalid/expired token | Redirect to login |
| 403 | Forbidden | Valid token but wrong role | Redirect to /unauthorized |
| 404 | Not Found | Resource doesn't exist OR no access | Show not found (prevents info disclosure) |
| 500 | Server Error | Unexpected error | Show error message |

## Common Patterns

### Protecting a New Backend Route

```javascript
// 1. Import middleware
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

// 2. Apply to route
router.get(
  '/api/my-route',
  authenticate,              // Step 1: Verify JWT
  requireRole('STUDENT'),    // Step 2: Check role
  myController              // Step 3: Execute
);

// 3. Validate in controller
export const myController = async (req, res) => {
  const userId = req.user.userId;  // From authenticate middleware
  const userRole = req.user.role;  // From authenticate middleware
  
  // Additional validation here
  if (resource.ownerId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
};
```

### Protecting a New Frontend Route

```tsx
// In App.tsx
import MyPage from './pages/MyPage';

<Route 
  path="/my-page" 
  element={
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <Layout><MyPage /></Layout>
    </ProtectedRoute>
  } 
/>
```

### Making Authenticated API Calls

```javascript
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { authFetch } = useAuth();
  
  const fetchData = async () => {
    try {
      const response = await authFetch('/api/my-endpoint');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const data = await response.json();
      // Use data
    } catch (error) {
      // Error handling - authFetch handles 401/403 automatically
      console.error(error.message);
    }
  };
};
```

## Error Messages

### Backend Error Response Format

```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "Access denied. Required role: ADMIN. Your role: STUDENT",
  "requiredRoles": ["ADMIN"],
  "userRole": "STUDENT"
}
```

### Frontend Error Handling

The `authFetch` function in AuthContext automatically:
- **401:** Redirects to `/login` with "Session expired" message
- **403:** Redirects to `/unauthorized` page
- Other errors: Throws error for component to handle

## Navigation by Role

**Student Navigation:**
- My Applications
- Profile & Settings
- Security
- Notifications
- Support

**SRC Navigation:**
- SRC Review

**Admin Navigation:**
- Admin

**Delivery Navigation:**
- Delivery Queue

## Security Best Practices

### ✅ DO
1. Always use `authenticate` before `requireRole`
2. Validate data ownership in controllers
3. Use specific role requirements (not wildcard)
4. Log all authorization failures
5. Return same error for "not found" and "no access" (prevents info disclosure)
6. Normalize roles to uppercase
7. Check account status (ACTIVE only)

### ❌ DON'T
1. Skip authentication middleware on protected routes
2. Trust frontend validation alone
3. Expose different errors for "exists but no access" vs "doesn't exist"
4. Allow admin bypass in ProtectedRoute
5. Use role checks in frontend only
6. Forget to validate ownership in shared routes

## Testing RBAC

### Manual Testing Checklist

- [ ] Login as STUDENT → Can access /dashboard
- [ ] Login as STUDENT → Cannot access /admin (redirects)
- [ ] Login as STUDENT → Cannot access /src/dashboard (redirects)
- [ ] Login as SRC → Can access /src/dashboard
- [ ] Login as SRC → Cannot access /dashboard (redirects)
- [ ] Login as ADMIN → Can access /admin
- [ ] No login → Cannot access /dashboard (redirects to login)
- [ ] Expired token → Redirects to login on API call
- [ ] Wrong role for API → Returns 403 and redirects to /unauthorized
- [ ] Student A → Cannot view Student B's application
- [ ] Student → Cannot approve own application
- [ ] SRC → Can view pending applications
- [ ] ADMIN → Can view all applications

## Troubleshooting

### Issue: "Access Denied" on valid route
**Check:**
1. User role matches `allowedRoles` in ProtectedRoute
2. Backend route has correct `requireRole(...)`
3. Role is normalized (uppercase)
4. Account status is ACTIVE

### Issue: "Session expired" message
**Check:**
1. Access token not expired (15 min)
2. Refresh token valid (30 days)
3. Token in localStorage/cookies
4. CORS allowing credentials

### Issue: 403 on API call
**Check:**
1. Route has correct `requireRole(...)`
2. User role matches required role
3. Not trying to access other user's data
4. Account status is ACTIVE

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/middleware/authMiddleware.js` | Backend auth & role middleware |
| `src/components/auth/ProtectedRoute.jsx` | Frontend route protection |
| `src/contexts/AuthContext.jsx` | Auth state & authFetch |
| `src/pages/UnauthorizedPage.jsx` | 403 error page |
| `src/routes/*.js` | Route definitions with middleware |
| `src/controllers/*.js` | Business logic with validation |

## Support

For security issues or questions about RBAC implementation, refer to:
- [RBAC_SECURITY_AUDIT.md](./RBAC_SECURITY_AUDIT.md) - Comprehensive security audit
- Backend logs - All auth failures logged with details
- Frontend console - Dev mode shows auth flow logging

---

**Last Updated:** January 27, 2026  
**Security Status:** ✅ Production-Ready
