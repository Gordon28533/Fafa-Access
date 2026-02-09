# Student Payment Flow - Real-World Examples

## 🎯 Complete End-to-End Payment Flows

### Example 1: Happy Path - Student Completes Payment

**Student:** Sarah (ID: 123)  
**Application:** APPROVED, Laptop Price: GHS 3000  
**Payment Required:** GHS 900 (30%)

```
┌─────────────────────────────────────────────────────────┐
│ Sarah opens her approved application                     │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend renders:                                        │
│ - Application details (status: APPROVED)                 │
│ - Laptop info (price: GHS 3000)                          │
│ - PaymentButton (VISIBLE because status === APPROVED)    │
│ - PaymentStatus (shows: No payment yet)                  │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Sarah clicks "💳 Pay 30% Installment" (GHS 900.00)      │
└─────────────────────────────────────────────────────────┘
         ↓
        API CALL: POST /api/payments/initialize
├─ Request Body:
│  {
│    "applicationId": 123,
│    "type": "INSTALLMENT"
│  }
├─ Backend execution:
│  1. Check JWT token (valid ✓)
│  2. Load application (exists & belongs to Sarah ✓)
│  3. Check eligibility:
│     - Application status === APPROVED ✓
│     - No COMPLETED payment exists ✓
│     - Student owns application ✓
│     - Application approved ✓
│  4. Calculate amount: GHS 3000 * 0.30 = GHS 900.00 ✓
│  5. Generate reference: INST/INIT-123-1707396800000-a2f8c1
│  6. Create payment record (PENDING)
│  7. Call Paystack:
│     - POST https://api.paystack.co/transaction/initialize
│     - email: sarah@student.com
│     - amount: 90000 (pesewa)
│     - reference: INST/INIT-123-1707396800000-a2f8c1
│     - metadata: { applicationId: 123, type: INSTALLMENT }
│  8. Return: authorizationUrl + amount + reference
└─ Response 200:
   {
     "message": "Payment initialization successful",
     "data": {
       "authorizationUrl": "https://checkout.paystack.com/abcd1234",
       "accessCode": "abcd1234",
       "reference": "INST/INIT-123-1707396800000-a2f8c1",
       "amount": 90000,
       "currency": "GHS"
     }
   }
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend redirects Sarah to Paystack checkout page       │
│ window.location.href = authorizationUrl                  │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Paystack hosted checkout page loads                      │
│ Shows:                                                   │
│ - Invoice: Reference, amount (GHS 900), description      │
│ - Payment methods (card, mobile money, etc)              │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Sarah enters test card details:                          │
│ - Number: 4084084084084081                               │
│ - Expires: Any future date (e.g., 12/25)                │
│ - CVV: Any 3 digits (e.g., 123)                          │
│ - OTP: 123456 (shown on checkout page)                   │
└─────────────────────────────────────────────────────────┘
         ↓
        PAYSTACK WEBHOOK (Backend receives)
├─ Event: charge.success
├─ Payload contains:
│  {
│    "reference": "INST/INIT-123-1707396800000-a2f8c1",
│    "amount": 90000,
│    "currency": "GHS",
│    "customer": { email: "sarah@student.com" },
│    "authorization": { auth_code: "auth_123456" },
│    "channel": "card",
│    "status": "success"
│  }
├─ Backend processing:
│  1. Verify signature (HMAC-SHA512) ✓
│  2. Fetch transaction from Paystack ✓
│  3. Validate amount matches (90000 pesewa = GHS 900) ✓
│  4. Update payment record:
│     - Set verification_result = webhook payload
│     - Status remains PENDING (waiting for manual verify)
└─ Response: 200 OK to acknowledge receipt
         ↓
┌─────────────────────────────────────────────────────────┐
│ Paystack redirects Sarah to success redirect URL:        │
│ /payment/success?reference=INST/INIT-123-...            │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend loads PaymentVerification component             │
│ Shows: Loading spinner with "Verifying payment..."       │
└─────────────────────────────────────────────────────────┘
         ↓
        API CALL: POST /api/payments/verify
├─ Request:
│  {
│    "reference": "INST/INIT-123-1707396800000-a2f8c1"
│  }
├─ Backend execution:
│  1. Load payment record (PENDING status)
│  2. Get Paystack transaction:
│     - GET https://api.paystack.co/transaction/verify/:reference
│     - Returns: { status: "success", ... }
│  3. Validate transaction:
│     - Status is "success" ✓
│     - Amount matches (90000 pesewa) ✓
│     - Email matches student ✓
│     - Reference matches ✓
│  4. Update payment to COMPLETED
│     - Set completed_at = now
│     - Set paystack_reference = pstk_12345678
│  5. Update application status:
│     - Set to SCHEDULED_FOR_DELIVERY (from APPROVED)
│  6. Trigger email:
│     - Send paymentRequired template → paymentConfirmation
│     - Include: reference, amount, next steps
└─ Response 200:
   {
     "message": "Payment verified successfully",
     "data": {
       "status": "COMPLETED",
       "amount": 900,
       "currency": "GHS",
       "reference": "INST/INIT-123-...",
       "verification": {
         "amount": 90000,
         "currency": "GHS",
         "channel": "card",
         "auth_code": "auth_123456"
       },
       "nextSteps": "Your laptop will be delivered soon. You will receive a separate delivery schedule."
     }
   }
         ↓
┌─────────────────────────────────────────────────────────┐
│ PaymentVerification displays success page:               │
│ ✅ Payment Confirmed!                                    │
│                                                          │
│ Amount Paid: GHS 900.00                                  │
│ Reference: INST/INIT-123-1707396800000-a2f8c1          │
│ Date: Feb 8, 2024 at 2:30 PM                            │
│ Payment Method: Mastercard                              │
│ Status: Completed ✅                                    │
│                                                          │
│ Next Steps:                                             │
│ Your laptop delivery is scheduled. You will receive      │
│ more details via email shortly.                          │
│                                                          │
│ A confirmation email has been sent to sarah@student.com  │
│                                                          │
│ [View Applications] [Go to Dashboard]                    │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Sarah receives confirmation email:                       │
│ "Your payment of GHS 900.00 has been received!"         │
│ Reference, details, and delivery schedule info           │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Sarah reopens application:                               │
│ - Status now: SCHEDULED_FOR_DELIVERY                    │
│ - PaymentStatus shows: ✅ Payment Completed (GHS 900) │
│ - PaymentButton hidden (no longer needed)                │
└─────────────────────────────────────────────────────────┘
```

---

## ❌ Example 2: Error Path - Student Already Paid

**Student:** James (ID: 456)  
**Application:** APPROVED with COMPLETED payment  
**Previous Payment:** GHS 900 (COMPLETED on Feb 1)

```
┌─────────────────────────────────────────────────────────┐
│ James views his approved application                    │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend checks:                                         │
│ - Application status: APPROVED ✓                         │
│ - PaymentButton visibility: APPROVED === APPROVED ✓     │
│ - Button is shown to James                              │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ James clicks "💳 Pay 30% Installment" (GHS 900.00)      │
└─────────────────────────────────────────────────────────┘
         ↓
        API CALL: POST /api/payments/initialize
├─ Backend validation:
│  1. Check JWT (valid) ✓
│  2. Load application (456 belongs to James) ✓
│  3. Check PaymentEligibilityService:
│     ❌ checkPaymentEligibility() returns:
│        {
│          "eligible": false,
│          "reason": "DUPLICATE_PAYMENT",
│          "details": {
│            "message": "A completed payment already exists for this application",
│            "existingPayment": {
│              "amount": 900,
│              "reference": "INST/INIT-456-1707120000000-b1a3f2",
│              "status": "COMPLETED",
│              "completedAt": "2024-02-01T10:30:00Z"
│            }
│          }
│        }
└─ Response 400 Bad Request:
   {
     "error": "PAYMENT_NOT_ELIGIBLE",
     "code": "DUPLICATE_PAYMENT",
     "message": "You have already made a payment for this application",
     "details": {
       "existingReference": "INST/INIT-456-1707120000000-b1a3f2",
       "existingAmount": 900,
       "completedDate": "2024-02-01T10:30:00Z"
     }
   }
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend catches error and shows alert:                  │
│                                                          │
│ ⚠️ Payment Already Completed                            │
│                                                          │
│ "You have already made a payment of GHS 900.00 for      │
│ this application on Feb 1, 2024.                        │
│                                                          │
│ Your application is now scheduled for delivery.         │
│ You cannot make another payment."                        │
│                                                          │
│ [Dismiss]                                               │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ PaymentStatus component still shows:                     │
│ ✅ Completed Payment                                    │
│ GHS 900.00 (bold)                                       │
│ Payment Ref: INST/INIT-456-1707120000000-b1a3f2        │
│ Date: Feb 1, 2024                                       │
│ Status: Completed ✅                                    │
│ Next: Delivery will be scheduled soon                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔓 Example 3: Security Error - Wrong Student Tries to Pay

**Student A:** Ama (ID: 789)  
**Ama's JWT Token:** Valid, belongs to user 789  
**Application:** Belongs to student ID 456  
**Attempt:** Ama tries to pay for someone else's application

```
        API CALL: POST /api/payments/initialize
        URL: /api/payments/initialize
        Body: { applicationId: 456 }
        Header: Authorization: Bearer (Ama's token - user 789)
├─ Backend execution:
│  1. Decode JWT (valid, user: 789) ✓
│  2. Load application 456
│  3. Check application.student_id (456) vs req.user.id (789)
│  ❌ OWNERSHIP_MISMATCH: 456 !== 789
│  4. Call rejectPaymentInitiation():
│     Error code: OWNERSHIP_MISMATCH
│     Message: "You are not authorized to make payment for this application"
└─ Response 403 Forbidden:
   {
     "error": "PAYMENT_AUTHORIZATION_FAILED",
     "code": "OWNERSHIP_MISMATCH",
     "message": "You are not authorized to make payment for this application",
     "statusCode": 403
   }
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend shows error alert:                              │
│                                                          │
│ ❌ Not Authorized                                       │
│                                                          │
│ "You do not have permission to make a payment for       │
│ this application. Only the applicant can proceed."      │
│                                                          │
│ [Dismiss]                                               │
└─────────────────────────────────────────────────────────┘
```

---

## ⏳ Example 4: Pending Approval - Student Tries to Pay

**Student:** Kwame (ID: 789)  
**Application:** PENDING (still under review)  
**Attempt:** Kwame clicks payment button

```
┌─────────────────────────────────────────────────────────┐
│ Kwame views his PENDING application                     │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend rendering logic:                                │
│ - application.status: PENDING                            │
│ - PaymentButton visible?: (status === APPROVED) → false  │
│ - PaymentButton is HIDDEN ✓                             │
│ - User cannot click button                              │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Kwame sees alert instead:                                │
│                                                          │
│ ⏳ Application Under Review                            │
│                                                          │
│ "Your application is currently being reviewed.          │
│ Payment options will be available once approved."        │
│                                                          │
│ No payment action available until status changes        │
└─────────────────────────────────────────────────────────┘

[IF Kwame manually calls API via console (advanced attack)]
        API CALL: POST /api/payments/initialize
        Body: { applicationId: 789 }
├─ Backend validation:
│  1. Check JWT (valid) ✓
│  2. Load application (exists) ✓
│  3. Check PaymentEligibilityService:
│     ❌ Application status is PENDING (not APPROVED)
│     Returns: {
│       "eligible": false,
│       "reason": "APPLICATION_NOT_APPROVED",
│       "details": {
│         "message": "Application must be approved before payment",
│         "currentStatus": "PENDING"
│       }
│     }
└─ Response 400 Bad Request:
   {
     "error": "PAYMENT_NOT_ELIGIBLE",
     "code": "APPLICATION_NOT_APPROVED",
     "message": "Your application must be approved before you can make a payment"
   }
```

---

## 📉 Example 5: Network Error - Connection Lost During Payment

**Scenario:**  
Student clicks button, network drops before Paystack initialization completes

```
┌─────────────────────────────────────────────────────────┐
│ Student clicks "💳 Pay 30% Installment"                │
│ Button enters loading state (disabled, spinner shown)    │
└─────────────────────────────────────────────────────────┘
         ↓
        API CALL IN PROGRESS
        POST /api/payments/initialize
        (Network connection drops) ❌
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend usePayment hook:                                │
│ - Fetch fails with "Network error" or "Timeout"         │
│ - catch block triggered                                  │
│ - Error set to state.error                              │
│ - initializing = false                                  │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend PaymentButton displays error:                   │
│                                                          │
│ ❌ Payment Initialization Failed                        │
│                                                          │
│ "Unable to connect to payment service. Please check     │
│ your internet connection and try again."                │
│                                                          │
│ Button re-enabled: "💳 Pay 30% Installment"            │
│                                                          │
│ [Dismiss]                                               │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Backend safely handled it:                               │
│ - If payment record was created (status PENDING)        │
│ - Student can retry and it will find the existing one   │
│ - OR create a new one if retry takes long time          │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Student reconnects and retries:                          │
│ - Network restored                                       │
│ - Click button again                                     │
│ - New initialization attempt (or finds existing)         │
│ - Continues normal flow                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚫 Example 6: Missing JWT Token

**Scenario:** Student's session expired or token removed

```
        API CALL: POST /api/payments/initialize
        Header: Authorization: (missing or invalid)
├─ Backend middleware checks auth:
│  - No Bearer token found
│  - Token invalid or expired
│  ❌ JWT verification fails
└─ Response 401 Unauthorized:
   {
     "error": "AUTHENTICATION_REQUIRED",
     "message": "Please log in to proceed with payment"
   }
         ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend receives 401 and redirects:                     │
│ window.location.href = '/login'                         │
│                                                          │
│ OR shows modal: "Session Expired"                        │
│ "Please log in again to continue"                        │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ Student logs in again                                    │
│ New JWT token stored in localStorage                     │
│ Payment process can now proceed                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 Example 7: Paystack Processes Payment Successfully

**What happens in Paystack backend:**

```
Paystack Checkout Page
└─ Student enters card details
   └─ Card verification process
      ├─ Bin validation
      ├─ Amount check
      ├─ OTP/3DSecure (if needed)
      └─ Authorization
         ├─ Card processor (Visa/Mastercard) approval
         └─ Funds reserved
            └─ Webhook sent: charge.success
               └─ Our backend receives:
                  {
                    "event": "charge.success",
                    "data": {
                      "id": 123456,
                      "reference": "INST/INIT-123-...",
                      "amount": 90000,
                      "currency": "GHS",
                      "customer": {
                        "email": "sarah@student.com",
                        "name": "Sarah Osei"
                      },
                      "authorization": {
                        "auth_code": "auth_123456",
                        "bin": "408408",
                        "last4": "4081",
                        "exp_month": 12,
                        "exp_year": 25,
                        "channel": "card",
                        "card_type": "debit"
                      },
                      "channel": "card",
                      "status": "success",
                      "paid_at": "2024-02-08T14:30:45.000Z"
                    }
                  }
               └─ Our webhook handler:
                  1. Verify webhook signature ✓
                  2. Save verification data
                  3. Update payment record
                  4. Return 200 OK
               └─ Paystack marks as received
                  └─ Returns customer to /payment/success
```

---

## 📊 Example 8: Database State After Successful Payment

**Before Payment:**
```sql
-- applications table
id   | reference | status   | student_id | laptop_price
123  | APP-123   | APPROVED | 789        | 3000.00

-- payments table (empty for this app)
(no records)
```

**During Payment (Pending):**
```sql
-- applications table (unchanged)
id   | reference | status   | student_id | laptop_price
123  | APP-123   | APPROVED | 789        | 3000.00

-- payments table
id  | application_id | type          | amount | currency | payment_reference           | paystack_reference | status  | initiated_at         | completed_at
1   | 123            | INSTALLMENT   | 900    | GHS      | INST/INIT-123-1707-a2f8c1 | NULL               | PENDING | 2024-02-08T14:25:00 | NULL
```

**After Successful Verification:**
```sql
-- applications table (UPDATED)
id   | reference | status                   | student_id | laptop_price
123  | APP-123   | SCHEDULED_FOR_DELIVERY   | 789        | 3000.00

-- payments table (UPDATED)
id  | application_id | type          | amount | currency | payment_reference           | paystack_reference | status    | initiated_at         | completed_at         | verification_result
1   | 123            | INSTALLMENT   | 900    | GHS      | INST/INIT-123-1707-a2f8c1 | pstk_12345678    | COMPLETED | 2024-02-08T14:25:00 | 2024-02-08T14:32:15 | {...webhook payload...}

-- email_logs table (NEW)
id | recipient | template_name | subject        | application_reference | sent_at
10 | sarah@... | paymentConfirm| Payment Confir...| APP-123               | 2024-02-08T14:32:15
```

---

## 🔍 Amount Calculation Formula

```javascript
// Frontend and Backend MUST use same calculation
function calculateInstallmentAmount(laptopPrice) {
  // 30% of laptop price, rounded to 2 decimals
  return Math.round(laptopPrice * 0.30 * 100) / 100;
}

// Examples:
calculateInstallmentAmount(3000)    // = 900.00
calculateInstallmentAmount(2500)    // = 750.00
calculateInstallmentAmount(3333.33) // = 1000.00
calculateInstallmentAmount(1)       // = 0.30
calculateInstallmentAmount(999.99)  // = 300.00 (= 299.997 → rounded)

// Paystack conversion (GHS to pesewa)
const pesewa = Math.round(ghsAmount * 100);
// Examples:
900.00 GHS → 90000 pesewa
750.00 GHS → 75000 pesewa
0.30 GHS → 30 pesewa
```

---

## ✅ Verification Checklist

After implementing, verify:

- [ ] Button shows only for APPROVED applications
- [ ] Button calculates 30% correctly
- [ ] Authorization URL redirects to Paystack
- [ ] Payment records created in PENDING status
- [ ] Webhook processes charge.success events
- [ ] Verification updates to COMPLETED status
- [ ] Application status changes to SCHEDULED_FOR_DELIVERY
- [ ] Email confirmations sent
- [ ] PaymentStatus shows completed payment
- [ ] Duplicate payment prevention works
- [ ] Ownership validation works
- [ ] Error messages are user-friendly
- [ ] Network errors handled gracefully
- [ ] JWT validation works
- [ ] Mobile responsive design confirmed

---

**Last Updated:** February 8, 2024  
**Status:** Ready for Reference
