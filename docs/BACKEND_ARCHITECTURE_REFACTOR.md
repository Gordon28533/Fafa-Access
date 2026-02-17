# Backend Architecture Refactor: Prisma → Drizzle ORM

## Executive Summary

**Problem:** Prisma ORM's auto-migration behavior causes schema drift in production, migration conflicts in team environments, and unpredictable state changes during deployments.

**Solution:** Migrate to Drizzle ORM with SQL-first, versioned migrations managed as source-controlled files, enforcing a single source of truth and forward-only migration strategy.

**Database:** PostgreSQL (Azure Database for PostgreSQL) for cost efficiency, JSON support, and superior scalability vs SQL Server.

**Impact:** Zero-downtime deployments, explicit schema control, reduced cloud costs (~40% vs Azure SQL), and improved developer experience.

---

## 1. Why Drizzle ORM Over Prisma

### Prisma Pain Points
- **Auto-migration drift:** `prisma migrate dev` auto-generates migrations that may differ across team members
- **Shadow database requirement:** Breaks in locked-down production environments
- **Schema introspection overhead:** Adds latency in CI/CD pipelines
- **Binary bloat:** Prisma Client generates ~30MB+ per deployment
- **Limited SQL control:** Difficult to write optimized raw queries with type safety

### Drizzle Advantages
| Feature | Prisma | Drizzle |
|---------|--------|---------|
| Migration approach | Auto-generated, schema-first | SQL-first, manual versioning |
| Schema drift risk | High (dev vs prod) | Low (single source of truth) |
| SQL control | Limited, uses custom syntax | Full SQL, TypeScript types |
| Bundle size | ~30MB | ~200KB |
| Type safety | Client-generated | Inference-based |
| PostgreSQL features | Partial (JSON, arrays) | Full (JSONB, CTEs, window) |
| Production safety | Shadow DB required | No shadow DB |
| Cost (Azure) | SQL Server $30-150/mo | PostgreSQL $15-60/mo |

---

## 2. Updated Backend Stack

### Before (Current)
```
┌─────────────────┐
│  Prisma ORM     │
│  (schema.prisma)│
└────────┬────────┘
         │
    ┌────▼────┐
    │ SQL     │
    │ Server  │
    └─────────┘
```

### After (Target)
```
┌──────────────────────────────────────┐
│  Application Layer (Express)         │
│  - Controllers use Drizzle queries   │
│  - Type-safe with inferred schemas   │
└──────────────┬───────────────────────┘
               │
┌──────────────▼───────────────────────┐
│  Drizzle ORM                         │
│  - src/db/schema/*.ts (TypeScript)   │
│  - drizzle/migrations/*.sql (SQL)    │
│  - drizzle.config.ts (connection)    │
└──────────────┬───────────────────────┘
               │
        ┌──────▼──────┐
        │ PostgreSQL  │
        │ (Azure DB)  │
        └─────────────┘
```

### Technology Stack
- **ORM:** Drizzle ORM v0.29+ (TypeScript-native, SQL-first)
- **Database:** PostgreSQL 15+ (Azure Database for PostgreSQL Flexible Server)
- **Migration Tool:** Drizzle Kit (CLI for SQL migration generation)
- **Connection Pool:** pg (node-postgres) with connection pooling
- **Type Safety:** TypeScript 5.2+ with strict mode
- **Runtime:** Node.js 20 LTS

---

## 3. Folder Structure

```
backend/
├── drizzle/                          # Migration files (git-tracked)
│   ├── migrations/
│   │   ├── 0000_init_schema.sql      # Initial schema
│   │   ├── 0001_add_notifications.sql
│   │   ├── 0002_add_indexes.sql
│   │   └── meta/                     # Drizzle metadata (auto-generated)
│   │       ├── _journal.json
│   │       └── 0000_snapshot.json
│   └── .gitignore                    # Ignore nothing (track all migrations)
│
├── src/
│   ├── db/
│   │   ├── schema/                   # TypeScript schema definitions
│   │   │   ├── users.ts
│   │   │   ├── applications.ts
│   │   │   ├── notifications.ts
│   │   │   ├── commissions.ts
│   │   │   └── index.ts             # Re-export all schemas
│   │   ├── migrations.ts            # Runtime migration runner
│   │   ├── connection.ts            # Database connection pool
│   │   └── seed.ts                  # Seed data for dev/staging
│   │
│   ├── controllers/                 # Express route handlers
│   │   ├── applicationController.ts # Now uses Drizzle queries
│   │   ├── notificationController.ts
│   │   └── ...
│   │
│   ├── services/                    # Business logic layer
│   │   ├── NotificationService.ts
│   │   └── ...
│   │
│   ├── middleware/
│   ├── routes/
│   └── server.ts                    # Express app entry
│
├── drizzle.config.ts                # Drizzle Kit configuration
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 4. Drizzle ORM Setup

### 4.1 Installation

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg tsx
```

### 4.2 Configuration (`drizzle.config.ts`)

```typescript
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 4.3 Environment Variables (`.env`)

```bash
# PostgreSQL connection (Azure Database for PostgreSQL)
DATABASE_URL="postgresql://adminuser:P@ssw0rd@my-db.postgres.database.azure.com:5432/laptop_app?sslmode=require"

# Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
```

### 4.4 Database Connection (`src/db/connection.ts`)

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: Number(process.env.DB_POOL_MIN) || 2,
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export { pool };
```

### 4.5 Example Schema (`src/db/schema/users.ts`)

```typescript
import { pgTable, uuid, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['STUDENT', 'SRC', 'ADMIN', 'DELIVERY']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### 4.6 Notification Log Schema (`src/db/schema/notifications.ts`)

```typescript
import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  recipientId: uuid('recipient_id'),
  recipientRole: varchar('recipient_role', { length: 50 }),
  eventName: varchar('event_name', { length: 100 }).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }),
  message: text('message').notNull(),
  messageId: varchar('message_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull(),
  correlationId: varchar('correlation_id', { length: 255 }),
  applicationId: uuid('application_id'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  recipientRoleIdx: index('notification_logs_recipient_role_idx').on(table.recipientRole),
  applicationIdIdx: index('notification_logs_application_id_idx').on(table.applicationId),
  eventNameIdx: index('notification_logs_event_name_idx').on(table.eventName),
  channelIdx: index('notification_logs_channel_idx').on(table.channel),
  statusIdx: index('notification_logs_status_idx').on(table.status),
  sentAtIdx: index('notification_logs_sent_at_idx').on(table.sentAt),
}));

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;
```

### 4.7 Schema Index (`src/db/schema/index.ts`)

```typescript
export * from './users';
export * from './universities';
export * from './applications';
export * from './notifications';
export * from './commissions';
export * from './deliveries';
export * from './payments';
```

---

## 5. Migration Workflow

### 5.1 Development Workflow

#### Step 1: Modify Schema (TypeScript)
```typescript
// src/db/schema/applications.ts
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  reference: varchar('reference', { length: 50 }).notNull().unique(),
  // ... existing columns ...
  
  // NEW: Add delivery notes column
  deliveryNotes: text('delivery_notes'),
});
```

#### Step 2: Generate Migration
```bash
npm run db:generate
# or
npx drizzle-kit generate:pg
```

**Output:** `drizzle/migrations/0003_add_delivery_notes.sql`
```sql
ALTER TABLE "applications" ADD COLUMN "delivery_notes" text;
```

#### Step 3: Review Migration
- **CRITICAL:** Manually inspect generated SQL
- Check for destructive operations (DROP, ALTER TYPE with data loss)
- Add data migrations if needed (UPDATE statements)

#### Step 4: Apply Migration (Dev)
```bash
npm run db:migrate
# or
npx drizzle-kit push:pg
```

#### Step 5: Commit Migration
```bash
git add drizzle/migrations/0003_add_delivery_notes.sql
git add drizzle/migrations/meta/
git add src/db/schema/applications.ts
git commit -m "feat: add delivery notes to applications"
```

### 5.2 Staging Deployment

```bash
# CI/CD pipeline (GitHub Actions, GitLab CI)
1. Build: npm run build
2. Test: npm run test
3. Migrate (Staging DB): npm run db:migrate:staging
4. Deploy: Deploy to staging environment
5. Smoke Test: Run health checks
```

**Staging Migration Script (`package.json`):**
```json
{
  "scripts": {
    "db:migrate:staging": "DATABASE_URL=$STAGING_DATABASE_URL tsx src/db/migrations.ts"
  }
}
```

### 5.3 Production Deployment

**Zero-Downtime Strategy:**

```bash
# Step 1: Backup production database
pg_dump $PROD_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Run migrations (forward-only, append-only)
DATABASE_URL=$PROD_DB_URL npm run db:migrate

# Step 3: Deploy new application code (rolling update)
# - Old instances: still running, compatible with new schema
# - New instances: spin up, use new columns

# Step 4: Verify deployment
curl https://api.example.com/health
```

**Migration Runner (`src/db/migrations.ts`):**
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function runMigrations() {
  console.log('⏳ Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('✅ Migrations complete');
  await pool.end();
}

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
```

### 5.4 Migration Best Practices

#### ✅ DO
- **Add columns as nullable** first, then backfill data, then set NOT NULL
- **Use transactions** for multi-statement migrations
- **Test rollback scenarios** (even though we don't auto-rollback)
- **Version migrations** with timestamps (`0001_`, `0002_`, ...)
- **Include comments** in SQL for context
- **Separate data migrations** from schema migrations

#### ❌ DON'T
- **Never** manually edit the database schema in production
- **Never** delete old migration files (breaks history)
- **Never** modify existing migration files (immutable)
- **Avoid** destructive operations (DROP COLUMN) without careful planning
- **Don't** use `drizzle-kit push` in production (dev-only command)

---

## 6. Production-Safe Migration Patterns

### Pattern 1: Adding a Non-Nullable Column

**Bad (Breaks existing instances):**
```sql
ALTER TABLE applications ADD COLUMN priority varchar(20) NOT NULL DEFAULT 'NORMAL';
```

**Good (3-phase deployment):**

**Phase 1: Add nullable column**
```sql
-- Migration 0004_add_priority_nullable.sql
ALTER TABLE applications ADD COLUMN priority varchar(20);
```

**Phase 2: Backfill data (separate migration or script)**
```sql
-- Migration 0005_backfill_priority.sql
UPDATE applications SET priority = 'NORMAL' WHERE priority IS NULL;
```

**Phase 3: Add NOT NULL constraint**
```sql
-- Migration 0006_priority_not_null.sql
ALTER TABLE applications ALTER COLUMN priority SET NOT NULL;
ALTER TABLE applications ALTER COLUMN priority SET DEFAULT 'NORMAL';
```

### Pattern 2: Renaming a Column

**Bad (Breaks old code):**
```sql
ALTER TABLE applications RENAME COLUMN "ghanaCardRef" TO "ghana_card_ref";
```

**Good (Dual-write, dual-read, cleanup):**

**Phase 1: Add new column, mirror writes**
```sql
-- Migration 0007_add_ghana_card_ref.sql
ALTER TABLE applications ADD COLUMN ghana_card_ref varchar(255);
```

**Application code (dual-write):**
```typescript
await db.update(applications).set({
  ghanaCardRef: hashedCard, // Old column
  ghanaCardRef: hashedCard, // New column (mirrored)
});
```

**Phase 2: Backfill old data**
```sql
-- Migration 0008_backfill_ghana_card_ref.sql
UPDATE applications SET ghana_card_ref = "ghanaCardRef" WHERE ghana_card_ref IS NULL;
```

**Phase 3: Switch reads to new column, deprecate old**
```typescript
// Update queries to use ghana_card_ref
await db.select().from(applications).where(eq(applications.ghanaCardRef, hash));
```

**Phase 4: Drop old column (weeks later)**
```sql
-- Migration 0009_drop_old_ghana_card.sql
ALTER TABLE applications DROP COLUMN "ghanaCardRef";
```

### Pattern 3: Changing Enum Values

**Bad (Fails if old code writes old values):**
```sql
ALTER TYPE application_status ADD VALUE 'CANCELLED';
```

**Good (Safe enum expansion):**

**Phase 1: Add new enum value**
```sql
-- Migration 0010_add_cancelled_status.sql
ALTER TYPE application_status ADD VALUE 'CANCELLED';
-- Postgres requires COMMIT after ALTER TYPE in some versions
```

**Phase 2: Deploy code that handles CANCELLED**
```typescript
const statusEnum = pgEnum('application_status', [
  'PENDING_SRC',
  'SRC_APPROVED',
  'ADMIN_APPROVED',
  'DELIVERED',
  'CANCELLED', // New value
]);
```

**Phase 3: Start using CANCELLED in business logic**

---

## 7. CI/CD Integration

### GitHub Actions Example (`.github/workflows/deploy.yml`)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Run migrations (Staging)
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: npm run db:migrate
      
      - name: Deploy to Staging
        run: |
          # Deploy to Azure App Service, AWS ECS, etc.
          # Rolling update ensures old instances serve traffic during migration
      
      - name: Smoke test
        run: curl -f https://staging.example.com/health || exit 1
      
      - name: Run migrations (Production)
        if: success()
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
        run: npm run db:migrate
      
      - name: Deploy to Production
        run: |
          # Blue-green deployment or rolling update
          # Old pods/instances remain until new ones are healthy
```

---

## 8. Query Examples (Drizzle vs Prisma)

### 8.1 Simple Select

**Prisma:**
```typescript
const applications = await prisma.application.findMany({
  where: { status: 'PENDING_SRC' },
  include: { student: true },
});
```

**Drizzle:**
```typescript
import { db } from '@/db/connection';
import { applications, students } from '@/db/schema';
import { eq } from 'drizzle-orm';

const results = await db
  .select()
  .from(applications)
  .leftJoin(students, eq(applications.studentId, students.id))
  .where(eq(applications.status, 'PENDING_SRC'));
```

### 8.2 Insert with Transaction

**Drizzle:**
```typescript
import { db } from '@/db/connection';
import { applications, notificationLogs } from '@/db/schema';

await db.transaction(async (tx) => {
  const [app] = await tx.insert(applications).values({
    reference: 'APP-2026-1234',
    studentId: userId,
    status: 'PENDING_SRC',
  }).returning();
  
  await tx.insert(notificationLogs).values({
    eventName: 'student.applicationSubmitted',
    recipientId: userId,
    channel: 'sms',
    status: 'sent',
    message: 'Your application has been submitted.',
  });
  
  return app;
});
```

### 8.3 Complex Query with Aggregation

**Drizzle:**
```typescript
import { sql } from 'drizzle-orm';

const metrics = await db
  .select({
    total: sql<number>`count(*)`,
    success: sql<number>`count(*) filter (where status = 'sent')`,
    failed: sql<number>`count(*) filter (where status = 'failed')`,
  })
  .from(notificationLogs)
  .groupBy(notificationLogs.channel);
```

---

## 9. Migration from Prisma to Drizzle

### Step 1: Parallel Setup (Week 1)

1. Install Drizzle alongside Prisma (both active)
2. Create Drizzle schemas mirroring Prisma schema
3. Generate initial migration from existing database:

```bash
# Introspect existing database to create Drizzle schema
npx drizzle-kit introspect:pg --out=./drizzle/migrations/0000_init_from_prisma.sql
```

4. Test Drizzle queries in non-critical endpoints

### Step 2: Incremental Migration (Weeks 2-4)

1. Refactor one controller at a time (e.g., `notificationController`)
2. Replace Prisma queries with Drizzle equivalents
3. Run integration tests to ensure parity
4. Deploy to staging, monitor for errors

### Step 3: Full Cutover (Week 5)

1. All controllers now use Drizzle
2. Remove Prisma Client generation from CI/CD
3. Archive `prisma/schema.prisma` (keep for reference)
4. Uninstall Prisma dependencies

```bash
npm uninstall @prisma/client prisma
rm -rf prisma/
```

### Step 4: Optimize (Week 6+)

1. Add database indexes based on slow query logs
2. Implement read replicas for analytics queries
3. Use Drizzle's prepared statements for hot paths

---

## 10. Preventing Schema Drift

### 10.1 Single Source of Truth

**Rule:** The `drizzle/migrations/` folder is the ONLY source of truth.

- ❌ Never manually edit production database
- ❌ Never use `ALTER TABLE` in psql console
- ✅ Always create a migration file for schema changes
- ✅ Track migrations in Git with descriptive commit messages

### 10.2 Pre-Commit Hooks

**Husky + lint-staged (`package.json`):**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "drizzle/migrations/*.sql": [
      "echo '⚠️  Migration file changed. Ensure it is tested and reviewed.'"
    ],
    "src/db/schema/*.ts": [
      "npm run db:generate",
      "git add drizzle/migrations/"
    ]
  }
}
```

### 10.3 Database Drift Detection

**Weekly cron job (GitHub Actions):**
```yaml
name: Detect Schema Drift

on:
  schedule:
    - cron: '0 0 * * 0' # Every Sunday

jobs:
  drift-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Pull production schema
        run: |
          pg_dump $PROD_DB_URL --schema-only > prod_schema.sql
      
      - name: Apply migrations to empty DB
        run: |
          docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:15
          sleep 5
          DATABASE_URL=postgresql://postgres:test@localhost:5432/test npm run db:migrate
          pg_dump postgresql://postgres:test@localhost:5432/test --schema-only > migrated_schema.sql
      
      - name: Compare schemas
        run: |
          diff prod_schema.sql migrated_schema.sql || {
            echo "❌ Schema drift detected!"
            exit 1
          }
```

### 10.4 Team Collaboration Rules

1. **Pull before you push:** Always `git pull` before generating migrations
2. **One migration per PR:** Keep changes small and reviewable
3. **Describe migrations:** Use comments in SQL files
4. **Test migrations locally:** Apply to local DB before pushing
5. **Staging first:** Never deploy migrations directly to production

---

## 11. PostgreSQL Cost Optimization (Azure)

### Database Tier Recommendations

| Stage | Tier | vCores | RAM | Storage | Cost/Month | Use Case |
|-------|------|--------|-----|---------|------------|----------|
| Dev | Burstable B1ms | 1 | 2GB | 32GB | **$15** | Local dev, testing |
| Staging | General Purpose D2s_v3 | 2 | 8GB | 128GB | **$60** | Pre-prod validation |
| Production (Phase 1) | General Purpose D2s_v3 | 2 | 8GB | 256GB | **$80** | <5K apps/month |
| Production (Phase 2) | General Purpose D4s_v3 | 4 | 16GB | 512GB | **$160** | 5K-25K apps/month |
| Production (Phase 3) | General Purpose D8s_v3 | 8 | 32GB | 1TB | **$320** | 25K+ apps/month |

**Savings vs Azure SQL:**
- Burstable tier: **$15 vs $30** (50% cheaper)
- General Purpose: **$80 vs $150** (47% cheaper)

### Additional Optimizations

1. **Connection Pooling:** Use pgBouncer (Azure built-in) to reduce connection overhead
2. **Read Replicas:** Add read replica for analytics queries ($60/month)
3. **Automated Backups:** 7-day retention included (PITR to any second)
4. **Auto-scaling Storage:** Start small, grow as needed (pay-as-you-go)
5. **Reserved Capacity:** Commit 1-year for 30% discount, 3-year for 50%

---

## 12. Security Best Practices

### 12.1 Connection Security

```typescript
// src/db/connection.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true, // Enforce SSL in production
    ca: process.env.DB_SSL_CA, // Azure-provided CA certificate
  },
  // Limit connection lifetime to prevent stale connections
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

### 12.2 Secrets Management

**Azure Key Vault:**
```bash
# Store DATABASE_URL in Azure Key Vault
az keyvault secret set \
  --vault-name my-keyvault \
  --name DATABASE-URL \
  --value "postgresql://..."

# Reference in App Service
az webapp config appsettings set \
  --name my-app \
  --resource-group my-rg \
  --settings DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://my-keyvault.vault.azure.net/secrets/DATABASE-URL/)"
```

### 12.3 Row-Level Security (RLS)

**Example: Students can only see their own applications**

```sql
-- Enable RLS on applications table
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Students see only their applications
CREATE POLICY student_own_applications ON applications
  FOR SELECT
  USING (student_id = current_setting('app.current_user_id')::uuid);

-- Set user context in application code
await db.execute(sql`SET app.current_user_id = ${userId}`);
```

---

## 13. Monitoring & Observability

### 13.1 Query Performance

**Drizzle Logger:**
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(pool, {
  logger: {
    logQuery(query, params) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Query:', query);
        console.log('📊 Params:', params);
      }
      // Send to DataDog, New Relic, etc.
    },
  },
});
```

### 13.2 Slow Query Alerts

**Azure Monitor Query:**
```sql
-- Find queries slower than 1 second
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 13.3 Connection Pool Metrics

```typescript
import { pool } from '@/db/connection';

setInterval(() => {
  console.log('Pool Stats:', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });
}, 60000); // Log every minute
```

---

## 14. Rollback Strategy

### When Migrations Fail

**Scenario 1: Migration fails mid-execution**

```bash
# Check migration status
SELECT * FROM drizzle_migrations ORDER BY created_at DESC;

# If migration is incomplete, manually fix and re-run
# Drizzle tracks completed migrations, won't re-apply
npm run db:migrate
```

**Scenario 2: Need to revert a migration**

```sql
-- Manual rollback (Drizzle doesn't auto-generate DOWN migrations)
-- Create a new migration that undoes the change

-- Example: Undo 0004_add_delivery_notes.sql
-- File: drizzle/migrations/0005_remove_delivery_notes.sql
ALTER TABLE applications DROP COLUMN delivery_notes;
```

**Best Practice:** Test migrations in staging, use feature flags to disable new code paths until migration is confirmed successful.

---

## 15. Deployment Checklist

### Pre-Deployment
- [ ] All tests pass (unit, integration, e2e)
- [ ] Migration SQL reviewed and approved
- [ ] Migration tested on staging database
- [ ] Database backup taken (automated + manual verification)
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

### During Deployment
- [ ] Run migrations first (before deploying app code)
- [ ] Monitor migration execution (check logs for errors)
- [ ] Deploy app code (rolling update, blue-green, or canary)
- [ ] Verify health checks pass
- [ ] Monitor error rates (Sentry, CloudWatch)

### Post-Deployment
- [ ] Verify key user flows (student application, SRC approval, delivery)
- [ ] Check notification delivery metrics
- [ ] Review slow query logs
- [ ] Update deployment log (timestamp, migration version, deployer)

---

## 16. Summary

| Aspect | Before (Prisma + SQL Server) | After (Drizzle + PostgreSQL) |
|--------|------------------------------|------------------------------|
| **ORM Approach** | Schema-first (auto-migrations) | SQL-first (manual migrations) |
| **Schema Drift Risk** | High (dev ≠ prod) | Low (single source of truth) |
| **Production Safety** | Shadow DB required | Forward-only migrations |
| **Type Safety** | Generated client (~30MB) | Inferred types (~200KB) |
| **SQL Control** | Limited (DSL) | Full SQL + TypeScript |
| **Database** | Azure SQL ($30-150/mo) | PostgreSQL ($15-80/mo) |
| **Migration Conflicts** | Frequent (merge issues) | Rare (versioned files) |
| **Deployment Complexity** | Moderate (auto-sync risk) | Low (explicit control) |
| **Cost Efficiency** | Moderate | **High (40-50% savings)** |
| **Ghana Market Fit** | Good | **Excellent (low latency, cost)** |

### Key Wins
1. **40-50% cost reduction** (PostgreSQL vs SQL Server)
2. **Zero schema drift** (migrations as single source of truth)
3. **Production-safe deployments** (no auto-sync, explicit control)
4. **Better developer experience** (TypeScript-native, full SQL)
5. **Scalable architecture** (connection pooling, read replicas ready)

---

## 17. Next Steps

### Week 1-2: Setup
1. Provision Azure Database for PostgreSQL (Flexible Server, Burstable B1ms)
2. Install Drizzle ORM and dependencies
3. Create initial schema in TypeScript
4. Generate baseline migration from Prisma schema

### Week 3-4: Migration
1. Refactor one controller at a time (start with notifications)
2. Run parallel tests (Prisma vs Drizzle results must match)
3. Deploy to staging, monitor for issues

### Week 5-6: Cutover
1. Replace all Prisma queries with Drizzle
2. Remove Prisma from dependencies
3. Deploy to production (with rollback plan ready)
4. Monitor metrics (latency, error rates, query performance)

### Week 7+: Optimize
1. Add database indexes based on slow query logs
2. Implement connection pooling optimizations
3. Set up read replicas for analytics queries
4. Fine-tune backup and disaster recovery procedures

---

**Architecture reviewed by:** Senior Backend Architect  
**Estimated migration effort:** 4-6 weeks (2 engineers)  
**Risk level:** Low (incremental, reversible)  
**Cost impact:** -40% (PostgreSQL savings)  
**Business impact:** High (improved reliability, faster deployments)
