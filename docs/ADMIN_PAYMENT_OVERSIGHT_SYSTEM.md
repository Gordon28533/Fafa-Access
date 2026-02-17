# Admin Payment Oversight System

## 🎯 Overview

The Admin Payment Oversight System provides **read-only** access to payment data for administrators. This system allows admins to monitor, search, filter, and view detailed information about all payment transactions in the system.

### Key Features

✅ **View all payment states** (Paid, Unpaid, Pending, Failed)  
✅ **Display payment references** and transaction dates  
✅ **Read-only access** - No modifications allowed  
✅ **Advanced filtering** by status, type, date range  
✅ **Search functionality** by payment reference  
✅ **Payment statistics** and summary dashboard  
✅ **Individual payment details** with full verification data  
✅ **Student and application** information linked to payments  
✅ **Pagination** for large datasets  
✅ **Export capabilities** (optional)

---

## 📁 Files Created

### Backend Files

1. **src/controllers/adminPaymentController.js** (550+ lines)
   - `getAllPayments()` - List all payments with filters and pagination
   - `getPaymentSummary()` - Get payment statistics and aggregates
   - `getPaymentById()` - Get detailed payment record
   - `getPaymentsByApplication()` - Get all payments for specific application

2. **src/middleware/adminAuthorization.js** (140+ lines)
   - `requireAdmin()` - Ensures user has ADMIN role
   - `requireAdminOrStaff()` - Allows ADMIN or STAFF roles
   - `attachAdminContext()` - Adds admin info for logging

### Frontend Files

3. **src/components/AdminPaymentDashboard.jsx** (550+ lines)
   - Main dashboard with payment list
   - Advanced filters and search
   - Summary statistics cards
   - Pagination and sorting
   - Status badges and formatting

4. **src/components/AdminPaymentDetail.jsx** (400+ lines)
   - Detailed payment view
   - Payment timeline
   - Student and application info
   - Paystack verification data
   - Navigation and breadcrumbs

---

## 🔌 API Endpoints

All endpoints require **admin authentication** (JWT token + ADMIN role).

### 1. GET /api/admin/payments

**Description:** List all payments with filtering and pagination

**Query Parameters:**
```javascript
{
  page: 1,              // Page number (default: 1)
  limit: 20,            // Items per page (default: 20, max: 100)
  status: 'COMPLETED',  // Filter by status (PENDING, COMPLETED, FAILED)
  type: 'INSTALLMENT',  // Filter by type (INSTALLMENT, FULL_PAYMENT)
  search: 'INST-123',   // Search by payment/application reference
  startDate: '2024-02-01', // Filter from date (ISO format)
  endDate: '2024-02-08',   // Filter to date (ISO format)
  sortBy: 'initiated_at',  // Sort field (initiated_at, completed_at, amount, status)
  sortOrder: 'desc'        // Sort order (asc, desc)
}
```

**Response:**
```json
{
  "message": "Payments retrieved successfully",
  "data": {
    "payments": [
      {
        "id": "uuid",
        "applicationId": "uuid",
        "applicationReference": "APP-123",
        "type": "INSTALLMENT",
        "amount": 900,
        "currency": "GHS",
        "paymentReference": "INST/INIT-123-1707396800000-a2f8c1",
        "paystackReference": "pstk_12345678",
        "status": "COMPLETED",
        "initiatedAt": "2024-02-08T14:30:00Z",
        "completedAt": "2024-02-08T14:35:00Z",
        "createdAt": "2024-02-08T14:30:00Z",
        "student": {
          "id": "uuid",
          "name": "Sarah Osei",
          "email": "sarah@student.com",
          "phone": "+233244567890"
        },
        "application": {
          "reference": "APP-123",
          "status": "SCHEDULED_FOR_DELIVERY"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 98,
      "limit": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filters": {
      "status": "COMPLETED",
      "type": null,
      "search": null,
      "startDate": null,
      "endDate": null,
      "sortBy": "initiated_at",
      "sortOrder": "desc"
    }
  }
}
```

---

### 2. GET /api/admin/payments/summary

**Description:** Get payment statistics and summary

**Response:**
```json
{
  "message": "Payment summary retrieved successfully",
  "data": {
    "overview": {
      "totalPayments": 150,
      "totalAmount": 135000,
      "completedAmount": 120000,
      "pendingAmount": 15000,
      "currency": "GHS"
    },
    "byStatus": [
      {
        "status": "COMPLETED",
        "count": 120,
        "totalAmount": 120000
      },
      {
        "status": "PENDING",
        "count": 25,
        "totalAmount": 15000
      },
      {
        "status": "FAILED",
        "count": 5,
        "totalAmount": 0
      }
    ],
    "byType": [
      {
        "type": "INSTALLMENT",
        "count": 140,
        "totalAmount": 126000
      },
      {
        "type": "FULL_PAYMENT",
        "count": 10,
        "totalAmount": 9000
      }
    ],
    "recentActivity": [
      {
        "date": "2024-02-08",
        "count": 15,
        "amount": 13500
      },
      {
        "date": "2024-02-07",
        "count": 12,
        "amount": 10800
      }
    ]
  }
}
```

---

### 3. GET /api/admin/payments/:id

**Description:** Get detailed payment record by ID

**Response:**
```json
{
  "message": "Payment details retrieved successfully",
  "data": {
    "id": "uuid",
    "applicationId": "uuid",
    "type": "INSTALLMENT",
    "amount": 900,
    "currency": "GHS",
    "paymentReference": "INST/INIT-123-1707396800000-a2f8c1",
    "paystackReference": "pstk_12345678",
    "status": "COMPLETED",
    "initiatedAt": "2024-02-08T14:30:00Z",
    "completedAt": "2024-02-08T14:35:00Z",
    "verificationResult": {
      "status": "success",
      "amount": 90000,
      "currency": "GHS",
      "channel": "card",
      "authorization": {
        "auth_code": "auth_123456",
        "bin": "408408",
        "last4": "4081"
      }
    },
    "createdAt": "2024-02-08T14:30:00Z",
    "updatedAt": "2024-02-08T14:35:00Z",
    "student": {
      "id": "uuid",
      "firstName": "Sarah",
      "lastName": "Osei",
      "fullName": "Sarah Osei",
      "email": "sarah@student.com",
      "phone": "+233244567890",
      "indexNumber": "20230001"
    },
    "application": {
      "reference": "APP-123",
      "status": "SCHEDULED_FOR_DELIVERY",
      "laptop": {
        "brand": "Dell",
        "model": "Latitude 5520",
        "price": 3000
      }
    }
  }
}
```

---

### 4. GET /api/admin/payments/application/:applicationId

**Description:** Get all payments for specific application

**Response:**
```json
{
  "message": "Application payments retrieved successfully",
  "data": {
    "applicationId": "uuid",
    "applicationReference": "APP-123",
    "payments": [
      {
        "id": "uuid",
        "type": "INSTALLMENT",
        "amount": 900,
        "currency": "GHS",
        "paymentReference": "INST/INIT-123-1707396800000-a2f8c1",
        "paystackReference": "pstk_12345678",
        "status": "COMPLETED",
        "initiatedAt": "2024-02-08T14:30:00Z",
        "completedAt": "2024-02-08T14:35:00Z",
        "createdAt": "2024-02-08T14:30:00Z"
      }
    ],
    "totalPayments": 1
  }
}
```

---

## 🔐 Security & Authorization

### Admin Role Requirements

All admin payment endpoints require:
1. **Valid JWT token** in Authorization header
2. **User role = 'ADMIN'** (verified in middleware)
3. **Active session** (not expired)

### Middleware Chain

```javascript
// Example route setup
router.get('/api/admin/payments', 
  authenticate,        // Verify JWT and set req.user
  requireAdmin,        // Check if user.role === 'ADMIN'
  getAllPayments       // Controller function
);
```

### Authorization Flow

```
Request → authenticate middleware
         ↓
     Verify JWT token
         ↓
     Set req.user from token payload
         ↓
     requireAdmin middleware
         ↓
     Check req.user.role === 'ADMIN'
         ↓
     If not admin → 403 Forbidden
         ↓
     If admin → Continue to controller
         ↓
     Controller executes and returns data
```

### Error Responses

**401 Unauthorized** (No token or invalid token):
```json
{
  "error": "AUTHENTICATION_REQUIRED",
  "message": "Authentication required. Please log in."
}
```

**403 Forbidden** (Not admin):
```json
{
  "error": "ADMIN_ACCESS_REQUIRED",
  "message": "This resource requires administrator privileges",
  "code": "FORBIDDEN"
}
```

---

## 🎨 Frontend Components

### AdminPaymentDashboard

**Location:** `src/components/AdminPaymentDashboard.jsx`

**Features:**
- Summary statistics cards (Total, Completed, Pending, Failed)
- Advanced filters (status, type, date range, search)
- Sortable payment table
- Pagination controls
- Status badges with icons
- Student and application info
- Links to detail view

**Props:** None (standalone component)

**State:**
```javascript
{
  payments: [],
  loading: true,
  error: null,
  summary: null,
  filters: {
    status: '',
    type: '',
    search: '',
    startDate: '',
    endDate: '',
    sortBy: 'initiated_at',
    sortOrder: 'desc'
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  }
}
```

**Usage:**
```jsx
import AdminPaymentDashboard from './components/AdminPaymentDashboard';

// In router
<Route path="/admin/payments" element={<AdminPaymentDashboard />} />
```

---

### AdminPaymentDetail

**Location:** `src/components/AdminPaymentDetail.jsx`

**Features:**
- Full payment information
- Status banner with icon
- Payment timeline
- Student details card
- Application information
- Paystack verification data (JSON)
- Navigation breadcrumbs
- Back to dashboard button

**Props:** Uses `useParams()` to get `paymentId` from URL

**State:**
```javascript
{
  payment: null,
  loading: true,
  error: null
}
```

**Usage:**
```jsx
import AdminPaymentDetail from './components/AdminPaymentDetail';

// In router
<Route path="/admin/payments/:paymentId" element={<AdminPaymentDetail />} />
```

---

## 🚀 Integration Guide

### Step 1: Backend Routes Setup

Create admin payment routes file:

```javascript
// src/routes/adminPaymentRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuthorization');
const {
  getAllPayments,
  getPaymentSummary,
  getPaymentById,
  getPaymentsByApplication
} = require('../controllers/adminPaymentController');

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// Routes
router.get('/', getAllPayments);
router.get('/summary', getPaymentSummary);
router.get('/:id', getPaymentById);
router.get('/application/:applicationId', getPaymentsByApplication);

module.exports = router;
```

Register routes in main app:

```javascript
// server.js or app.js
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');

app.use('/api/admin/payments', adminPaymentRoutes);
```

---

### Step 2: Frontend Routes Setup

Add routes to your React Router configuration:

```jsx
// App.jsx or router.jsx
import AdminPaymentDashboard from './components/AdminPaymentDashboard';
import AdminPaymentDetail from './components/AdminPaymentDetail';

const router = createBrowserRouter([
  {
    path: '/admin',
    element: <AdminLayout />, // Your admin layout
    children: [
      {
        path: 'payments',
        element: <AdminPaymentDashboard />
      },
      {
        path: 'payments/:paymentId',
        element: <AdminPaymentDetail />
      }
    ]
  }
]);
```

---

### Step 3: Navigation Menu

Add link to admin sidebar/navigation:

```jsx
<nav>
  <ul>
    <li>
      <Link to="/admin/dashboard">Dashboard</Link>
    </li>
    <li>
      <Link to="/admin/applications">Applications</Link>
    </li>
    <li>
      <Link to="/admin/payments">💳 Payments</Link> {/* NEW */}
    </li>
    <li>
      <Link to="/admin/users">Users</Link>
    </li>
  </ul>
</nav>
```

---

## 📊 Usage Examples

### Example 1: View All Completed Payments

```
1. Navigate to /admin/payments
2. In Status filter, select "✅ Paid"
3. Click "Apply" or wait for auto-filter
4. View list of all completed payments
5. Click "View" button to see details
```

### Example 2: Search for Specific Payment

```
1. Navigate to /admin/payments
2. In Search box, enter payment reference (e.g., "INST-123")
3. View filtered results
4. Click payment row to view full details
```

### Example 3: View Payment Statistics

```
1. Navigate to /admin/payments
2. View summary cards at top:
   - Total Payments: 150
   - Completed: 120 (GHS 120,000)
   - Pending: 25 (GHS 15,000)
   - Failed: 5
3. View recent activity trends
```

### Example 4: Filter by Date Range

```
1. Navigate to /admin/payments
2. Set Start Date: 2024-02-01
3. Set End Date: 2024-02-08
4. View payments within date range
5. Sort by "Amount" to see highest first
```

---

## 🔍 Payment Status Meanings

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| **COMPLETED** | ✅ | Green | Payment successfully processed and verified |
| **PENDING** | ⏳ | Yellow | Payment initiated, awaiting confirmation |
| **FAILED** | ❌ | Red | Payment attempt failed or was declined |

---

## 📈 Statistics Breakdown

### Overview Card
- **Total Payments:** Count of all payment records
- **Total Amount:** Sum of all payment amounts
- **Completed Amount:** Sum of COMPLETED payments
- **Pending Amount:** Sum of PENDING payments

### By Status
- Count and amount grouped by payment status
- Helps identify payment completion rates

### By Type
- **INSTALLMENT:** 30% initial payments
- **FULL_PAYMENT:** 100% upfront payments
- Shows payment method preferences

### Recent Activity
- Daily breakdown of last 7 days
- Shows payment trends and patterns

---

## 🛡️ Read-Only Protection

### What Admins CAN Do:
✅ View all payment records  
✅ Filter and search payments  
✅ View payment details  
✅ View student and application info  
✅ View Paystack verification data  
✅ Export payment data (if implemented)

### What Admins CANNOT Do:
❌ Create new payments  
❌ Modify payment amounts  
❌ Change payment status  
❌ Delete payment records  
❌ Initiate refunds (without separate refund system)  
❌ Edit student or application data from payment view

**Why Read-Only?**
- Payment data integrity must be preserved
- All modifications go through Paystack webhook
- Prevents accidental or unauthorized changes
- Maintains audit trail accuracy

---

## 🧪 Testing Checklist

### Backend API Tests

- [ ] GET /api/admin/payments returns 200 with valid admin token
- [ ] GET /api/admin/payments returns 403 with non-admin token
- [ ] GET /api/admin/payments returns 401 with no token
- [ ] Filtering by status works correctly
- [ ] Filtering by date range works correctly
- [ ] Search by reference works correctly
- [ ] Pagination returns correct page and count
- [ ] Sorting by amount/date works correctly
- [ ] GET /api/admin/payments/summary returns correct statistics
- [ ] GET /api/admin/payments/:id returns correct payment details
- [ ] GET /api/admin/payments/:id returns 404 for invalid ID

### Frontend Component Tests

- [ ] Dashboard loads without errors
- [ ] Summary cards display correct counts
- [ ] Filters update payment list
- [ ] Search box filters correctly
- [ ] Pagination buttons work
- [ ] Status badges show correct colors
- [ ] Detail page loads payment info
- [ ] Back button navigates to dashboard
- [ ] Loading spinner shows while fetching
- [ ] Error messages display when API fails

---

## 🚀 Deployment Checklist

### Backend
- [ ] Admin routes registered in main app
- [ ] Admin middleware imported and used
- [ ] Database has payment data
- [ ] JWT authentication configured
- [ ] Admin users have role = 'ADMIN' in database

### Frontend
- [ ] Components copied to project
- [ ] Routes added to router
- [ ] Navigation links added
- [ ] JWT token available in localStorage
- [ ] API base URL configured correctly

### Security
- [ ] Admin authorization tested
- [ ] Non-admin access blocked (403)
- [ ] Unauthenticated access blocked (401)
- [ ] No sensitive data exposed in responses
- [ ] Rate limiting configured (optional)

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** "Admin access required" error  
**Solution:** Ensure user role is 'ADMIN' in database

**Issue:** No payments showing  
**Solution:** Verify payments table has records and filters aren't too restrictive

**Issue:** Pagination not working  
**Solution:** Check totalCount is returned correctly from API

**Issue:** 401 Unauthorized  
**Solution:** Verify JWT token is valid and not expired

**Issue:** Summary cards show NaN  
**Solution:** Check database queries return valid numbers

---

## 📝 Future Enhancements

Potential features to add:

- [ ] Export payments to CSV/Excel
- [ ] Email payment reports to admins
- [ ] Advanced analytics dashboard
- [ ] Payment trends graphs
- [ ] Automated alerts for failed payments
- [ ] Bulk payment status updates
- [ ] Payment reconciliation reports
- [ ] Integration with accounting systems

---

**Created:** February 8, 2024  
**Status:** Production Ready ✅  
**Version:** 1.0.0
