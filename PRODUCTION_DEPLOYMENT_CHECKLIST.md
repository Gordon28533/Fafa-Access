# PRODUCTION DEPLOYMENT CHECKLIST & HARDENING GUIDE

## Status: Ready for Production Deployment ✅

This system has been hardened for production use with the following security measures in place:

---

## 1. ENVIRONMENT SECURITY CHECKLIST

### 1.1 Required Environment Variables
- [ ] `NODE_ENV` set to `production`
- [ ] `JWT_SECRET` set to cryptographically random 32+ character string
- [ ] `COOKIE_SECRET` set to cryptographically random 32+ character string
- [ ] `DATABASE_URL` points to production database (NOT localhost)
- [ ] `PORT` set to appropriate port (3000 or 443)
- [ ] `FRONTEND_URL` set to production frontend domain

### 1.2 Generating Secure Values
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate COOKIE_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# NEVER use development values in production
```

### 1.3 Environment File Security
- [ ] `.env` file NOT committed to git (already in .gitignore)
- [ ] Use `.env.production` as a template only
- [ ] Set all environment variables via deployment platform (AWS, Heroku, Docker, etc.)
- [ ] Rotate secrets quarterly
- [ ] Never log environment variables to console

### 1.4 Secret Management
- [ ] Use AWS Secrets Manager, HashiCorp Vault, or similar
- [ ] Never hardcode secrets in source code
- [ ] Run validation: `npm start` should validate all required env vars
- [ ] If validation fails, application exits with clear error message

**Validation Status:** ✅ Implemented in `src/utils/validateEnv.js`

---

## 2. ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT

### 2.1 Authentication Middleware
- [ ] All sensitive endpoints require `authenticate` middleware
- [ ] JWT tokens validated on every request
- [ ] Token signature verified using `JWT_SECRET`
- [ ] Expired tokens return 401 Unauthorized

**Status:** ✅ Verified - All protected routes enforce authentication

### 2.2 Authorization Enforcement
- [ ] Admin endpoints protected with `requireRole('ADMIN')`
- [ ] SRC endpoints protected with `requireRole('SRC')`
- [ ] Student endpoints protected with `requireRole('STUDENT')`
- [ ] Insufficient permissions return 403 Forbidden
- [ ] No role bypass allowed

**Status:** ✅ Verified - All admin routes require ADMIN role

### 2.3 Public Routes (No Auth Required)
- [ ] `GET /` - API info
- [ ] `GET /health` - Health check
- [ ] `POST /api/auth/register` - User registration
- [ ] `POST /api/auth/login` - User login
- [ ] `GET /api/laptops` - Public laptop list (if allowed)
- [ ] `GET /api/universities` - University list

**Status:** ✅ Verified

### 2.4 RBAC Audit Trail
- [ ] All authorization failures logged
- [ ] Failed attempts include: userId, required role, actual role, endpoint, timestamp
- [ ] Authorization logs stored for audit trail

**Status:** ✅ Verified - `logAuthFailure()` logs all failures

---

## 3. ERROR HANDLING & LOGGING

### 3.1 Error Handling
- [ ] All errors caught and logged (no stack traces in production)
- [ ] Generic error messages returned to clients in production
- [ ] Detailed error info only exposed in development
- [ ] Database errors don't expose schema info
- [ ] Specific error codes returned (400, 401, 403, 404, 500)

**Status:** ✅ Implemented - Server uses structured error handler

### 3.2 Logging Configuration
- [ ] All logs use Pino logger (structured JSON format)
- [ ] Sensitive data redacted from logs:
  - [ ] Authorization headers removed
  - [ ] Passwords redacted
  - [ ] Tokens redacted
- [ ] Log level set to `info` in production
- [ ] Logs sent to external service (Sentry, CloudWatch, etc.)

**Status:** ✅ Verified - Pino configured with redaction:
  ```javascript
  redact: {
    paths: ["req.headers.authorization", "req.body.password", "req.body.token"],
    censor: "[redacted]",
  }
  ```

### 3.3 No Console Logging
- [ ] Replace `console.error()` with `logger.error()`
- [ ] Replace `console.warn()` with `logger.warn()`
- [ ] Replace `console.log()` with `logger.info()`

**Status:** ✅ Fixed - All console calls in authMiddleware changed to logger

---

## 4. SECURE ENDPOINTS & API CONFIGURATION

### 4.1 Debug Endpoints Disabled in Production
- [ ] `/api/test-db` - Development only
- [ ] `/api/db-schema-status` - Development only
- [ ] These endpoints return 404 in production

**Status:** ✅ Implemented - Endpoints wrapped with:
  ```javascript
  if (NODE_ENV !== 'production') {
    // endpoint code
  }
  ```

### 4.2 Health Check Endpoint
- [ ] `/health` endpoint accessible without auth
- [ ] Returns minimal info in production (status, timestamp only)
- [ ] Returns detailed database info in development only
- [ ] Database connection tested on each health check

**Status:** ✅ Implemented

### 4.3 Index Endpoint
- [ ] `GET /` shows message in all environments
- [ ] Shows endpoint list in development only
- [ ] No endpoint disclosure in production

**Status:** ✅ Implemented

### 4.4 CORS Configuration
- [ ] Only whitelisted origins allowed
- [ ] Credentials allowed only for trusted origins
- [ ] Preflight requests handled (OPTIONS)

**Status:** ✅ Implemented - CORS validates against ALLOWED_ORIGINS array

### 4.5 Rate Limiting
- [ ] Global rate limit: 100 requests per 15 minutes (production)
- [ ] Auth endpoints: 5 failed attempts per 15 minutes
- [ ] API endpoints: 30 requests per minute
- [ ] Rate limit header included in responses

**Status:** ✅ Implemented with express-rate-limit

### 4.6 Security Headers
- [ ] Helmet.js enabled with security headers
- [ ] CSP (Content Security Policy) configured
- [ ] HSTS (HTTP Strict Transport Security) enabled
- [ ] X-Frame-Options set to prevent clickjacking

**Status:** ✅ Implemented with helmet():
  ```javascript
  - contentSecurityPolicy enabled
  - referrerPolicy: strict-origin-when-cross-origin
  - hsts: maxAge=31536000, includeSubDomains, preload
  ```

---

## 5. DATABASE SECURITY

### 5.1 Database Connection
- [ ] Using PostgreSQL (secure relational database)
- [ ] SSL enabled in production (`ssl: { rejectUnauthorized: false }`)
- [ ] Connection pooling configured (min: 5, max: 20)
- [ ] Idle timeout set to prevent resource exhaustion

**Status:** ✅ Verified in `src/db/connection.ts`

### 5.2 Database Credentials
- [ ] Database URL never hardcoded
- [ ] Stored in environment variables only
- [ ] Use strong password (20+ characters, mixed case, numbers, symbols)
- [ ] Rotate credentials regularly

### 5.3 Database Access Control
- [ ] Production database user has limited permissions
- [ ] Use separate database users for different services
- [ ] Regular backups enabled
- [ ] Point-in-time recovery configured

---

## 6. INPUT VALIDATION & SANITIZATION

### 6.1 NoSQL Injection Prevention
- [ ] $ and . characters stripped from request data
- [ ] Applied to body, query, and params

**Status:** ✅ Implemented in server.js

### 6.2 SQL Injection Prevention
- [ ] Using Drizzle ORM (prevents SQL injection)
- [ ] Parameterized queries used throughout
- [ ] Never concatenating user input into SQL

**Status:** ✅ Verified - All database queries use Drizzle ORM

### 6.3 XSS Prevention
- [ ] Output encoded in responses
- [ ] CSP headers set to restrict script sources
- [ ] Helmet.js provides additional XSS protection

### 6.4 CSRF Prevention
- [ ] Cookie-based CSRF tokens implemented (if needed)
- [ ] SameSite cookies configured

---

## 7. TYPESCRIPT & CODE QUALITY

### 7.1 Type Safety
- [ ] All API inputs have TypeScript types
- [ ] All database models have TypeScript interfaces
- [ ] No `any` types in production code

### 7.2 Linting & Code Quality
- [ ] ESLint runs without warnings
- [ ] TypeScript compiler strict mode enabled

**Run Tests:**
```bash
npm run lint
```

---

## 8. DEPLOYMENT CONFIGURATION

### 8.1 Container/Deployment Setup
- [ ] Dockerfile configured for production
- [ ] .dockerignore configured to exclude files
- [ ] Non-root user configured in Dockerfile
- [ ] Health check endpoint configured in deployment

### 8.2 Reverse Proxy Configuration (Nginx/Apache)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured
- [ ] GZIP compression enabled
- [ ] Request size limits set
- [ ] Rate limiting at reverse proxy level (optional)

### 8.3 TLS/SSL Configuration
- [ ] Valid SSL certificate installed
- [ ] Certificate renewal automated (Let's Encrypt)
- [ ] TLS 1.2+ enforced
- [ ] Weak ciphers disabled

### 8.4 Process Management
- [ ] PM2 or similar process manager configured
- [ ] Auto-restart on failure enabled
- [ ] Graceful shutdown configured
- [ ] Log rotation configured

---

## 9. MONITORING & ALERTING

### 9.1 Error Tracking
- [ ] Sentry DSN configured for error tracking
- [ ] Real-time alerts for unhandled errors
- [ ] Stack traces logged (but not exposed to clients)

### 9.2 Logging & Observability
- [ ] Structured JSON logging with Pino
- [ ] Logs sent to centralized service (CloudWatch, Datadog, etc.)
- [ ] Log retention policy configured (e.g., 30 days)

### 9.3 Metrics
- [ ] Response time monitoring enabled
- [ ] Error rate monitoring enabled
- [ ] Database connection pool monitoring
- [ ] Memory/CPU usage monitoring

### 9.4 Alerting
- [ ] High error rate alert
- [ ] Deployment notifications
- [ ] Critical error alerts (fatal level)
- [ ] Database connectivity alerts

---

## 10. SECURITY TESTING

### 10.1 Vulnerability Testing
```bash
# Check for known vulnerabilities in dependencies
npm audit

# Fix vulnerabilities
npm audit fix
```

- [ ] Run `npm audit` regularly
- [ ] Keep dependencies updated
- [ ] Test after updates

### 10.2 Authentication Testing
```bash
# Test authentication endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test with invalid credentials (should return 401)
# Test with expired token (should return 401)
```

### 10.3 Authorization Testing
```bash
# Test as STUDENT (should succeed)
curl -H "Authorization: Bearer <student-token>" \
  http://localhost:3000/api/applications

# Test as STUDENT accessing admin endpoint (should return 403)
curl -H "Authorization: Bearer <student-token>" \
  http://localhost:3000/api/admin/payments

# Test without token (should return 401)
curl http://localhost:3000/api/admin/payments
```

- [ ] All admin endpoints return 403 for non-admin users
- [ ] All protected endpoints return 401 without token
- [ ] All protected endpoints return 401 with expired token

### 10.4 Rate Limiting Testing
```bash
# Send more than 5 failed login attempts in 15 minutes
# Should return 429 Too Many Requests

for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Last requests should return 429
```

- [ ] Rate limiting works for auth endpoints
- [ ] Rate limiting works for API endpoints
- [ ] Successful requests don't count against limit (on auth)

### 10.5 CORS Testing
```bash
# Test with allowed origin
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:3000

# Test with disallowed origin (should not include CORS headers)
curl -H "Origin: http://evil.com" \
  http://localhost:3000
```

- [ ] Allowed origins receive CORS headers
- [ ] Disallowed origins don't receive CORS headers

---

## 11. DEPLOYMENT STEPS

### 11.1 Pre-Deployment Checklist
```bash
# 1. Run linter
npm run lint

# 2. Build frontend
npm run build

# 3. Run security audit
npm audit

# 4. Verify no hardcoded secrets
grep -r "password123\|jwt_secret\|change_me" src/

# 5. Verify .env is not committed
git check-ignore .env
```

- [ ] All linting passes
- [ ] No vulnerabilities in audit
- [ ] No hardcoded secrets
- [ ] .env not committed

### 11.2 Environment Setup
```bash
# 1. Set all required environment variables on deployment platform
# 2. Verify environment validation passes on startup
# 3. Test database connection
# 4. Test email configuration
```

- [ ] Environment variables set
- [ ] Database accessible
- [ ] Email service configured
- [ ] All external services reachable

### 11.3 Database Migration
```bash
# 1. Backup production database
# 2. Run migrations
npm run db:migrate

# 3. Verify schema matches
npm run db:check

# 4. Verify data integrity
```

- [ ] Database backup completed
- [ ] Migrations applied
- [ ] Schema verified
- [ ] Data integrity checked

### 11.4 Deployment
```bash
# 1. Build and push Docker image
# 2. Deploy to container orchestrator
# 3. Verify health checks pass
# 4. Monitor logs for errors
```

- [ ] Deployment completed
- [ ] Health check endpoint returns 200
- [ ] No errors in logs
- [ ] API responding to requests

### 11.5 Post-Deployment Verification
```bash
# Test critical endpoints
curl https://api.fafa-access.edu.gh/health
curl https://api.fafa-access.edu.gh/api/auth/login (should fail with validation error)
```

- [ ] Health check passes
- [ ] API responding
- [ ] HTTPS enforced
- [ ] No debug endpoints accessible
- [ ] Error messages are generic (no stack traces)

---

## 12. ONGOING PRODUCTION MAINTENANCE

### 12.1 Regular Tasks
- [ ] Monitor error tracking (Sentry) daily
- [ ] Review logs weekly
- [ ] Check rate limiting effectiveness weekly
- [ ] Database backups verified daily
- [ ] SSL certificate expiry monitored

### 12.2 Monthly Tasks
- [ ] Review security logs
- [ ] Check for new vulnerabilities: `npm audit`
- [ ] Review RBAC access patterns
- [ ] Audit failed authentication attempts
- [ ] Review user access logs

### 12.3 Quarterly Tasks
- [ ] Rotate JWT_SECRET and COOKIE_SECRET
- [ ] Update Node.js runtime if necessary
- [ ] Update dependencies: `npm update`
- [ ] Security audit of codebase
- [ ] Review and update rate limiting limits

### 12.4 Failed Login Investigation
- [ ] High number of failed auth attempts may indicate attack
- [ ] Check `logAuthFailure()` logs in observability service
- [ ] Temporarily reduce rate limit if under attack
- [ ] File security incident report if needed

---

## 13. ENVIRONMENT-SPECIFIC NOTES

### Development (NODE_ENV=development)
- Debug endpoints enabled (`/api/test-db`, `/api/db-schema-status`)
- Health check returns detailed database info
- Root endpoint lists all API endpoints
- Console errors logged (in addition to logger)
- Detailed error messages with stack traces

### Production (NODE_ENV=production)
- Debug endpoints disabled (404)
- Health check returns minimal info
- Root endpoint doesn't list endpoints
- No hardcoded logging (logger only)
- Generic error messages to clients
- Stack traces NOT exposed
- **Requires valid environment variables**

---

## 14. SECURITY SUMMARY

✅ **Secure Environment Configuration**
- Environment variables validated at startup
- Production configuration enforced

✅ **Role-Based Access Control**
- All admin routes require ADMIN role
- All SRC routes require SRC role
- All student routes require STUDENT role
- Authorization failures logged and audited

✅ **Error Handling & Logging**
- Structured logging with Pino
- Sensitive data redacted from logs
- Stack traces hidden from clients in production
- All errors logged with context

✅ **Secure API Endpoints**
- Debug endpoints disabled in production
- Health check production-safe
- CORS configured with whitelist
- Rate limiting enabled
- Security headers (Helmet) enabled
- Input sanitization enabled

✅ **Deployment Safety**
- Environment validation on startup
- Database schema validation available
- Graceful shutdown implemented
- Error handling comprehensive

---

## 15. QUICK DEPLOYMENT COMMAND

```bash
# Set production environment variables
export NODE_ENV=production
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
export COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
export DATABASE_URL="postgresql://prod_user:prod_password@prod-host:5432/fafa_access"
export FRONTEND_URL="https://www.fafa-access.edu.gh"

# Start production server
npm start

# Or using Docker
docker build -t fafa-access:latest .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=<secure-value> \
  -e DATABASE_URL=postgresql://... \
  fafa-access:latest
```

---

## SUPPORT & CONTACT

For any questions or security issues:
1. Review ROLE_BASED_ACCESS_CONTROL_AUDIT.md for detailed RBAC info
2. Check ROLE_ACCESS_QUICK_TEST.md for testing procedures
3. Contact development team for security updates

---

**Last Updated:** February 8, 2026  
**Status:** ✅ Production Ready  
**Next Review:** February 15, 2026
