# Frontend-Backend Authorization Consistency Audit

## ✅ Implementation Complete

### **1. Error Handling Improvements**

#### **AuthContext.jsx - Centralized Auth Error Handling**
- ✅ **401 Unauthorized**: Automatic session expiration → Redirect to `/login`
- ✅ **403 Forbidden**: Insufficient permissions → Redirect to `/unauthorized`
- ✅ **authFetch Wrapper**: All API calls use centralized error handling
- ✅ **Session Management**: 30-minute inactivity timeout with auto-logout

```javascript
// AuthContext automatically handles:
if (response.status === 401) {
  handleAuthFailure(); // → /login
}
if (response.status === 403) {
  navigateRef.current('/unauthorized'); // → /unauthorized
}
```

---

### **2. New Utility Modules**

#### **src/utils/errorHandling.js**
Centralized error handling utilities:

- `isAuthError(error)` - Detect 401/403 errors
- `getErrorMessage(error, fallback)` - Extract user-friendly messages
- `shouldDisplayError(error)` - Filter auth errors (handled by redirect)
- `handleApiError(error, setError, fallback)` - Auto-filter auth errors
- `parseValidationErrors(errorResponse)` - Parse backend validation errors
- `parseApiResponse(response)` - Enhanced fetch response parser

**Usage Pattern:**
```javascript
try {
  const data = await apiCall();
} catch (err) {
  handleApiError(err, setError, 'Operation failed');
  // Auth errors won't show (user gets redirected)
  // Business errors show to user
}
```

#### **src/utils/permissions.js**
Frontend permission checking (UI/UX only):

**Application Actions:**
- `canEditApplication(application, user)` - PENDING_SRC only
- `canWithdrawApplication(application, user)` - Before admin approval
- `canMakeSRCDecision(application, user)` - SRC role + PENDING_SRC status
- `canMakeAdminDecision(application, user)` - ADMIN role + SRC_APPROVED status
- `canAssignDelivery(application, user)` - ADMIN role + ADMIN_APPROVED status
- `canConfirmPayment(application, user)` - ADMIN/DELIVERY roles
- `canMarkDelivered(application, user)` - DELIVERY role + PAID status

**Role Checks:**
- `isAdmin(user)`, `isSRC(user)`, `isStudent(user)`, `isDelivery(user)`
- `getUserHomePath(user)` - Role-based home path
- `canPerformAction(action, user)` - Action-based permission check

**Usage Pattern:**
```jsx
{canEditApplication(application, user) && (
  <button onClick={handleEdit}>Edit</button>
)}
```

---

### **3. Updated Components**

#### **StudentDashboard.jsx**
✅ Enhanced error handling:
- Filters auth errors (AuthContext redirects)
- Only shows business rule errors to user
- Applies to: `fetchApplications`, `handleWithdraw`, `handleSaveEdit`

#### **SRCDashboard.jsx**
✅ Enhanced error handling:
- Auth/permission errors trigger redirect
- Business errors logged only
- Backend automatically filters by SRC's university

#### **LaptopInventoryPage.jsx**
✅ Enhanced error handling:
- Filters auth errors from display
- Shows only business errors to user

#### **UnauthorizedPage.jsx**
✅ Uses `getUserHomePath(user)` utility
- Centralized role→path mapping
- Consistent with backend redirects

---

### **4. Authorization Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND REQUEST                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              authFetch() - AuthContext.jsx                  │
│  • Attaches JWT access token                                │
│  • Includes credentials (refresh token cookie)              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND VALIDATION                        │
│  1. authenticate() - Verify JWT                             │
│  2. requireRole() - Check user role                         │
│  3. Business Rules - Validate request                       │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌───────────┐           ┌──────────────┐
        │  SUCCESS  │           │    ERROR     │
        │    200    │           │  401 / 403   │
        └───────────┘           └──────────────┘
                │                       │
                ▼                       ▼
        ┌───────────┐           ┌──────────────────┐
        │  Return   │           │  AuthContext     │
        │   Data    │           │  Intercepts      │
        └───────────┘           └──────────────────┘
                                        │
                            ┌───────────┴───────────┐
                            ▼                       ▼
                    ┌──────────────┐       ┌──────────────┐
                    │ 401: Logout  │       │ 403: Denied  │
                    │ → /login     │       │ → /unauthorized
                    └──────────────┘       └──────────────┘
```

---

### **5. Permission Consistency Matrix**

| Action | Frontend Check | Backend Enforcement | Redirect on Fail |
|--------|---------------|---------------------|------------------|
| **Edit Application** | `canEditApplication()` | `verifyStudentApplicationAccess()` | 403 → /unauthorized |
| **Withdraw Application** | `canWithdrawApplication()` | Ownership + status validation | 403 → /unauthorized |
| **SRC Decision** | `canMakeSRCDecision()` | `requireRole('SRC')` + university check | 403 → /unauthorized |
| **Admin Decision** | `canMakeAdminDecision()` | `requireRole('ADMIN')` + status validation | 403 → /unauthorized |
| **Assign Delivery** | `canAssignDelivery()` | `requireRole('ADMIN')` + business rules | 403 → /unauthorized |
| **Confirm Payment** | `canConfirmPayment()` | `requireRole('ADMIN', 'DELIVERY')` | 403 → /unauthorized |
| **View Application** | `canViewApplication()` | Ownership/university/role check | 403 → /unauthorized |
| **Manage Laptops** | `isAdmin()` | `requireRole('ADMIN')` | 403 → /unauthorized |

---

### **6. Security Best Practices Enforced**

✅ **Never Trust Frontend Checks**
- All frontend permissions are for UI/UX only
- Backend always validates every request
- Frontend checks prevent unnecessary API calls

✅ **Consistent Error Handling**
- Auth errors (401/403) → Automatic redirect
- Business errors → User-friendly messages
- No error information leakage

✅ **Role-Based Access Control**
- Routes protected with `ProtectedRoute` component
- API calls protected with `authenticate` + `requireRole` middleware
- Permission utilities for UI rendering

✅ **Session Security**
- Access tokens in memory (XSS protection)
- Refresh tokens in HttpOnly cookies (CSRF protection)
- 30-minute inactivity timeout
- Automatic token refresh

✅ **University-Level Isolation**
- SRC can only access their university's applications
- Backend enforces via `verifySRCUniversityAccess()`
- Frontend relies on backend filtering

✅ **Application Lifecycle Rules**
- Status transitions validated server-side
- Frontend disables invalid actions
- Business rules enforced in controllers

---

### **7. Testing Checklist**

- [ ] **401 Unauthorized**: Expired token → Redirect to /login
- [ ] **403 Forbidden**: Wrong role → Redirect to /unauthorized
- [ ] **Student Edit**: Can edit PENDING_SRC, cannot edit SRC_APPROVED
- [ ] **Student Withdraw**: Can withdraw before ADMIN_APPROVED
- [ ] **SRC Access**: Can only see their university's applications
- [ ] **SRC Decision**: Can only approve/reject PENDING_SRC
- [ ] **Admin Decision**: Can only approve/reject SRC_APPROVED
- [ ] **Admin Laptop**: Only ADMIN can access /admin/inventory
- [ ] **Delivery Assignment**: Only after ADMIN_APPROVED
- [ ] **Error Display**: Auth errors don't show, business errors do

---

### **8. Migration Guide**

**For Future Components:**

1. **Use authFetch for all API calls:**
```javascript
import { useAuth } from '../hooks/useAuth';
const { authFetch } = useAuth();

const response = await authFetch('/api/endpoint');
```

2. **Handle errors with utility:**
```javascript
import { handleApiError } from '../utils/errorHandling';

try {
  // API call
} catch (err) {
  handleApiError(err, setError, 'Operation failed');
}
```

3. **Check permissions before rendering:**
```javascript
import { canEditApplication } from '../utils/permissions';

{canEditApplication(application, user) && (
  <button>Edit</button>
)}
```

4. **Don't check permissions for navigation:**
- Let `ProtectedRoute` handle route protection
- Let backend handle API authorization
- Frontend checks are UX only

---

## ✅ Summary

**Frontend and backend authorization are now fully aligned:**

1. ✅ All API calls use `authFetch` with centralized error handling
2. ✅ 401/403 errors trigger automatic redirects
3. ✅ Auth errors filtered from user-facing error messages
4. ✅ Permission utilities for consistent UI rendering
5. ✅ Backend always validates (frontend checks are UX only)
6. ✅ Role-based access enforced at route and API level
7. ✅ University-level isolation for SRC officers
8. ✅ Application lifecycle rules validated server-side

**No frontend-only role assumptions remain. All permissions validated by backend.**
