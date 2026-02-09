# 🚀 Quick Reference - Email System Testing

## One-Minute Setup

```bash
# 1. Infrastructure already running - verify health
curl http://localhost:3000/health

# 2. Create test users (if needed)
npx tsx create-test-users.ts

# 3. Seed sample laptops
npx tsx seed-test-data.ts

# 4. Setup test environment
npx tsx setup-complete-test-env.ts

# 5. Run email tests
node test-email-triggers.js
```

---

## Test User Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student@test.com | TestPass123! |
| SRC | src@test.com | TestPass123! |
| Admin | admin@test.com | TestPass123! |
| Delivery | delivery@test.com | TestPass123! |

---

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User authentication |
| `/api/applications` | POST | Submit application |
| `/api/applications/:id/src-decision` | PUT | SRC approval/rejection |
| `/api/applications/:id/admin-decision` | PUT | Admin approval/rejection |
| `/api/applications/:id/assign-delivery` | POST | Assign delivery |
| `/api/laptops` | GET | List available laptops |
| `/health` | GET | Server health check |

---

## Verified Email Triggers

✅ **Application Submitted** - student receives notification on submission

🔄 **Other Triggers** - under testing

---

## Database Access

```bash
# Connect to database
docker exec Fafa_Access psql -U postgres -d fafa_access

# Check email audit log
SELECT action, details->'to' as TO, timestamp 
FROM audit_logs 
WHERE action = 'EMAIL_SENT' 
ORDER BY timestamp DESC 
LIMIT 10;

# Check applications
SELECT id, reference, status, created_at 
FROM applications 
ORDER BY created_at DESC 
LIMIT 5;

# Check students
SELECT id, full_name, phone_number, level 
FROM student_profiles 
LIMIT 5;
```

---

## API Usage Examples

### Submit Application
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d {
    "laptopId": "1c62b7c9-5095-4793-8179-d4b16ee29789",
    "name": "Test Student",
    "level": "Level 100",
    "course": "Computer Science",
    "address": "Test Address",
    "phoneNumber": "0241234567",
    "ghanaCardNumber": "GHA-123456789-0"
  }
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d {
    "email": "student@test.com",
    "password": "TestPass123!"
  }
```

### SRC Approval
```bash
curl -X PUT http://localhost:3000/api/applications/{appId}/src-decision \
  -H "Authorization: Bearer $SRC_TOKEN" \
  -H "Content-Type: application/json" \
  -d {
    "decision": "approve",
    "notes": "Approved"
  }
```

---

## File Locations

| Purpose | File |
|---------|------|
| Email Service | `src/services/TransactionalEmailService.js` |
| Notifications | `src/services/emailNotifications.js` |
| Application Controller | `src/controllers/applicationController.js` |
| Business Rules | `src/services/applicationBusinessRules.js` |
| Test Scripts | Root directory (test-*.js, *.ts) |

---

## Environment Variables (.env)

Key variables for email testing:
```
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USERNAME=test
SMTP_PASSWORD=test

SUPABASE_URL=https://dhqbqkwcsrnpzskchpje.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_Dabpcy4LOmKxnpHxVIc-5Q_pD-FDIeu

DATABASE_URL=postgresql://postgres:password@localhost:55432/fafa_access
JWT_SECRET=your-secret-key
```

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Server not responding | Check: `curl http://localhost:3000/health` |
| Database connection failed | Check Docker: `docker ps \| grep Fafa_Access` |
| Port 3000 in use | Kill: `lsof -ti:3000 \| xargs kill -9` |
| Test user won't login | Verify user exists: `npx tsx create-test-users.ts` |
| Email not sent | Check logs: `SELECT * FROM audit_logs WHERE action = 'EMAIL_SENT'` |
| Permission denied | Create SRC profile: Run `setup-complete-test-env.ts` |

---

## Monitoring

### Real-time Logs
```bash
# Watch email sends
docker exec Fafa_Access psql -U postgres -d fafa_access \
  -c "WATCH 'SELECT count(*) as email_count FROM audit_logs WHERE action = \"EMAIL_SENT\"'"
```

### Performance Check
```bash
# Response time test
time curl -s http://localhost:3000/health > /dev/null
```

### Data Integrity
```bash
# Verify test data
SELECT COUNT(*) as app_count FROM applications;
SELECT COUNT(*) as laptop_count FROM laptops WHERE is_active = true;
SELECT COUNT(*) as user_count FROM users;
```

---

## Test Coverage

| Phase | Items | Status |
|-------|-------|--------|
| Infrastructure | 3/3 | ✅ Complete |
| Users & Data | 4/4 | ✅ Complete |
| Email Triggers | 1/6 | ⏳ In Progress |
| Integration | 5/5 | 🔄 Pending |

---

## Next Steps

1. ✅ Phase 1 Complete - Email submission trigger verified
2. 🔄 Phase 2 - Complete remaining 5 email triggers
3. 📊 Phase 3 - Load testing & optimization
4. 🚀 Phase 4 - Production deployment

---

**Last Updated:** 2026-02-06  
**Status:** Testing in progress  
**Contact:** GitHub Copilot
