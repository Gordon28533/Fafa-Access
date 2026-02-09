# Student Payment Flow - Quick Reference

## 🚀 5-Minute Setup

### Install Components
```
✅ src/hooks/usePayment.js
✅ src/components/PaymentButton.jsx
✅ src/components/PaymentVerification.jsx
✅ src/components/PaymentStatus.jsx
✅ src/utils/paymentHelpers.js
```

### Add to Application Detail Page
```jsx
import PaymentButton from '../components/PaymentButton';
import PaymentStatus from '../components/PaymentStatus';

function ApplicationDetailPage() {
  return (
    <>
      {/* Your app details... */}
      
      <PaymentButton 
        applicationId={app.id}
        status={app.status}
        laptopPrice={app.laptop_price}
      />
      <PaymentStatus applicationId={app.id} />
    </>
  );
}
```

### Add Routes
```jsx
import PaymentVerification from './components/PaymentVerification';

const router = createBrowserRouter([
  {
    path: '/applications/:id',
    element: <ApplicationDetailPage />,
  },
  {
    path: '/payment/success',
    element: <PaymentVerification />,
  },
  {
    path: '/payment/failed',
    element: <PaymentVerification failed={true} />,
  },
]);
```

---

## 📱 Component Behavior

### PaymentButton
- **Shows:** Only if `status === 'APPROVED'`
- **Does:** Initiates payment via backend
- **Displays:** Loading spinner, amount (30%), errors
- **Redirects:** To Paystack checkout URL

### PaymentStatus
- **Shows:** Payment history/current status
- **Fetches:** Payment records from backend
- **Displays:** Amount, date, reference, status badge
- **Updates:** Real-time via API

### PaymentVerification
- **Shows:** After Paystack payment
- **Verifies:** Payment with backend
- **Displays:** Success/failure confirmation
- **Routes:** `/payment/success?reference=...` or `/payment/failed`

---

## 🎣 usePayment Hook

```javascript
const {
  initializing,      // boolean
  verifying,         // boolean
  error,             // object | null
  paymentData,       // object | null
  initiatePayment,   // (appId) → Promise
  verifyPayment,     // (ref) → Promise
  getPaymentStatus,  // (ref) → Promise
  clearError,        // () → void
  clearPaymentData,  // () → void
} = usePayment();
```

### Usage Example
```javascript
const handlePay = async () => {
  const result = await initiatePayment(applicationId);
  if (!result.success) {
    showError(result.error);
  }
  // If success, user redirected to Paystack
};
```

---

## 🛡️ Security

✅ **JWT Auth:** Auto-included in all API calls  
✅ **Backend Validates:**
- Application exists
- Status is APPROVED
- Student owns app
- No duplicate payment

✅ **Safe Redirects:** Only to Paystack authorized_url  
✅ **Amount Verification:** Backend checks Paystack response  

---

## 💥 Error Scenarios

| Scenario | Shows | Error |
|----------|-------|-------|
| Not Approved | Hide button | N/A |
| Wrong Student | 403 Error | "Not authorized" |
| Already Paid | Error alert | "Already completed" with ref |
| Network Error | Error alert | "Please try again" |
| Payment Failed | Failed page | "Payment cancelled" |

---

## 🧪 Test Card

Use this for testing:
```
Card: 4084084084084081
Exp: 12/25
CVV: 123
```

---

## 📊 Payment Flow Summary

```
User Clicks "Pay Now"
    ↓
usePayment.initiatePayment(appId)
    ↓
POST /api/payments/initialize
    ↓
Backend validates eligibility
    ↓
Backend creates payment record (PENDING)
    ↓
Frontend redirected to Paystack checkout
    ↓
User completes payment on Paystack
    ↓
Paystack redirects to /payment/success
    ↓
PaymentVerification verifies with backend
    ↓
POST /api/payments/verify
    ↓
Backend updates payment to COMPLETED
    ↓
Show success page
```

---

## 📁 Files by Purpose

| File | Purpose |
|------|---------|
| `usePayment.js` | API calls (initialize, verify, status) |
| `PaymentButton.jsx` | Display button, initiate payment |
| `PaymentVerification.jsx` | Verify payment after Paystack |
| `PaymentStatus.jsx` | Show payment history/status |
| `paymentHelpers.js` | Formatting, calculations, utilities |

---

## 🔗 API Endpoints Used

```
POST /api/payments/initialize
  Body: { applicationId }
  Returns: { authorizationUrl, reference, amount }

POST /api/payments/verify
  Body: { reference }
  Returns: { verified, payment, status }

GET /api/payments/application/:id
  Returns: [ { amount, status, reference } ]

GET /api/payments/status/:reference
  Returns: { status, amount, completedAt }
```

---

## ✨ Key Features

✅ Show payment button only if eligible  
✅ Call backend to initialize payment  
✅ Redirect to Paystack hosted page  
✅ Handle success and failure redirects  
✅ Verify payment after return  
✅ Show loading states  
✅ Display helpful errors  
✅ Mobile-responsive  
✅ Accessible (ARIA labels)  
✅ Secure (JWT + backend validation)  

---

## 🚀 Deployment Checklist

- [ ] All 5 files copied to project
- [ ] Integrated into ApplicationDetailPage
- [ ] Routes added to router
- [ ] Backend running with payment endpoints
- [ ] JWT token stored in localStorage
- [ ] Test with approved application
- [ ] Verify error handling
- [ ] Mobile test completed
- [ ] Success/failure pages display correctly
- [ ] Email confirmations sent

---

## 💡 Tips

1. **JWT Token:** Must be in `localStorage.getItem('token')`
2. **Bootstrap Required:** Components use Bootstrap classes
3. **Error Messages:** Parsed from backend response with codes
4. **Redirect:** Automatic to Paystack if eligible
5. **Loading:** Spinner shown during verification

---

**Status:** ✅ READY TO USE  
**Last Updated:** February 8, 2024
