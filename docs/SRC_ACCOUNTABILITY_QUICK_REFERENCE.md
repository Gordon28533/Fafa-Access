# SRC Accountability Quick Reference

**Feature:** Track SRC performance and identify delays  
**Status:** ✅ COMPLETE & RUNNING  
**Access Level:** ADMIN only

---

## 🚀 Quick Start

### 1. Server Running
```bash
npm run server
# Server: http://localhost:3000
```

### 2. Get Admin Token
```bash
# Login as admin
POST http://localhost:3000/api/auth/login
{
  "email": "admin@example.com",
  "password": "your-password"
}

# Response includes: { token: "eyJhbGc..." }
```

### 3. Test SRC Accountability Endpoint
```bash
# Replace YOUR_TOKEN with actual JWT
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/analytics/src-accountability?days=30
```

---

## 📍 API Endpoint

**URL:** `GET /api/admin/analytics/src-accountability`

**Headers Required:**
- `Authorization: Bearer YOUR_ADMIN_JWT_TOKEN`
- `Content-Type: application/json`

**Query Parameters:**
| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `days` | number | 30 | 7-90 | Analysis period in days |
| `slaHours` | number | 72 | 1-999 | SLA threshold in hours |

**Example Requests:**
```bash
# Default (30 days, 72-hour SLA)
/api/admin/analytics/src-accountability

# Last 7 days
/api/admin/analytics/src-accountability?days=7

# Custom SLA (48 hours)
/api/admin/analytics/src-accountability?slaHours=48

# Combined
/api/admin/analytics/src-accountability?days=90&slaHours=120
```

---

## 📊 Response Structure

```json
{
  "success": true,
  "period": {
    "startDate": "ISO date",
    "endDate": "ISO date",
    "days": 30
  },
  "summary": {
    "totalOfficers": 5,           // Total SRC officers
    "totalPending": 12,            // Total pending applications
    "totalPendingSlaBreaches": 3,  // Apps pending > slaHours
    "totalReviewCount": 45,        // Total reviews completed
    "averageReviewHours": 48.5,    // Mean review time
    "slaViolationCount": 2,        // Officers with violations
    "slaHours": 72                 // SLA threshold used
  },
  "data": [
    {
      "officerId": "uuid",
      "userId": "uuid",
      "officerName": "John Doe",
      "email": "john@university.edu.gh",
      "universityName": "University Name",
      "position": "SRC President",
      "pendingCount": 3,              // Apps awaiting review
      "pendingSlaBreaches": 1,        // Pending > slaHours
      "reviewedCount": 12,            // Total reviews
      "avgReviewHours": 52.3,         // Mean hours per review
      "avgReviewDays": 2.2,           // Mean days per review
      "slaReviewBreaches": 2,         // Reviews > slaHours
      "slaViolation": true            // Has any breach
    }
  ]
}
```

---

## 🎨 Dashboard Access

### Frontend Route:
```
/admin/analytics
```

### Features:
1. **Summary Cards:** 5 KPI metrics
2. **Sortable Table:** Click headers to sort
3. **Status Badges:** Visual violation indicators
4. **Time Selector:** Change analysis period
5. **Responsive:** Works on mobile/tablet/desktop

### Sorting Options:
- **SLA Violations** (default) - Shows worst performers first
- **Pending Count** - Highest workload first
- **Review Time** - Slowest reviewers first

---

## 🔍 Metrics Explained

### Per Officer Metrics:

| Metric | Calculation | Alert Level |
|--------|-------------|-------------|
| **Pending Count** | Apps with status `PENDING_SRC` for officer's university | > 5 = warning |
| **Pending SLA Breaches** | Pending apps created > slaHours ago | > 0 = red 🔴 |
| **Reviewed Count** | Total apps reviewed (approved/rejected) | N/A |
| **Avg Review Hours** | Mean time from submission to SRC decision | > slaHours = warning |
| **Avg Review Days** | avgReviewHours / 24 | N/A |
| **Review SLA Breaches** | Reviews that took > slaHours | > 0 = red 🔴 |
| **SLA Violation** | Has any pending or review breaches | true = red 🔴 |

### Aggregated Summary:

| Metric | Description |
|--------|-------------|
| **Total Officers** | Count of SRC officers (active) |
| **Total Pending** | Sum of all pending apps across SRCs |
| **Total Pending SLA Breaches** | Sum of all pending breaches |
| **Total Review Count** | Sum of all completed reviews |
| **Average Review Hours** | Mean review time across all officers |
| **SLA Violation Count** | Number of officers with violations |

---

## 🎯 Use Cases

### 1. Identify Bottlenecks
**Goal:** Find SRCs causing delays  
**Action:** Sort by "SLA Violations" descending (default)  
**Result:** Top violators appear first with red badges

### 2. Monitor Workload Distribution
**Goal:** Check if workload is balanced  
**Action:** Sort by "Pending Count"  
**Result:** Officers with highest pending apps shown first

### 3. Track Response Times
**Goal:** Identify slow reviewers  
**Action:** Sort by "Avg Review Time"  
**Result:** Slowest reviewers appear first

### 4. Custom SLA Enforcement
**Goal:** Check compliance with 2-day policy  
**Action:** Use `?slaHours=48`  
**Result:** See violations for 48-hour threshold

### 5. Weekly Performance Review
**Goal:** Review last week's performance  
**Action:** Use `?days=7`  
**Result:** Get 7-day metrics snapshot

---

## 🚨 Status Indicators

### Visual Cues:

| Status | Color | Meaning |
|--------|-------|---------|
| ✅ **On Track** | Green | No SLA violations |
| 🔴 **Violation** | Red | Has SLA breaches |
| ⚠️ **Warning** | Yellow | High pending count |
| 🟢 **0** | Green | No breaches |
| 🔴 **> 0** | Red | Has breaches |

---

## 📝 Security

**Authentication:** JWT token required  
**Authorization:** ADMIN role only  
**Access Control:**
- ✅ Admin users: Full access
- ❌ SRC users: 403 Forbidden
- ❌ Students: 403 Forbidden
- ❌ Delivery: 403 Forbidden
- ❌ Unauthenticated: 401 Unauthorized

---

## 🔧 Configuration

### SLA Threshold:
```javascript
// Default in controller
const slaHours = parseInt(req.query.slaHours) || 72;

// Override via query param
?slaHours=48  // 2 days
?slaHours=120 // 5 days
```

### Time Period:
```javascript
// Default
const days = parseInt(req.query.days) || 30;

// Range validation
if (days < 7 || days > 90) {
  // Error: days must be 7-90
}
```

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
**Cause:** No token or invalid token  
**Fix:** Login again, get fresh JWT token

### Issue: 403 Forbidden
**Cause:** User is not ADMIN  
**Fix:** Use admin account credentials

### Issue: No data returned
**Cause:** No SRC officers in database  
**Fix:** Create SRC officers via admin panel

### Issue: All metrics are 0
**Cause:** No applications in database  
**Fix:** Add test applications or wait for data

### Issue: SLA violations seem wrong
**Cause:** Incorrect slaHours parameter  
**Fix:** Check `?slaHours=XX` matches your policy

---

## 📚 Related Endpoints

All under `/api/admin/analytics`:
```
GET /overview           - Overall statistics
GET /trends            - Time-series data
GET /review-times      - Review duration analysis
GET /payments          - Payment analytics
GET /deliveries        - Delivery analytics
GET /src-accountability  ← This endpoint
GET /universities      - University performance
```

---

## 🧪 Testing

### Test Script:
```bash
node test-admin-analytics.js
```

### Manual Test:
```bash
# 1. Login and get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# 2. Call SRC endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/analytics/src-accountability?days=30
```

---

## 📊 Sample Output

```json
{
  "success": true,
  "period": {
    "startDate": "2026-01-09T00:00:00.000Z",
    "endDate": "2026-02-08T23:59:59.999Z",
    "days": 30
  },
  "summary": {
    "totalOfficers": 3,
    "totalPending": 8,
    "totalPendingSlaBreaches": 2,
    "totalReviewCount": 25,
    "averageReviewHours": 45.2,
    "slaViolationCount": 1,
    "slaHours": 72
  },
  "data": [
    {
      "officerId": "123e4567-e89b-12d3-a456-426614174000",
      "userId": "987e4567-e89b-12d3-a456-426614174001",
      "officerName": "Kwame Mensah",
      "email": "kmensah@legon.ug.edu.gh",
      "universityName": "University of Ghana",
      "position": "SRC President",
      "pendingCount": 3,
      "pendingSlaBreaches": 1,
      "reviewedCount": 10,
      "avgReviewHours": 85.5,
      "avgReviewDays": 3.6,
      "slaReviewBreaches": 3,
      "slaViolation": true
    }
  ]
}
```

---

## ✅ Verification Checklist

Before deploying to production:
- [ ] Server running on port 3000
- [ ] Admin user exists in database
- [ ] JWT authentication working
- [ ] ADMIN role requirement enforced
- [ ] SRC officers exist in database
- [ ] Applications with SRC reviews exist
- [ ] Dashboard UI accessible
- [ ] Sorting functionality working
- [ ] Time period selector working
- [ ] SLA parameter validation working
- [ ] Responsive on mobile
- [ ] Error handling tested
- [ ] Security tested (401, 403 errors)

---

**Implementation:** ✅ COMPLETE  
**Server:** ✅ RUNNING  
**Endpoint:** `/api/admin/analytics/src-accountability`  
**Access:** ADMIN only  
**Documentation:** Complete

---

*End of Quick Reference*
