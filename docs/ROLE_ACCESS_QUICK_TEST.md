# Role-Based Access Control - Quick Test Guide

This guide helps you quickly verify that role-based routing and access control are working correctly.

---

## ✅ 5-Minute Quick Test

### Test 1: Login with Different Roles

**Expected Behavior:** Each role should redirect to the correct dashboard

| Email | Password | Expected Role | Expected Redirect |
|-------|----------|---------------|-------------------|
| student@test.com | Password123! | STUDENT | `/dashboard` |
| src@test.com | Password123! | SRC | `/src/dashboard` |
| admin@test.com | Password123! | ADMIN | `/admin` |
| delivery@test.com | Password123! | DELIVERY | `/delivery/queue` |

**Steps:**
1. Open browser: http://localhost:5173/login
2. Login with each email above
3. Verify you're redirected to the correct dashboard
4. Check browser console for role logs
5. Logout and try next role

---

### Test 2: URL Spoofing Prevention

**Expected Behavior:** Manually navigating to unauthorized routes should redirect to `/unauthorized`

**As STUDENT:**
1. Login as student@test.com
2. Manually type in URL bar: `http://localhost:5173/admin`
3. **Expected:** Redirect to `/unauthorized`
4. Manually type: `http://localhost:5173/src/dashboard`
5. **Expected:** Redirect to `/unauthorized`
6. Manually type: `http://localhost:5173/delivery/queue`
7. **Expected:** Redirect to `/unauthorized`
8. Manually type: `http://localhost:5173/dashboard`
9. **Expected:** ✅ Success - allowed

**As ADMIN:**
1. Login as admin@test.com
2. Manually type: `http://localhost:5173/admin`
3. **Expected:** ✅ Success - allowed
4. Manually type: `http://localhost:5173/admin/src-invitations`
5. **Expected:** ✅ Success - allowed
6. Manually type: `http://localhost:5173/dashboard` (student route)
7. **Expected:** Redirect to `/unauthorized`

---

### Test 3: API Authorization (Backend)

**Expected Behavior:** Backend should reject unauthorized API requests

**Using Browser DevTools Console:**

```javascript
// 1. Login as STUDENT
// (In login page, check Network tab for login response, copy accessToken)

const studentToken = 'eyJhbGciOi...'; // Paste your actual token here

// 2. Try to access ADMIN endpoint
fetch('http://localhost:3000/api/admin/src/invitations', {
  headers: {
    'Authorization': 'Bearer ' + studentToken,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(console.log);

// Expected Response:
// {
//   success: false,
//   error: "Insufficient permissions",
//   message: "Required role: ADMIN. Your role: STUDENT",
//   requiredRoles: ["ADMIN"],
//   userRole: "STUDENT"
// }
```

---

### Test 4: JWT Role Verification

**Expected Behavior:** JWT token should contain the correct role

**Using Browser DevTools Console:**

```javascript
// After logging in, inspect the JWT token

// 1. Get token from AuthContext (or Network tab)
const token = 'eyJhbGciOi...'; // Your actual JWT

// 2. Decode JWT (base64url decode)
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')
  );
  return JSON.parse(jsonPayload);
}

const decoded = parseJwt(token);
console.log('JWT Payload:', decoded);

// Expected Output:
// {
//   userId: "uuid-here",
//   email: "student@test.com",
//   role: "STUDENT",  // ✅ Role is present
//   status: "ACTIVE",
//   iat: 1707398400,
//   exp: 1707399300,
//   iss: "laptop-platform",
//   aud: "laptop-platform-api"
// }
```

---

### Test 5: ProtectedRoute Guard

**Expected Behavior:** React logs should show route guard enforcement

**Steps:**
1. Open browser DevTools console
2. Login as STUDENT
3. Try to navigate to `/admin`
4. **Expected Console Logs:**
   ```
   [ProtectedRoute] User: student@test.com Role: STUDENT Allowed: ['ADMIN']
   [ProtectedRoute] Access denied. User role: STUDENT, Required: ADMIN.
   ```

---

### Test 6: GuestRoute Guard

**Expected Behavior:** Logged-in users should NOT be able to access login/register pages

**Steps:**
1. Login as any user
2. Manually navigate to: `http://localhost:5173/login`
3. **Expected:** Redirect to your role-specific dashboard
4. Navigate to: `http://localhost:5173/register`
5. **Expected:** Redirect to your role-specific dashboard

---

### Test 7: Token Expiry Handling

**Expected Behavior:** After 15 minutes, token should auto-refresh

**Steps:**
1. Login as any user
2. Wait 15 minutes (or mock the time if possible)
3. Try to access a protected route
4. **Expected:** Token auto-refreshes via refresh token
5. **Alternative:** If refresh fails, redirect to login

---

### Test 8: Multiple Roles on One Endpoint

**Expected Behavior:** Endpoints allowing multiple roles should work for all allowed roles

**Test Endpoint:** `/api/applications/:id`
**Allowed Roles:** STUDENT, SRC, ADMIN

**As STUDENT:**
```javascript
fetch('http://localhost:3000/api/applications/some-uuid', {
  headers: { 'Authorization': 'Bearer ' + studentToken }
})
  .then(res => res.json())
  .then(console.log);

// Expected: 200 OK (if application exists and belongs to student)
```

**As SRC:**
```javascript
fetch('http://localhost:3000/api/applications/some-uuid', {
  headers: { 'Authorization': 'Bearer ' + srcToken }
})
  .then(res => res.json())
  .then(console.log);

// Expected: 200 OK (if application is from SRC's university)
```

**As DELIVERY:**
```javascript
fetch('http://localhost:3000/api/applications/some-uuid', {
  headers: { 'Authorization': 'Bearer ' + deliveryToken }
})
  .then(res => res.json())
  .then(console.log);

// Expected: 403 Forbidden (DELIVERY not allowed)
```

---

## 🔧 Advanced Tests (Optional)

### Test 9: Token Forgery Attempt

**Expected Behavior:** Forged tokens should be rejected

```javascript
// Create a fake JWT
const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWtlIiwicm9sZSI6IkFETUlOIn0.fakesignature';

fetch('http://localhost:3000/api/admin/src/invitations', {
  headers: { 'Authorization': 'Bearer ' + fakeToken }
})
  .then(res => res.json())
  .then(console.log);

// Expected: 401 Unauthorized
// Message: "Invalid or expired token"
```

---

### Test 10: Role Modification Attempt

**Expected Behavior:** Modifying role in browser should NOT grant access

```javascript
// In browser console, try to modify user role
// (This won't work because role comes from JWT, not client state)

// ATTEMPT 1: Modify localStorage
localStorage.setItem('role', 'ADMIN');

// ATTEMPT 2: Modify React state (if accessible)
// (This would only work if you expose setUser, which you shouldn't)

// Then try to access admin route
window.location.href = '/admin';

// Expected: Still redirected to /unauthorized
// Reason: ProtectedRoute reads role from AuthContext (JWT payload), not localStorage
```

---

### Test 11: Concurrent Sessions

**Expected Behavior:** Multiple browser tabs with different roles should maintain separate sessions

**Steps:**
1. Open Tab 1: Login as STUDENT
2. Open Tab 2: Login as ADMIN (in incognito or different browser)
3. In Tab 1: Navigate to `/dashboard` → ✅ Success
4. In Tab 1: Navigate to `/admin` → ❌ Redirect to /unauthorized
5. In Tab 2: Navigate to `/admin` → ✅ Success
6. In Tab 2: Navigate to `/dashboard` → ❌ Redirect to /unauthorized

---

## 📊 Test Results Checklist

Use this checklist to track your test results:

- [ ] **Test 1:** All roles redirect to correct dashboards ✅
- [ ] **Test 2:** URL spoofing prevention works ✅
- [ ] **Test 3:** Backend rejects unauthorized API requests ✅
- [ ] **Test 4:** JWT contains correct role ✅
- [ ] **Test 5:** ProtectedRoute logs access denials ✅
- [ ] **Test 6:** GuestRoute redirects logged-in users ✅
- [ ] **Test 7:** Token auto-refresh works ✅
- [ ] **Test 8:** Multi-role endpoints work correctly ✅
- [ ] **Test 9:** Forged tokens are rejected ✅
- [ ] **Test 10:** Role modification attempts fail ✅
- [ ] **Test 11:** Concurrent sessions maintained ✅

---

## 🚨 What to Do If Tests Fail

### Test 1 Fails (Wrong Redirect)
**Fix:** Check `ROLE_REDIRECT` map in [LoginPage.jsx](src/pages/LoginPage.jsx)

### Test 2 Fails (Not Redirecting)
**Fix:** Verify `ProtectedRoute` is applied to routes in [App.tsx](src/App.tsx)

### Test 3 Fails (Backend Not Enforcing)
**Fix:** Check `requireRole` middleware is applied in route files

### Test 4 Fails (No Role in JWT)
**Fix:** Check `generateAccessToken` in [authService.js](src/services/authService.js)

### Test 5 Fails (No Console Logs)
**Fix:** Ensure DEV mode is enabled (`import.meta.env.DEV`)

### Test 6 Fails (Can Access Login)
**Fix:** Check `GuestRoute` component in [ProtectedRoute.jsx](src/components/auth/ProtectedRoute.jsx)

### Test 7 Fails (Token Not Refreshing)
**Fix:** Check auto-refresh interval in [AuthContext.jsx](src/contexts/AuthContext.jsx)

### Test 8 Fails (Multi-Role Issues)
**Fix:** Verify `requireRole('STUDENT', 'SRC', 'ADMIN')` in route definition

### Test 9 Fails (Forged Token Accepted)
**Fix:** ❌ CRITICAL - Check JWT_SECRET environment variable

### Test 10 Fails (Role Modification Works)
**Fix:** ❌ CRITICAL - Role might be stored in localStorage, should be JWT only

### Test 11 Fails (Sessions Conflicting)
**Fix:** Check cookie scoping and JWT storage

---

## 📞 Support

If all tests pass: **✅ Your role-based access control is working correctly!**

If tests fail: Review the [full audit document](ROLE_BASED_ACCESS_CONTROL_AUDIT.md) for detailed troubleshooting.

---

**Last Updated:** February 8, 2026  
**Quick Test Duration:** ~5 minutes  
**Full Test Duration:** ~15 minutes
