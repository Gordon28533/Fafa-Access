# Admin Payment Oversight - Quick Reference

## 🚀 5-Minute Setup

### 1. Backend Setup

**Copy Files:**
```bash
src/controllers/adminPaymentController.js
src/middleware/adminAuthorization.js
```

**Register Routes:**
```javascript
// server.js or app.js
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');
app.use('/api/admin/payments', adminPaymentRoutes);
```

**Create Route File:**
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

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getAllPayments);
router.get('/summary', getPaymentSummary);
router.get('/:id', getPaymentById);
router.get('/application/:applicationId', getPaymentsByApplication);

module.exports = router;
```

---

### 2. Frontend Setup

**Copy Components:**
```bash
src/components/AdminPaymentDashboard.jsx
src/components/AdminPaymentDetail.jsx
```

**Add Routes:**
```jsx
// App.jsx or router
import AdminPaymentDashboard from './components/AdminPaymentDashboard';
import AdminPaymentDetail from './components/AdminPaymentDetail';

// Add to router
{
  path: '/admin/payments',
  element: <AdminPaymentDashboard />
},
{
  path: '/admin/payments/:paymentId',
  element: <AdminPaymentDetail />
}
```

**Add Navigation Link:**
```jsx
<Link to="/admin/payments">💳 Payments</Link>
```

---

### 3. Database Check

**Ensure admin user has role:**
```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'admin@yourdomain.com';
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/payments` | GET | List all payments (paginated) |
| `/api/admin/payments/summary` | GET | Get payment statistics |
| `/api/admin/payments/:id` | GET | Get payment details |
| `/api/admin/payments/application/:id` | GET | Get payments for application |

**All require:** `Authorization: Bearer <admin_jwt_token>`

---

## 🎯 Quick Usage

### View All Payments
```
Navigate to: /admin/payments
See: List of all payments with filters
```

### Filter Completed Payments
```
1. Go to /admin/payments
2. Select "✅ Paid" in Status filter
3. View completed payments only
```

### Search Payment
```
1. Go to /admin/payments
2. Enter reference in Search box
3. View matching payments
```

### View Payment Details
```
1. Go to /admin/payments
2. Click "View" button on any payment
3. See full payment details
```

---

## 📊 Dashboard Features

### Summary Cards
- **Total Payments** - All payment count and amount
- **Completed** (Green) - Successfully paid
- **Pending** (Yellow) - Awaiting confirmation
- **Failed** (Red) - Declined or failed

### Filters
- **Status:** All, Paid, Pending, Failed
- **Type:** All, 30% Installment, Full Payment
- **Search:** Payment reference or application reference
- **Date Range:** Start date to end date
- **Sort By:** Date initiated, Date completed, Amount, Status
- **Order:** Newest first, Oldest first

### Payment Table Columns
1. Status badge (✅ ⏳ ❌)
2. Payment Reference (clickable)
3. Application Reference (link)
4. Student name and email
5. Amount (GHS formatted)
6. Type (30% or Full)
7. Initiated date
8. Completed date
9. View button

---

## 🔐 Security

**Required:**
- JWT token in localStorage
- User role = 'ADMIN'
- Valid session (not expired)

**Responses:**
- `401` - Not authenticated
- `403` - Not admin
- `200` - Success

---

## 🎨 Status Colors

| Status | Badge | Meaning |
|--------|-------|---------|
| COMPLETED | ✅ Green | Payment successful |
| PENDING | ⏳ Yellow | Awaiting confirmation |
| FAILED | ❌ Red | Payment declined |

---

## 📋 Payment Detail View

**Shows:**
1. **Payment Info**
   - Amount, currency, type
   - Payment reference
   - Paystack reference
   - Status badge

2. **Timeline**
   - Initiated date/time
   - Completed date/time (if applicable)
   - Created date
   - Last updated date

3. **Student Info**
   - Full name
   - Email (clickable)
   - Phone (clickable)
   - Index number
   - Student ID

4. **Application Info**
   - Application reference (link)
   - Application status
   - Laptop brand/model
   - Laptop price
   - Payment percentage

5. **Verification Data**
   - Paystack response JSON
   - Authorization details
   - Transaction info

---

## 🛡️ Read-Only Rules

### ✅ What Admins CAN Do:
- View all payments
- Filter and search
- View statistics
- View payment details
- View student info
- View application info

### ❌ What Admins CANNOT Do:
- Create payments
- Modify amounts
- Delete records
- Change status manually
- Edit student data
- Initiate refunds

**Why?** Maintains payment integrity and audit trail.

---

## 🧪 Quick Test

```bash
# 1. Test admin endpoint (replace with your token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3001/api/admin/payments

# Expected: 200 with payment list

# 2. Test non-admin (use student token)
curl -H "Authorization: Bearer STUDENT_TOKEN" \
  http://localhost:3001/api/admin/payments

# Expected: 403 Forbidden

# 3. Test no token
curl http://localhost:3001/api/admin/payments

# Expected: 401 Unauthorized
```

---

## 📈 Common Filters

### Today's Payments
```
Start Date: 2024-02-08
End Date: 2024-02-08
```

### This Week's Completed
```
Status: COMPLETED
Start Date: 2024-02-01
End Date: 2024-02-08
```

### High-Value Payments
```
Sort By: Amount
Order: Newest First
```

### Failed Payments Only
```
Status: FAILED
Sort By: Date Initiated
Order: Newest First
```

---

## 🔄 API Response Examples

### Payment List
```json
{
  "data": {
    "payments": [{ "id": "...", "status": "COMPLETED", ... }],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 98
    }
  }
}
```

### Payment Summary
```json
{
  "data": {
    "overview": {
      "totalPayments": 150,
      "completedAmount": 120000
    },
    "byStatus": [
      { "status": "COMPLETED", "count": 120 }
    ]
  }
}
```

---

## 💡 Pro Tips

1. **Use search for quick lookup** - Enter payment reference directly
2. **Filter by date range** - Find payments in specific period
3. **Sort by amount** - Identify high-value transactions
4. **Export data** - Use browser print to PDF for reports
5. **Refresh regularly** - Click 🔄 button to update data
6. **Bookmark filters** - Browser will remember your last filters

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access dashboard | Check user role is 'ADMIN' |
| No payments showing | Check database has records |
| 401 error | Verify JWT token is valid |
| 403 error | User is not admin |
| Filters not working | Clear filters and try again |
| Pagination stuck | Refresh page |

---

## 📞 Quick Links

- **Dashboard:** `/admin/payments`
- **Payment Detail:** `/admin/payments/:id`
- **API Docs:** See ADMIN_PAYMENT_OVERSIGHT_SYSTEM.md
- **Student Payment:** See STUDENT_PAYMENT_FLOW_FRONTEND.md

---

**Created:** February 8, 2024  
**Quick Reference Version:** 1.0.0  
**For:** Admin Payment Oversight System
