# Paystack Payment Integration - Quick Reference

## ⚡ 5-Minute Setup

### 1. Environment Variables
```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxx
```

### 2. Mount Router
```javascript
import paymentController from './src/controllers/paymentController.js';
app.use('/api/payments', paymentController);
```

### 3. Run Database Migration
```sql
-- Create payments table
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  application_id VARCHAR(255) NOT NULL REFERENCES applications(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  payment_reference VARCHAR(255) UNIQUE NOT NULL,
  paystack_reference VARCHAR(255) UNIQUE,
  paystack_access_code VARCHAR(255),
  status VARCHAR(50) DEFAULT 'PENDING',
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  initiated_by VARCHAR(255),
  completed_at TIMESTAMP,
  verification_result JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 API Quick Reference

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/payments/initialize` | POST | Start payment | ✅ |
| `/payments/verify` | POST | Confirm payment | ✅ |
| `/payments/status/:ref` | GET | Check status | ✅ |
| `/payments/application/:id` | GET | List payments | ✅ |
| `/payments/webhook` | POST | Paystack → You | ❌ |

---

## 💻 Frontend Integration

### Initialize Payment
```javascript
async function initializePayment(applicationId) {
  const response = await fetch('/api/payments/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationId })
  });

  const { data } = await response.json();
  
  // Redirect to Paystack checkout
  if (data.authorizationUrl) {
    window.location.href = data.authorizationUrl;
  }
}
```

### Verify Payment
```javascript
async function verifyPayment(reference) {
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference })
  });

  const { verified, payment } = await response.json();
  
  if (verified) {
    console.log('Payment confirmed:', payment.status);
  }
}
```

---

## 💰 Key Numbers

| Item | Value | Notes |
|------|-------|-------|
| **Installment Rate** | 30% | Of total laptop price |
| **Currency** | GHS | Ghana Cedis |
| **Pesewa Conversion** | ÷ 100 | Paystack uses pesewas |
| **Rounding** | 2 decimals | Math.round(x * 100) / 100 |

**Example:**
- Laptop: **GHS 3,000**
- Installment: **GHS 900** (30%)
- Payment: **90,000 pesewas**

---

## 🔒 Security Essentials

✅ **Backend-Only Initialization**
```javascript
// NEVER pass secret key to frontend
// Only use in PaystackService.js
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
```

✅ **Server-Side Verification**
```javascript
// Always verify amounts on backend
const verification = await verifyPayment(paystackRef);
if (verification.amount !== expectedAmount) {
  return error('Amount mismatch');
}
```

✅ **Webhook Signature Check**
```javascript
// Verify signature before processing
const signature = req.headers['x-paystack-signature'];
if (!verifyWebhookSignature(rawBody, signature)) {
  return error('Invalid signature');
}
```

✅ **Duplicate Prevention**
```javascript
// No duplicate payments allowed
const existing = await db.select().from(payments)
  .where(and(
    eq(payments.application_id, appId),
    eq(payments.status, 'COMPLETED')
  ));

if (existing.length > 0) {
  return error('Already paid');
}
```

---

## 📊 Common Queries

### Get payment status
```javascript
const payment = await db.query.payments
  .findFirst({ where: eq(payments.payment_reference, ref) });

console.log(payment.status); // PENDING, COMPLETED, FAILED
```

### Check if application paid
```javascript
const hasPaid = await db.query.payments
  .findFirst({ 
    where: and(
      eq(payments.application_id, appId),
      eq(payments.status, 'COMPLETED')
    )
  });

if (hasPaid) console.log('Payment completed');
```

### Get all payments for report
```javascript
const allPayments = await db.query.payments
  .findMany({ where: eq(payments.status, 'COMPLETED') });

const total = allPayments.reduce((sum, p) => sum + p.amount, 0);
console.log(`Total collected: GHS ${total}`);
```

---

## 🧪 Test Endpoints

### Initialize (POST)
```bash
curl -X POST http://localhost:3000/api/payments/initialize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationId": "app_123"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "reference": "INST/INIT-APP123456-...",
    "amount": 250.50,
    "currency": "GHS"
  }
}
```

### Verify (POST)
```bash
curl -X POST http://localhost:3000/api/payments/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reference": "INST/INIT-APP123456-..."}'
```

Response:
```json
{
  "success": true,
  "verified": true,
  "payment": {
    "status": "COMPLETED",
    "amount": 250.50,
    "currency": "GHS"
  }
}
```

### Check Status (GET)
```bash
curl http://localhost:3000/api/payments/status/INST/INIT-APP123456-... \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Error Handling

### Application Not Approved
```json
{
  "success": false,
  "error": "Only approved applications can make installment payments",
  "currentStatus": "PENDING"
}
```

### Already Paid
```json
{
  "success": false,
  "error": "Installment payment already completed for this application",
  "paymentReference": "INST/INIT-APP123456-..."
}
```

### Verification Failed
```json
{
  "success": false,
  "error": "Payment verification failed",
  "reason": "abandoned"
}
```

### Amount Mismatch
```json
{
  "success": false,
  "error": "Payment amount mismatch"
}
```

---

## 🔗 Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/controllers/paymentController.js` | REST API endpoints | 350+ |
| `PAYSTACK_INTEGRATION_COMPLETE.md` | Full documentation | 600+ |
| `PAYSTACK_QUICK_REFERENCE.md` | This file | 300+ |

---

## 📞 Key Services

### PaystackService.js (Already Exists)
```javascript
import {
  initializePayment,      // Start payment
  verifyPayment,          // Confirm payment
  generatePaymentReference, // Create unique ID
  calculateInstallmentAmount, // 30% calc
  verifyWebhookSignature, // Validate webhook
  getPaymentStatus,       // Query status
  refundPayment          // Process refund
} from './services/PaystackService.js';
```

---

## ✨ What's Implemented

✅ Backend-only payment initialization  
✅ Server-side verification  
✅ 30% installment calculation  
✅ GHS currency support  
✅ Duplicate payment prevention  
✅ Payment history recording  
✅ Webhook handler  
✅ Authorization checks  
✅ Amount validation  
✅ Error handling  
✅ Database storage  
✅ Status tracking  

---

## 🚀 Next Steps

1. **Add Paystack keys to .env**
2. **Run database migration**
3. **Mount payment controller**
4. **Configure webhook URL in Paystack dashboard**
5. **Test with test keys**
6. **Switch to live keys for production**

---

## 📚 Related Documentation

- [PAYSTACK_INTEGRATION_COMPLETE.md](PAYSTACK_INTEGRATION_COMPLETE.md) - Full guide
- [src/controllers/paymentController.js](src/controllers/paymentController.js) - Controller code
- [src/services/PaystackService.js](src/services/PaystackService.js) - Service code

---

**Status:** ✅ COMPLETE  
**Last Updated:** 2024-02-08
