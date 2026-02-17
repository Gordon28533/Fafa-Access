# Change Laptop Feature Implementation

## Overview
Students can now change their laptop choice **before SRC review** starts. This feature allows flexibility for students who want to modify their laptop selection while their application is still pending SRC review.

## Feature Restrictions
- ✅ **Allowed**: Students can change laptop when status is `PENDING_SRC`
- ❌ **Blocked**: Cannot change laptop after SRC review begins or decision is made

## Implementation Details

### Backend Changes

#### 1. Controller Function
**File**: `src/controllers/applicationController.js`

Added `updateApplicationLaptop` function with:
- **Endpoint**: `PATCH /api/applications/:id/laptop`
- **Validation**:
  - Checks if laptopId is provided
  - Verifies application exists
  - Confirms student ownership (studentId matches userId)
  - Enforces status === 'PENDING_SRC' (prevents edits after review)
- **Updates**: Updates laptopId field in applications table

#### 2. Route Configuration
**File**: `src/routes/applicationRoutes.js`

Added route:
```javascript
router.patch(
  '/applications/:id/laptop',
  authenticate,
  requireRole('STUDENT'),
  updateApplicationLaptop
);
```

### Frontend Changes

#### 1. Change Laptop Modal Component
**File**: `src/components/student/ChangeLaptopModal.jsx`

Features:
- **Search**: Filter laptops by brand/model
- **Current Selection**: Shows current laptop choice
- **New Selection**: Preview new laptop before saving
- **Laptop Details**: Display specs (processor, RAM, storage), price, and stock
- **Validation**:
  - Prevents empty selection
  - Prevents selecting the same laptop
  - Shows error messages
- **API Integration**: Calls `PATCH /api/applications/:id/laptop` with authFetch

#### 2. Application Details Modal
**File**: `src/components/status/ApplicationDetailsModal.jsx`

Added:
- `onChangeLaptop` callback prop
- "Change Laptop" button in footer (only visible when status is PENDING_SRC)
- Button styling: Purple theme to distinguish from Edit and Withdraw actions

#### 3. Student Dashboard
**File**: `src/pages/StudentDashboard.jsx`

Added:
- Import for `ChangeLaptopModal`
- State: `isChangeLaptopModalOpen`
- Handler: Opens modal and closes details modal
- Success callback: Refreshes application list after laptop change

## User Flow

1. Student views their application on the dashboard
2. Clicks to view application details
3. If status is `PENDING_SRC`, sees "Change Laptop" button
4. Clicks "Change Laptop" button
5. Modal opens showing:
   - Current laptop selection
   - Search bar to filter laptops
   - List of available laptops with details
6. Student selects a new laptop
7. Clicks "Save Changes"
8. Backend validates:
   - Student owns the application
   - Application status is still PENDING_SRC
   - New laptop is different from current
9. If valid, updates laptopId in database
10. Frontend refreshes application list
11. Student sees updated laptop in their application

## Testing Checklist

### Backend Testing
- [ ] Test with valid laptop change (PENDING_SRC status)
- [ ] Test with invalid status (SRC_APPROVED, ADMIN_APPROVED, etc.)
- [ ] Test with non-existent application
- [ ] Test with application owned by different student
- [ ] Test with missing laptopId in request
- [ ] Test with same laptop selection

### Frontend Testing
- [ ] Open change laptop modal
- [ ] Search for laptops
- [ ] Select new laptop
- [ ] Try to submit without selection
- [ ] Try to submit same laptop
- [ ] Verify successful laptop change updates UI
- [ ] Verify error messages display correctly
- [ ] Test modal close functionality

### Integration Testing
- [ ] Login as student
- [ ] Create new application (status: PENDING_SRC)
- [ ] Change laptop choice successfully
- [ ] Verify updated laptop shows in application details
- [ ] Have SRC review the application
- [ ] Try to change laptop again (should fail)
- [ ] Verify error message explains why change is blocked

## API Endpoint

### PATCH /api/applications/:id/laptop

**Authentication**: Required (STUDENT role)

**Request Body**:
```json
{
  "laptopId": "uuid-of-new-laptop"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Laptop choice updated successfully",
  "data": {
    "laptopId": "uuid-of-new-laptop"
  }
}
```

**Error Responses**:

- **400 Bad Request** (Missing laptopId):
```json
{
  "success": false,
  "message": "Laptop ID is required",
  "errors": ["laptopId is required"]
}
```

- **400 Bad Request** (Already reviewed):
```json
{
  "success": false,
  "message": "Cannot update laptop",
  "errors": ["Application has already been reviewed and cannot be edited"]
}
```

- **403 Forbidden** (Not owner):
```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": ["You can only update your own applications"]
}
```

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Application not found",
  "errors": ["Application does not exist"]
}
```

## Database Schema

No schema changes required. Uses existing `applications` table:
- `laptopId` (UUID): Foreign key to laptops table
- `status` (ENUM): Application status
- `studentId` (UUID): Foreign key to studentProfiles table
- `updatedAt` (TIMESTAMP): Auto-updated on change

## Security

- ✅ JWT authentication required
- ✅ Role-based access (STUDENT only)
- ✅ Ownership validation (student can only update their own applications)
- ✅ Status validation (only PENDING_SRC applications can be edited)
- ✅ Input validation (laptopId required and must be valid)

## Future Enhancements

Potential improvements:
1. Add laptop availability check before saving
2. Show laptop price difference when changing
3. Add confirmation dialog for laptop change
4. Track laptop change history (audit log)
5. Send notification to student when laptop change is successful
6. Allow SRC to see if laptop was changed in application review

## Deployment Notes

1. Both frontend and backend deployed simultaneously
2. No database migrations required
3. No environment variables needed
4. Feature is backward compatible (existing applications unaffected)
5. No downtime required for deployment

---

**Implementation Date**: January 27, 2026  
**Status**: ✅ Complete and Ready for Testing
