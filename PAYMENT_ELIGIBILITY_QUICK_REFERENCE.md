# Payment Eligibility - Quick Reference

## ✅ Four Core Rules

### 1️⃣ Application Must Exist
- Database query returns results
- **Error:** `APPLICATION_NOT_FOUND` (404)

### 2️⃣ Application Must Be APPROVED
- `application.status === 'APPROVED'`
- Cannot be: PENDING, REJECTED, DELIVERED, etc.
- **Error:** `APPLICATION_NOT_APPROVED` (400)

### 3️⃣ Student Must Own Application  
- `application.student_id === req.user.id`
- Verified from JWT token
- **Error:** `OWNERSHIP_MISMATCH` (403)

### 4️⃣ No Duplicate Payments
- No existing payment with `status === 'COMPLETED'`
- Previous FAILED/CANCELLED payments don't block
- **Error:** `DUPLICATE_PAYMENT` (400)

---

## 🔑 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| **PaymentEligibilityService.js** | Core eligibility logic | 250+ |
| **paymentAuthorization.js** | Express middleware | 100+ |
| **paymentController.js** | REST API endpoints | 350+ |

---

## 📡 HTTP Responses

### ✅ All Checks Pass
```javascript
POST /api/payments/initialize
Status: 200 OK
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "reference": "INST/INIT-APP123456-..."
  }
}
```

### ❌ Rule #1 Fails: No Application
```javascript
Status: 404 Not Found
{
  "success": false,
  "error": "Application not found",
  "code": "APPLICATION_NOT_FOUND"
}
```

### ❌ Rule #2 Fails: Not Approved
```javascript
Status: 400 Bad Request
{
  "success": false,
  "error": "Application must be APPROVED to pay. Current status: PENDING",
  "code": "APPLICATION_NOT_APPROVED",
  "currentStatus": "PENDING"
}
```

### ❌ Rule #3 Fails: Wrong Student
```javascript
Status: 403 Forbidden
{
  "success": false,
  "error": "Not authorized to pay for this application",
  "code": "OWNERSHIP_MISMATCH"
}
```

### ❌ Rule #4 Fails: Already Paid
```javascript
Status: 400 Bad Request
{
  "success": false,
  "error": "Installment payment already completed for this application",
  "code": "DUPLICATE_PAYMENT",
  "existingPayment": {
    "reference": "INST/INIT-APP123456-...",
    "amount": 250.50,
    "completedAt": "2024-02-08T10:30:00Z"
  }
}
```

---

## 🛡️ Security Focus

✅ **Prevents:**
- Paying for non-existent applications
- Paying for unapproved applications  
- Paying for others' applications
- Double-charging for same installment
- Unauthorized access to payments

✅ **Validates:**
- JWT token (authenticate middleware)
- Student ownership (database check)
- Application status (database check)
- Payment history (database query)

---

## 🔍 Eligibility Checking Flow

```
Student clicks "Pay Now"
        ↓
POST /api/payments/initialize {applicationId}
        ↓
authenticate() - Validate JWT, get req.user.id
        ↓
checkPaymentEligibility(applicationId, req.user.id)
        ├─ App exists? YES/NO
        ├─ App approved? YES/NO  
        ├─ Student owns app? YES/NO
        └─ No duplicate payment? YES/NO
        ↓
All checks passed?
├─ NO → Return error + stop
└─ YES → Proceed to Paystack initialization
        ↓
Create payment record (PENDING)
        ↓
Return authorization URL
```

---

## 🧪 Test It

### Using curl
```bash
# Check eligibility by attempting payment
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"applicationId": "app_test"}'

# Error if app not approved:
# 400 Bad Request
# "Application must be APPROVED to pay. Current status: PENDING"
```

### Using JavaScript
```javascript
import { checkPaymentEligibility } from './services/PaymentEligibilityService.js';

const result = await checkPaymentEligibility('app_123', 'student_456');

if (result.eligible) {
  // Safe to process payment
} else {
  // Show error to user
  console.error(result.error);
  console.error(result.code);
}
```

---

## 📋 Eligibility Checklist

For payment to be allowed:

- [ ] Application ID must exist in database
- [ ] Application status must be `'APPROVED'` (exactly)
- [ ] Student ID from JWT must match `application.student_id`
- [ ] No previous payment with status `'COMPLETED'` for this application

---

## 🔗 Related Rules

### Verification Eligibility (when student confirms payment)

In addition to above, also verify:
- Payment exists
- Payment is `PENDING` (not COMPLETED, FAILED, CANCELLED)
- Cannot verify same payment twice

---

## ⚠️ Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "Application not found" | Wrong app ID | Check application ID format |
| "Must be APPROVED to pay" | App still pending | Wait for approval |
| "Not authorized" | Wrong student | Use correct student token |
| "Already completed" | Already paid once | Show existing payment |

---

## 📞 Debugging

### Enable debug logging
```javascript
// In PaymentEligibilityService.js
console.log('[PaymentEligibility] Check result:', {
  applicationId,
  studentId,
  result: eligibility,
  timestamp: new Date(),
});
```

### Check database directly
```sql
-- Check application status
SELECT id, status, student_id FROM applications WHERE id = 'app_123';

-- Check for existing payments
SELECT * FROM payments 
WHERE application_id = 'app_123' 
  AND type = 'INSTALLMENT' 
  AND status = 'COMPLETED';
```

---

## 🚀 Integration

### Mount eligibility checks in Express
```javascript
import paymentController from './controllers/paymentController.js';
app.use('/api/payments', paymentController);

// paymentController already has eligibility checks built-in
```

### Or use middleware separately
```javascript
import { checkPaymentEligibilityMiddleware } from './middleware/paymentAuthorization.js';

router.post('/payments/initialize', 
  authenticate,
  checkPaymentEligibilityMiddleware,
  myPaymentHandler
);
```

---

**Status:** ✅ ENFORCED  
**Security Level:** PRODUCTION-READY  
**Last Updated:** February 8, 2024
