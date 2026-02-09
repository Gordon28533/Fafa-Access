# Financial Analytics Quick Reference Guide

**Feature:** Track monetary flows in Ghana Cedis (GHS)  
**Status:** ✅ OPERATIONAL  
**Access:** ADMIN only

---

## 🚀 Quick Start

### 1. Access Financial Analytics

**Dashboard:** Navigate to Admin Analytics Dashboard  
**Section:** Financial Analytics (between SRC Accountability and University Performance)

### 2. API Endpoint

```bash
GET /api/admin/analytics/financial
```

**Headers:**
- `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`
- `Content-Type: application/json`

---

## 📊 Summary Metrics at a Glance

| Metric | Icon | Description | Indicator |
|--------|------|-------------|-----------|
| **Total Revenue** | 💰 | All verified payments (70% + 30%) | Primary KPI |
| **70% Initial** | 📥 | All INITIAL_70 payments collected | Blue |
| **30% Final** | ✅ | All FINAL_30 payments collected | Purple |
| **Outstanding** | ⚠️ | Unpaid 30% from deliveries | Red (critical) |
| **Completion Rate** | 📊 | % of final payments received | Green ≥70% |

---

## 🔍 Query Parameters

### Time Period
```bash
?days=30          # Default: last 30 days
?days=7           # Last week
?days=90          # Last quarter
```
**Range:** 7-90 days

### Filter by University
```bash
?universityId=123e4567-e89b-12d3-a456-426614174000
```

### Filter by Product
```bash
?productId=987e4567-e89b-12d3-a456-426614174001
```

### Combined Filters
```bash
?days=60&universityId=UUID&productId=UUID
```

---

## 💰 Key Financial Calculations

### Total Revenue
```
All payments WHERE status = 'VERIFIED'
= 70% payments + 30% payments
```

### Outstanding Amount
```
FOR EACH delivered laptop:
  IF no 30% payment received:
    outstanding += laptop_price * 0.30
```

### Completion Rate
```
(count of FINAL_30 payments / count of INITIAL_70 payments) × 100
```

### Days Overdue
```
(Current date - Delivery date) in days
```

---

## 📋 Response Structure

### Summary Object
```json
{
  "totalRevenue": 245000.00,        // GHS
  "initial70Total": 171500.00,      // GHS
  "final30Total": 73500.00,         // GHS
  "initial70Percentage": "70.0",    // %
  "final30Percentage": "30.0",      // %
  "totalOutstanding": 25500.00,     // GHS (critical)
  "expected30Outstanding": 28000.00, // GHS (theoretical)
  "unpaidDeliveriesCount": 15,      // count
  "paymentCompletionRate": 72.45,   // %
  "totalPayments": 135,             // count
  "initial70Count": 85,             // count
  "final30Count": 50,               // count
  "currency": "GHS"
}
```

### Unpaid Deliveries Array
```json
[
  {
    "applicationId": "uuid",
    "studentName": "John Mensah",
    "studentEmail": "john@student.edu.gh",
    "universityName": "University of Ghana",
    "laptopBrand": "HP",
    "laptopModel": "Pavilion 15",
    "laptopPrice": 3500.00,
    "outstandingAmount": 1050.00,    // 30% of price
    "deliveredAt": "2026-01-15T10:30:00.000Z",
    "daysOverdue": 24
  }
]
```

### Revenue by University Array
```json
[
  {
    "universityName": "University of Ghana",
    "universityId": "uuid",
    "totalRevenue": 98000.00,
    "initial70": 68600.00,
    "final30": 29400.00,
    "paymentCount": 45
  }
]
```

### Revenue by Product Array
```json
[
  {
    "laptopId": "uuid",
    "brand": "HP",
    "model": "Pavilion 15",
    "totalRevenue": 52500.00,
    "initial70": 36750.00,
    "final30": 15750.00,
    "unitsSold": 15
  }
]
```

---

## 🎯 Common Use Cases

### 1. Check Total Revenue
**Action:** View dashboard summary cards  
**Result:** See total revenue in GHS with payment count

### 2. Find Unpaid Deliveries
**Action:** Scroll to "Unpaid Delivered Laptops" table  
**Result:** See all students with outstanding 30% payments  
**Sort:** By days overdue (descending)

### 3. Compare University Performance
**Action:** Review "Revenue by University" table  
**Result:** See which universities generate most revenue

### 4. Analyze Product Sales
**Action:** Review "Revenue by Product" table  
**Result:** See best-selling laptop models with units sold

### 5. Monitor Payment Completion
**Action:** Check completion rate card  
**Result:** See % of students who completed both payments  
**Healthy:** ≥ 70% (green)  
**Concern:** < 70% (yellow/red)

### 6. Identify Collection Priorities
**Action:** Review unpaid deliveries sorted by days overdue  
**Result:** Focus on deliveries > 14 days (red indicator)

---

## 🚨 Alert Thresholds

### Completion Rate
- **≥ 70%** → ✅ Healthy (green)
- **50-69%** → ⚠️ Moderate (yellow)
- **< 50%** → 🔴 Critical (red)

### Days Overdue
- **0-7 days** → Normal
- **8-14 days** → ⚠️ Follow up (yellow)
- **> 14 days** → 🔴 Urgent (red)

### Outstanding Amount
- Monitor trend over time
- Compare with expected 30% outstanding
- Large discrepancies = systemic issues

---

## 🧪 Testing Commands

### Basic Query (Default)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/analytics/financial
```

### Last 7 Days
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/analytics/financial?days=7
```

### Specific University
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/analytics/financial?universityId=YOUR_UUID"
```

### Specific Product
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/analytics/financial?productId=YOUR_UUID"
```

### Full Filters
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/admin/analytics/financial?days=90&universityId=UUID1&productId=UUID2"
```

---

## 🎨 UI Color Guide

### Summary Cards
- **Green border** → Total Revenue (positive)
- **Blue border** → 70% Initial Payments
- **Purple border** → 30% Final Payments
- **Red border** → Outstanding Amount (alert)
- **Orange border** → Completion Rate

### Table Values
- **Green text** → Revenue amounts (positive)
- **Red text** → Outstanding amounts, overdue days (critical)
- **Yellow text** → Warning states (8-14 days overdue)
- **Standard text** → Normal values

### Status Indicators
- **🔴 Red badge** → Critical/danger (>14 days, violations)
- **⚠️ Yellow badge** → Warning (8-14 days)
- **✅ Green badge** → Success/healthy

---

## 📊 Dashboard Sections

**Order of appearance:**
1. Header with currency badge (GHS)
2. 5 Summary cards (horizontal grid)
3. Unpaid Deliveries table (if any exist)
4. Revenue by University table
5. Revenue by Product table

**Responsive:**
- Desktop: 5-column grid
- Tablet: Single column
- Mobile: Compact tables

---

## 🔒 Security

**Authentication:** JWT token required  
**Authorization:** ADMIN role only  
**Access Control:**
- ✅ Admin: Full access
- ❌ SRC: 403 Forbidden
- ❌ Student: 403 Forbidden
- ❌ Delivery: 403 Forbidden
- ❌ No auth: 401 Unauthorized

**Data Protection:**
- Read-only access
- No data modification endpoints
- Student emails visible (admin privilege)
- Parameterized queries (SQL injection prevention)

---

## 🐛 Troubleshooting

### Issue: No data returned
**Cause:** No verified payments in date range  
**Fix:** Expand date range or check if payments are verified

### Issue: Empty unpaid deliveries
**Cause:** All deliveries have final payments  
**Fix:** This is good! No action needed

### Issue: Completion rate seems low
**Cause:** Many laptops delivered but awaiting final payment  
**Action:** Review unpaid deliveries table for follow-up

### Issue: 401 Unauthorized
**Cause:** Invalid or missing JWT token  
**Fix:** Login again to get fresh token

### Issue: 403 Forbidden
**Cause:** User is not ADMIN  
**Fix:** Use admin account credentials

### Issue: Discrepancy in outstanding amounts
**Cause:** Deliveries without final payments  
**Action:** Compare `totalOutstanding` with `expected30Outstanding`

---

## 📈 Performance

**Expected Response Times:**
- < 500ms for 10,000 payments
- < 300ms for 1,000 unpaid deliveries
- Total endpoint: ~500-800ms

**Optimization:**
- Single query for all payments
- Single query for unpaid deliveries
- In-memory aggregation
- Indexed date columns

---

## 📝 Data Sources

| Table | Purpose |
|-------|---------|
| `payments` | All payment records (verified only) |
| `deliveries` | Delivery status and dates |
| `applications` | Link payments to students/universities |
| `laptops` | Product prices and details |
| `users` | Student names and emails |
| `universities` | University names |

---

## 🔄 Update Frequency

**Real-time:** Data fetched on dashboard load  
**Refresh:** Change time period selector  
**Auto-refresh:** Not implemented (manual refresh)  
**Cache:** No caching (always fresh data)

---

## ✅ Verification Checklist

Before using in production:
- [ ] Verify all payments are marked as VERIFIED
- [ ] Check laptop pricing is accurate in database
- [ ] Test with different time periods
- [ ] Verify university filtering works
- [ ] Verify product filtering works
- [ ] Check completion rate calculations
- [ ] Validate outstanding amount calculations
- [ ] Test responsive design on mobile
- [ ] Verify admin-only access
- [ ] Check performance with large datasets

---

## 📞 Support & Issues

**Documentation:** FINANCIAL_ANALYTICS_COMPLETE.md  
**Endpoint:** `/api/admin/analytics/financial`  
**Controller:** `src/controllers/adminAnalyticsController.js`  
**Component:** `src/pages/FinancialAnalyticsPanel.tsx`  
**Styles:** `src/styles/financial-analytics.css`

---

**Status:** ✅ OPERATIONAL  
**Currency:** Ghana Cedis (GHS)  
**Access Level:** ADMIN only  
**Last Updated:** February 8, 2026

---

*End of Quick Reference Guide*
