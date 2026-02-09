# Student Payment System - Deployment & Testing Checklist

## 🚀 Pre-Deployment Checklist

### Environment Configuration

#### Frontend (.env.local)
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` set to test key
- [ ] API base URL configured (e.g., `VITE_API_BASE="http://localhost:3001"`)
- [ ] Domain matches callback URLs in Paystack
- [ ] No sensitive keys exposed in frontend code

#### Backend (.env)
- [ ] `PAYSTACK_SECRET_KEY` set (must be SECRET key, not PUBLIC)
- [ ] `PAYSTACK_PUBLIC_KEY` set for verification
- [ ] JWT secret configured and strong
- [ ] Database connection string valid
- [ ] Email service configured (NodeMailer, SendGrid, etc)
- [ ] CORS headers allow frontend domain

### Database Setup

- [ ] PostgreSQL 18.1+ running
- [ ] `payments` table created with schema:
  ```sql
  CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id),
    type VARCHAR(50) NOT NULL DEFAULT 'INSTALLMENT',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    payment_reference VARCHAR(255) UNIQUE NOT NULL,
    paystack_reference VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    verification_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- [ ] Indexes created on application_id, payment_reference, status
- [ ] `applications` table has `status` column
- [ ] Sample test user with APPROVED application created

### File Integration

- [ ] `src/hooks/usePayment.js` copied to project
- [ ] `src/components/PaymentButton.jsx` copied to project
- [ ] `src/components/PaymentVerification.jsx` copied to project
- [ ] `src/components/PaymentStatus.jsx` copied to project
- [ ] `src/utils/paymentHelpers.js` copied to project
- [ ] `src/services/PaymentEligibilityService.js` copied to exists OR created
- [ ] `src/middleware/paymentAuthorization.js` copied or created
- [ ] `src/controllers/paymentController.js` has all 5 endpoints
- [ ] `src/services/PaystackService.js` exists with 7 functions
- [ ] All imports in components use correct paths

### Route Configuration

- [ ] `/payment/success` route added to router
- [ ] `/payment/failed` route added to router
- [ ] Routes NOT behind authentication middleware (they handle their own verification)
- [ ] PaymentVerification component imported in routes
- [ ] Routes use correct component names and props

### Backend API Endpoints

Verify these endpoints are implemented and accessible:

**Payment Endpoints:**
- [ ] `POST /api/payments/initialize`
  - Input: { applicationId, type }
  - Output: { authorizationUrl, reference, amount }
  - Error codes: DUPLICATE_PAYMENT, APPLICATION_NOT_APPROVED, OWNERSHIP_MISMATCH
  
- [ ] `POST /api/payments/verify`
  - Input: { reference }
  - Output: { status, verification details }
  - Handles Paystack redirect verification
  
- [ ] `GET /api/payments/status/:reference`
  - Output: { status, amount, currency, reference }
  - Public endpoint (no auth required for verification)
  
- [ ] `GET /api/payments/application/:id`
  - Output: Payment history for application
  - Requires auth (user must own application)
  
- [ ] `POST /api/payments/webhook`
  - Handles Paystack charge.success events
  - Verifies webhook signature
  - Updates payment status

### Email Configuration

- [ ] `PaymentRequiredTemplate` (or similar) available
- [ ] Email service can send to student's email
- [ ] Email triggered after payment verification
- [ ] Email template contains: amount, reference, date, next steps
- [ ] `TransactionalEmailService` has payment confirmation trigger

### Security Checks

- [ ] JWT token validation on all payment endpoints
- [ ] Application ownership verified (student_id === user.id)
- [ ] Amount validation matches 30% calculation
- [ ] Webhook signature verified with HMAC-SHA512
- [ ] No sensitive data in response headers
- [ ] CORS properly configured
- [ ] SQL injection prevention (using parameterized queries)
- [ ] Rate limiting on payment endpoint (prevent spam)
- [ ] Paystack keys never logged or exposed

---

## 🧪 Testing Scenarios

### Test Environment Setup
- [ ] Backend running locally on http://localhost:3001
- [ ] Frontend running locally on http://localhost:5173 or configured port
- [ ] PostgreSQL with test database
- [ ] Postman or similar tool for API testing
- [ ] Browser DevTools open for debugging

### Paystack Test Credentials
```
PUBLIC KEY: pk_test_2c1f97c9f532918b00f01d99a5e1a6a71f01d99a
SECRET KEY: sk_test_2c1f97c9f532918b00f01d99a5e1a6a71f01d99a (EXAMPLE - USE REAL ONES)

Test Card #1 (Successful):
- Card Number: 4084084084084081
- Expiration: 12/25 (Any future)
- CVV: 123 (Any 3 digits)
- OTP: 123456 (Shown on Paystack checkout)
- Result: Successfully charged

Test Card #2 (Insufficient Funds):
- Card Number: 5531886652142950
- Expiration: 12/25
- CVV: 123
- Result: Declined

Test Card #3 (Card Limit Exceeded):
- Card Number: 5440765954957424
- Expiration: 12/25
- CVV: 123
- Result: Card declined (limit exceeded)
```

### Test Cases

#### Test 1: Happy Path - Successful Payment
```gherkin
Given A student with APPROVED application
And Application price: GHS 3000
When Student clicks "Pay 30% Installment"
Then Button shows "GHS 900.00" (30% calculation)
When Frontend calls POST /api/payments/initialize
Then Response contains authorizationUrl
When Student redirected to Paystack checkout
And Student enters test card 4084084084084081
And Student completes payment
Then Paystack redirects to /payment/success?reference=...
When Frontend calls POST /api/payments/verify
Then Response status = "COMPLETED"
And Database shows payment.status = "COMPLETED"
And Application status = "SCHEDULED_FOR_DELIVERY"
And Email sent to student
Then PaymentVerification shows ✅ Success page
And PaymentStatus shows completed payment (green, bold amount)
```

**Test Script:**
```javascript
// Console test (with real app ID)
const appId = 'YOUR_APPROVED_APP_ID';

// Step 1: Check if button shows
const button = document.querySelector('[data-testid="payment-button"]');
console.log('Button visible:', button !== null);

// Step 2: Click button
button.click();

// Step 3: Monitor network requests
// Check Network tab - should see POST /api/payments/initialize
// With success response containing authorizationUrl

// Step 4: Monitor redirect
// Should see redirect to paystack checkout page
// URL pattern: https://checkout.paystack.com/...

// Step 5: After payment and redirect
// Should see /payment/success?reference=... in URL
// Page shows success confirmation
```

---

#### Test 2: Duplicate Payment Prevention
```gherkin
Given Student already completed payment (status: COMPLETED)
When Student navigates to application
Then PaymentStatus shows completed payment
And PaymentButton is still visible (shows for APPROVED status)
[Frontend should hide button based on payment history]
When Student clicks button (if visible)
Then POST /api/payments/initialize returns 400
And Error code: DUPLICATE_PAYMENT
And Error message: "Already paid"
And Database shows no new payment record
```

**Test Steps:**
```bash
# 1. Create approved application
curl -X POST http://localhost:3001/api/applications \
  -H "Authorization: Bearer TOKEN" \
  -d '{"status":"APPROVED","laptop_price":3000}'

# 2. Create completed payment for app
curl -X POST http://localhost:3001/api/payments \
  -H "Authorization: Bearer TOKEN" \
  -d '{"applicationId":"APP_ID","status":"COMPLETED"}'

# 3. Try to initialize new payment
curl -X POST http://localhost:3001/api/payments/initialize \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationId":"APP_ID","type":"INSTALLMENT"}'

# Expected response: 400 with DUPLICATE_PAYMENT
```

---

#### Test 3: Unapproved Application
```gherkin
Given Student has PENDING application
When Student views application
Then PaymentButton is HIDDEN (not visible)
Then PaymentVerification should show content: "Application Under Review"
When Student manually calls POST /api/payments/initialize (advanced)
Then Response: 400 BAD_REQUEST
And Error code: APPLICATION_NOT_APPROVED
```

---

#### Test 4: Ownership Validation
```gherkin
Given Student A owns Application #123
And Student B is logged in
When Student B tries to access POST /api/payments/initialize for App #123
Then Response: 403 FORBIDDEN
And Error code: OWNERSHIP_MISMATCH
And Database shows no payment created
```

**Test Script:**
```javascript
// Student A flow
const appIdA = 'app-from-student-a';
const tokenA = 'jwt-token-student-a';

// Student B attempts
const tokenB = 'jwt-token-student-b';

fetch('/api/payments/initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${tokenB}`, // Student B's token
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    applicationId: appIdA // But trying to pay for Student A's app
  })
})
// Expected: 403 OWNERSHIP_MISMATCH
```

---

#### Test 5: No JWT Token
```gherkin
Given No JWT token in headers
When Frontend calls POST /api/payments/initialize
Then Response: 401 UNAUTHORIZED
And Error message: "Please log in"
And Frontend redirects to /login
```

---

#### Test 6: Network Error Handling
```gherkin
Given Frontend attempting to initialize payment
When Network fails (disconnect before response)
Then usePayment hook catches error
And error state is set
And PaymentButton shows error alert
And Button is re-enabled (not stuck in loading)
When Student clicks again
Then Can retry payment (normal flow)
```

---

#### Test 7: Paystack Webhook Verification
```gherkin
Given Payment in PENDING status
When Paystack sends charge.success webhook
Then Backend verifies webhook signature (HMAC-SHA512)
When Signature invalid
Then Webhook rejected (400 response)
When Signature valid
Then Payment updated to COMPLETED
And Email sent
And Application status updated
And Webhook acknowledged (200 response)
```

**Test Webhook:**
```javascript
// Using Paystack CLI or Postman to test webhook

// Sample webhook payload
const payload = {
  "event": "charge.success",
  "data": {
    "id": 123456,
    "reference": "INST/INIT-123-1707-...",
    "amount": 90000,
    "currency": "GHS",
    "status": "success",
    "paid_at": "2024-02-08T14:30:00.000Z",
    "customer": {
      "email": "student@example.com"
    },
    "authorization": {
      "auth_code": "auth_123456"
    }
  }
};

// Calculate signature for testing
const signature = crypto
  .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
  .update(JSON.stringify(payload))
  .digest('hex');

// Send webhook
fetch('http://localhost:3001/api/payments/webhook', {
  method: 'POST',
  headers: {
    'x-paystack-signature': signature,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
// Expected: 200 OK
```

---

#### Test 8: Amount Validation
```gherkin
Given Application laptop price: 3000
When Student initiates payment for 30%
Then Amount calculated: GHS 900.00
When Paystack processes: 90000 pesewa ($GHS × 100)
When PaymentVerification validates
Then Amount in verification must match exactly
When Amount doesn't match
Then Payment rejected
And Error: "Amount mismatch"
```

---

#### Test 9: Mobile Responsiveness
```gherkin
When View on iPhone (375px width)
Then PaymentButton displays correctly (full width, readable)
And PaymentVerification page readable (no overflow)
And PaymentStatus table responsive (scrollable or stacked)
When View on iPad (768px width)
Then Layout properly sized with padding
When View on Desktop (1920px width)
Then Maximum width respected, centered
```

**Mobile Testing:**
```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 12 (375px)
4. Test payment flow
5. Verify no horizontal scroll
6. Check touch target sizes (≥44px)
7. Test orientation change
```

---

#### Test 10: Payment Status Display
```gherkin
When Payment status is PENDING
Then PaymentStatus shows: "Payment processing"
And Display color: Yellow
And Info: "Your payment is being verified"

When Payment status is COMPLETED
Then PaymentStatus shows: "Payment Completed"
And Display color: Green
And Amount shown in bold
And Display: "Your laptop delivery is scheduled"

When Payment status is FAILED
Then PaymentStatus shows: "Payment Failed"
And Display color: Red
And Display: "Please try again"
And Show "Retry Payment" button (if eligible)
```

---

### Load Testing

- [ ] Test with 10 simultaneous payment initializations
- [ ] Verify database transactions don't create duplicates
- [ ] Check webhook handling under load
- [ ] Monitor API response times (target: <500ms)

---

### Error Scenario Testing

| Scenario | Expected Behavior | Status |
|----------|-------------------|--------|
| No JWT token | 401 Unauthorized, redirect to login | [ ] |
| Expired JWT | 401 Unauthorized, refresh or login | [ ] |
| Invalid JWT | 401 Unauthorized | [ ] |
| Missing applicationId | 400 Bad Request | [ ] |
| Non-existent application | 404 Not Found | [ ] |
| Wrong student | 403 Ownership Mismatch | [ ] |
| Not approved | 400 Application Not Approved | [ ] |
| Already paid | 400 Duplicate Payment | [ ] |
| Network timeout | Error alert, button re-enabled | [ ] |
| Invalid webhook signature | 400 Rejected | [ ] |
| Paystack API down | Error logged, graceful handling | [ ] |
| Database query fails | 500 Error, logged | [ ] |

---

## 🔍 Debugging Guide

### Common Issues & Solutions

#### Issue: "PaymentButton is not visible"
```
Solution:
1. Check application.status in database = 'APPROVED'
2. Open browser DevTools → Elements
3. Verify PaymentButton component renders
4. Check console for errors in usePayment hook
5. Verify JWT token in localStorage
```

#### Issue: "Button click does nothing"
```
Solution:
1. Check console for JavaScript errors
2. Verify usePayment hook is imported correctly
3. Check if button has onClick handler
4. Verify fetch API is available
5. Check CORS errors in Network tab
```

#### Issue: "Redirect to Paystack fails"
```
Solution:
1. Verify POST /api/payments/initialize succeeds (200)
2. Check response contains authorizationUrl
3. Verify URL format: https://checkout.paystack.com/[CODE]
4. Check Paystack public key is correct
5. Check network requests in DevTools
```

#### Issue: "Payment shows as PENDING after completion"
```
Solution:
1. Check if webhook was received by backend
2. Verify webhook signature verification passes
3. Check database payments table for webhook_data
4. Verify POST /api/payments/verify completes
5. Check if email service triggered
6. Review backend logs for webhook processing errors
```

#### Issue: "PaymentStatus shows old payment"
```
Solution:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear localStorage and reload
3. Verify API endpoint returns latest payment
4. Check database for correct payment record
5. Verify application.status matches payment
```

---

## ✅ Pre-Launch Checklist

### Code Quality
- [ ] All console.log() debugging statements removed
- [ ] No hardcoded API URLs (use env variables)
- [ ] No hardcoded test data in code
- [ ] Error messages are user-friendly
- [ ] Comments explain complex logic
- [ ] No sensitive data in version control

### Performance
- [ ] Page loads in <3 seconds
- [ ] API responses in <500ms
- [ ] No memory leaks (check DevTools)
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] CSS minified

### Accessibility
- [ ] Button has proper aria-label
- [ ] Form inputs have labels
- [ ] Error messages announced
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Mobile touch targets ≥44px

### Browser Compatibility
- [ ] Chrome 90+ ✅
- [ ] Firefox 88+ ✅
- [ ] Safari 14+ ✅
- [ ] Edge 90+ ✅
- [ ] iOS Safari 14+ ✅
- [ ] Android Chrome 90+ ✅

### Documentation
- [ ] README updated with payment feature
- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Troubleshooting guide available
- [ ] Team trained on system

---

## 📊 Monitoring After Deployment

### Metrics to Track
- [ ] Payment success rate (target: >98%)
- [ ] Average time to complete payment
- [ ] API response times (< 500ms)
- [ ] Error rates by type
- [ ] Webhook success rate
- [ ] Failed verifications
- [ ] Customer complaints

### Alerts to Set Up
- [ ] Payment failure rate > 5%
- [ ] API response time > 2s
- [ ] Webhook failures > 10
- [ ] Database errors > 1/hour
- [ ] Email delivery failures

### Review Schedule
- [ ] Daily: Check payment success rate
- [ ] Weekly: Review error logs and failed payments
- [ ] Monthly: Analyze payment metrics and trends
- [ ] Quarterly: Security audit and penetration testing

---

## 🚀 Go-Live Steps

### 24 Hours Before
- [ ] Final full-system test
- [ ] Backup database
- [ ] Notify support team
- [ ] Prepare rollback plan

### During Go-Live
- [ ] Monitor error logs in real-time
- [ ] Watch payment success rate
- [ ] Be available for support
- [ ] Have rollback plan ready

### After Go-Live
- [ ] Send announcement to students
- [ ] Monitor for 24-48 hours closely
- [ ] Collect user feedback
- [ ] Document any issues
- [ ] Schedule post-mortem if issues found

---

**Last Updated:** February 8, 2024  
**Status:** Ready for Deployment Testing
