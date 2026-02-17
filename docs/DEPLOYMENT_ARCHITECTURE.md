# Production Deployment Architecture

## System Overview
Multi-tenant laptop distribution platform for Ghanaian universities with student applications, SRC/Admin approvals, delivery tracking, and commission management.

## Architecture Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFLARE CDN + WAF                          │
│                    (Global Edge, DDoS Protection, SSL)                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                  │
        │                                                  │
┌───────▼──────────┐                            ┌─────────▼─────────┐
│   REACT FRONTEND  │                            │   BACKEND API     │
│   (Static Site)   │                            │  (Node.js/Express)│
│                   │                            │                   │
│  - Vite Build     │                            │  - REST API       │
│  - CDN Hosted     │                            │  - JWT Auth       │
│  - S3 + CloudFront│                            │  - Rate Limiting  │
│    or Netlify     │                            │  - Validation     │
└───────────────────┘                            │                   │
                                                 │  Load Balanced    │
                                                 │  (2+ instances)   │
                                                 └─────────┬─────────┘
                                                           │
                    ┌──────────────────────────────────────┼────────────────────────────────┐
                    │                                      │                                │
                    │                                      │                                │
         ┌──────────▼──────────┐            ┌─────────────▼────────────┐      ┌───────────▼──────────┐
         │   SQL SERVER DB     │            │   BLOB STORAGE           │      │  NOTIFICATION QUEUE  │
         │   (Azure SQL)       │            │   (Azure Blob / S3)      │      │   (Redis / SQS)      │
         │                     │            │                          │      │                      │
         │ - Applications      │            │ - Ghana Cards (encrypted)│      │ - SMS Queue          │
         │ - Users             │            │ - Student IDs            │      │ - WhatsApp Queue     │
         │ - Commissions       │            │ - Admission Letters      │      │ - Email Queue        │
         │ - Notifications Log │            │ - Delivery Photos        │      │                      │
         │ - Audit Logs        │            │ - Signatures             │      └──────────┬───────────┘
         │                     │            │                          │                 │
         │ Auto-backup (daily) │            │ Lifecycle: Archive > 1yr │                 │
         └─────────────────────┘            └──────────────────────────┘                 │
                                                                                         │
                                                           ┌─────────────────────────────┘
                                                           │
                                            ┌──────────────▼──────────────┐
                                            │  NOTIFICATION WORKERS       │
                                            │  (Background Processors)    │
                                            │                             │
                                            │  - SMS Worker (Hubtel API)  │
                                            │  - WhatsApp Worker (Meta)   │
                                            │  - Email Worker (SendGrid)  │
                                            │                             │
                                            │  Rate Limited, Retry Logic  │
                                            └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         MONITORING & LOGGING                            │
│                                                                         │
│  - Application Logs: CloudWatch / Datadog                              │
│  - Performance Metrics: New Relic / AppInsights                        │
│  - Error Tracking: Sentry                                              │
│  - Uptime Monitoring: Pingdom / UptimeRobot                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      THIRD-PARTY INTEGRATIONS                           │
│                                                                         │
│  - Payment Gateway: Paystack / Flutterwave (GHS)                       │
│  - SMS Provider: Hubtel (Ghana-based)                                  │
│  - WhatsApp: Meta Business API                                         │
│  - Email: SendGrid / Amazon SES                                        │
│  - Ghana Card Verification: NIA API (if available)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. **Frontend (React/Vite)**
**Hosting:** Netlify, Vercel, or AWS S3 + CloudFront  
**Responsibilities:**
- Single-page application with role-based views (Student, SRC, Admin, Delivery)
- Form validation and client-side state management
- File uploads (Ghana Cards, IDs, admission letters) with client-side compression
- Real-time application status updates
- Responsive design optimized for mobile (Ghana mobile-first internet)
- Progressive Web App (PWA) for offline capability

**Security:**
- Content Security Policy (CSP) headers
- XSS protection via React escaping
- JWT stored in httpOnly cookies (if possible) or sessionStorage
- HTTPS only

**Cost:** $0-50/month (Netlify/Vercel free tier or S3 ~$5/month)

---

### 2. **Backend API (Node.js/Express)**
**Hosting:** AWS EC2 (t3.small), DigitalOcean Droplets, or Azure App Service  
**Deployment:** PM2 process manager, Docker containers, or serverless (AWS Lambda for certain endpoints)  
**Load Balancer:** AWS ALB, Nginx, or Cloudflare Load Balancing

**Responsibilities:**
- REST API endpoints for all CRUD operations
- JWT authentication and role-based access control (RBAC)
- Business logic: application workflow, commission calculations, delivery tracking
- File upload handling with virus scanning (ClamAV)
- Notification orchestration (publish events to queue)
- Rate limiting (express-rate-limit) to prevent abuse
- Request validation (Joi/Zod) and sanitization
- Audit logging for all state changes
- Session management and token refresh

**Security:**
- HTTPS/TLS encryption
- Helmet.js for security headers
- CORS configuration (whitelist frontend domain)
- Input sanitization and SQL injection prevention (Prisma ORM)
- Secrets management (AWS Secrets Manager, Azure Key Vault, or .env with encryption)
- API rate limiting per IP and per user
- Ghana Card hashing (SHA-256) before storage

**Scaling:**
- Horizontal scaling: 2+ instances behind load balancer
- Auto-scaling based on CPU/memory (if using cloud provider)
- Database connection pooling (Prisma handles this)

**Cost:** $20-100/month (2x t3.small instances or DigitalOcean droplets)

---

### 3. **Database (SQL Server / PostgreSQL)**
**Hosting:** Azure SQL Database, AWS RDS (SQL Server), or managed PostgreSQL (DigitalOcean, Supabase)

**Responsibilities:**
- Primary data store for users, applications, commissions, wallets, audit logs
- Notification logs (immutable, for dispute resolution)
- Transactional integrity for payment and commission updates
- Indexed queries for fast lookups (Ghana Card hash, application reference, phone number)

**Backup & Recovery:**
- Automated daily backups with 7-day retention
- Point-in-time recovery (PITR) enabled
- Geo-redundant backups (if budget allows)

**Security:**
- Encrypted at rest (AES-256)
- Encrypted in transit (SSL/TLS)
- Database firewall: allow only API server IPs
- Read replicas for analytics queries (optional for cost saving)

**Cost:** $30-150/month (Basic tier Azure SQL or RDS db.t3.small)

---

### 4. **Blob Storage (Azure Blob / AWS S3)**
**Responsibilities:**
- Store Ghana Card images (front, back, selfie) with encryption
- Student IDs, admission letters, delivery photos, signatures
- Organize by application ID: `/applications/{appId}/ghana-card-front.jpg`
- Lifecycle policies: archive to cold storage after 1 year, delete after 7 years (per data retention laws)
- Pre-signed URLs for temporary access (expire in 15 minutes)

**Security:**
- Encryption at rest (AES-256, server-side)
- Encryption in transit (HTTPS)
- Private buckets with no public access
- Access control via IAM roles or SAS tokens
- Virus scanning on upload (Lambda/Function triggered ClamAV scan)

**Cost:** $5-20/month (~10GB/month uploads, ~500GB total storage)

---

### 5. **Notification Queue (Redis / AWS SQS / Azure Queue)**
**Hosting:** Redis Cloud (free tier), AWS SQS, Azure Queue Storage

**Responsibilities:**
- Decouple notification sending from API response time
- Queue SMS, WhatsApp, Email jobs for background workers
- Retry logic for failed sends (DLQ for permanent failures)
- Priority queues for critical notifications (delivery, payment)

**Workers:**
- SMS Worker: consumes queue, calls Hubtel API, logs status
- WhatsApp Worker: consumes queue, calls Meta Business API with fallback to SMS
- Email Worker: consumes queue, calls SendGrid/SES, logs status

**Cost:** $0-20/month (Redis free tier 30MB or SQS $0.40/million requests)

---

### 6. **Notification Services (SMS/WhatsApp/Email)**

#### **SMS (Hubtel - Ghana-based)**
- **Why:** Hubtel is Ghana's leading SMS gateway with high deliverability
- **Cost:** ~$0.02-0.04/SMS
- **Usage:** ~2,000 SMS/month (500 apps × 4 notifications avg) = $40-80/month
- **Features:** Delivery receipts, sender ID customization
- **Fallback:** Africa's Talking (if Hubtel down)

#### **WhatsApp (Meta Business API)**
- **Why:** High engagement in Ghana, rich media support
- **Cost:** ~$0.005-0.01/message (cheaper than SMS)
- **Usage:** ~3,000 WhatsApp/month = $15-30/month
- **Requirements:** Pre-approved message templates, business verification
- **Fallback:** SMS if WhatsApp delivery fails

#### **Email (SendGrid / Amazon SES)**
- **Why:** Admin communications, receipts, reports
- **Cost:** SendGrid free tier (100 emails/day) or SES ($0.10/1000 emails)
- **Usage:** ~500 emails/month (admin-heavy) = $0-5/month

**Total Notification Cost:** $55-115/month

---

### 7. **CDN + WAF (Cloudflare)**
**Responsibilities:**
- Global edge caching for static assets (React bundle, images)
- DDoS protection and bot mitigation
- SSL/TLS termination
- Web Application Firewall (WAF) to block malicious requests
- Ghana edge servers for low latency

**Cost:** $0-20/month (Cloudflare Free or Pro plan)

---

### 8. **Monitoring & Observability**

#### **Application Logs**
- **Tool:** AWS CloudWatch, Azure Monitor, or Datadog
- **What:** API request logs, error logs, notification logs
- **Retention:** 30 days hot, 1 year cold storage

#### **Performance Monitoring**
- **Tool:** New Relic, Datadog APM, or Azure Application Insights
- **Metrics:** API response times, database query performance, error rates

#### **Error Tracking**
- **Tool:** Sentry (free tier: 5K errors/month)
- **Alerts:** Email/Slack on critical errors (payment failures, notification exhaustion)

#### **Uptime Monitoring**
- **Tool:** UptimeRobot (free tier: 50 monitors), Pingdom
- **Checks:** API health endpoint (`/health`), database connectivity, storage availability

**Cost:** $0-50/month (free tiers + basic paid plans)

---

## Ghana-Specific Considerations

### **Internet Reliability**
- **Challenge:** Intermittent connectivity, mobile-first users
- **Solutions:**
  - Progressive Web App (PWA) with offline support
  - Aggressive caching (service workers)
  - Optimized image compression (WebP, lazy loading)
  - Minimal bundle size (<500KB initial load)
  - SMS fallback for all critical notifications
  - Retry logic with exponential backoff for API calls

### **Mobile Money Integration (Future)**
- **Providers:** MTN Mobile Money, Vodafone Cash, AirtelTigo Money
- **Gateway:** Paystack, Flutterwave (supports Ghana MoMo)
- **Use Case:** 70% initial payment, 30% final payment, SRC commission payouts

### **Regulatory Compliance**
- **Data Protection:** Ghana Data Protection Act (GDPA) 2012
  - User consent for data collection
  - Right to deletion (GDPR-like)
  - Audit logs for all data access
- **Financial Transactions:** Bank of Ghana guidelines for e-payments
- **Ghana Card:** National ID verification (integrate NIA API if available)

---

## Security Architecture

### **Defense in Depth**
1. **Edge Layer:** Cloudflare WAF blocks malicious traffic
2. **Network Layer:** VPC with private subnets for database/storage
3. **Application Layer:** Input validation, rate limiting, RBAC
4. **Data Layer:** Encryption at rest and in transit, hashed sensitive data
5. **Monitoring Layer:** Real-time alerts on suspicious activity

### **Authentication & Authorization**
- JWT tokens with 1-day expiry (refresh tokens for 30 days)
- Role-based access control (Student, SRC, Admin, Delivery)
- Multi-factor authentication (SMS OTP) for admin accounts
- IP whitelisting for admin panel (optional)

### **Data Encryption**
- **In Transit:** HTTPS/TLS 1.3 for all communications
- **At Rest:** AES-256 for database and blob storage
- **Application:** bcrypt for passwords (cost factor 12), SHA-256 for Ghana Card hashes
- **Keys:** Managed via AWS KMS, Azure Key Vault, or HashiCorp Vault

---

## Scalability Strategy

### **Phase 1: Startup (0-5 universities, <1,000 apps/month)**
- **Frontend:** Netlify/Vercel (free tier)
- **Backend:** 1 server (DigitalOcean $20/month droplet)
- **Database:** Azure SQL Basic ($30/month) or PostgreSQL managed ($15/month)
- **Storage:** S3/Blob ($5/month)
- **Notifications:** Hubtel SMS + SendGrid free tier
- **Total:** ~$100-150/month

### **Phase 2: Growth (5-20 universities, 5,000 apps/month)**
- **Frontend:** CDN (Cloudflare Pro, $20/month)
- **Backend:** 2 servers + load balancer ($50/month)
- **Database:** Read replica for analytics ($60/month total)
- **Storage:** ~$20/month (500GB)
- **Notifications:** $300/month (10K SMS, 15K WhatsApp)
- **Total:** ~$450-500/month

### **Phase 3: Scale (50+ universities, 25,000 apps/month)**
- **Frontend:** CDN with edge caching
- **Backend:** Auto-scaling (4-8 instances), containerized (Kubernetes/ECS)
- **Database:** Multi-region replication, read replicas
- **Storage:** CDN for static files, lifecycle archival
- **Notifications:** Bulk pricing, dedicated queues
- **Total:** ~$1,500-2,500/month

---

## Disaster Recovery & Business Continuity

### **Backup Strategy**
- **Database:** Daily automated backups, 7-day retention, geo-redundant
- **Storage:** Versioning enabled, cross-region replication
- **Code:** Git repository (GitHub/GitLab) with CI/CD pipelines

### **Failover Plan**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour (max data loss)
- **Steps:**
  1. Detect failure via uptime monitoring (5-min alerts)
  2. Restore database from latest backup
  3. Spin up new API servers from Docker image
  4. Update DNS/load balancer to healthy instances
  5. Notify users via SMS (downtime message)

### **High Availability**
- **Multi-AZ deployment:** Database and API in multiple availability zones
- **Health checks:** Load balancer pings `/health` endpoint every 30 seconds
- **Auto-healing:** PM2 or Kubernetes restarts crashed processes

---

## Cost Summary (Monthly Estimates)

| Phase | Users | Apps/Month | Infrastructure | Notifications | Total    |
|-------|-------|------------|----------------|---------------|----------|
| 1     | 1K    | 1K         | $100           | $50           | **$150** |
| 2     | 5K    | 5K         | $200           | $300          | **$500** |
| 3     | 25K   | 25K        | $1,000         | $1,500        | **$2,500**|

**Note:** Assumes 70% notification delivery via WhatsApp (cheaper), 30% SMS fallback.

---

## Deployment Checklist

### **Pre-Launch**
- [ ] Database migration scripts tested and versioned (Prisma migrate)
- [ ] Environment variables secured (Azure Key Vault, AWS Secrets Manager)
- [ ] SSL certificates provisioned (Let's Encrypt via Cloudflare)
- [ ] Backup and restore procedures documented and tested
- [ ] Load testing completed (1,000 concurrent users, 10K API req/min)
- [ ] Penetration testing (OWASP Top 10 checks)
- [ ] GDPR/GDPA compliance audit

### **Go-Live**
- [ ] DNS cutover to production domain
- [ ] Monitoring dashboards configured (Sentry, CloudWatch)
- [ ] On-call rotation established (24/7 for Phase 2+)
- [ ] User documentation and support portal live

### **Post-Launch**
- [ ] Performance monitoring (daily review for first week)
- [ ] User feedback collection (NPS surveys)
- [ ] Incident response plan tested
- [ ] Monthly security audits

---

## Technology Stack Summary

| Layer          | Technology                     | Why                                          |
|----------------|--------------------------------|----------------------------------------------|
| Frontend       | React + Vite + TailwindCSS     | Fast builds, modern UI, responsive           |
| Backend        | Node.js + Express + Prisma     | Familiar stack, async I/O, type-safe ORM     |
| Database       | SQL Server or PostgreSQL       | Relational data, ACID compliance             |
| Storage        | Azure Blob / AWS S3            | Scalable, durable, encrypted                 |
| Queue          | Redis / AWS SQS                | Decoupled notifications, retry logic         |
| Notifications  | Hubtel (SMS), Meta (WhatsApp)  | Ghana market leaders, high deliverability    |
| CDN/WAF        | Cloudflare                     | Global edge, DDoS protection, free tier      |
| Monitoring     | Sentry + CloudWatch            | Error tracking, logs, alerts                 |
| CI/CD          | GitHub Actions / GitLab CI     | Automated testing and deployment             |

---

## Future Enhancements

1. **Mobile Apps:** React Native or Flutter for offline-first experience
2. **Analytics Dashboard:** Admin insights (conversion rates, bottlenecks, revenue forecasts)
3. **AI/ML:**
   - Fraud detection (Ghana Card verification, duplicate applications)
   - Predictive analytics (commission forecasts, delivery ETAs)
4. **Multi-Language Support:** Twi, Ga, Ewe for broader accessibility
5. **Payment Integration:** Direct MoMo payments, installment plans
6. **Blockchain:** Immutable audit trail for high-value transactions

---

## Contact & Support

**DevOps Team:** [Email/Slack channel for incidents]  
**Monitoring Alerts:** Configured to notify via SMS + Email  
**Runbook:** Detailed incident response procedures in Confluence/Notion

---

*Architecture reviewed and approved: [Date]*  
*Next review: Quarterly or upon significant scale milestone*
