# Database Migration Guide: Prisma → Drizzle ORM

## Overview
This guide provides step-by-step instructions for migrating from Prisma to Drizzle ORM with PostgreSQL.

## Prerequisites
- PostgreSQL database instance (local or Azure Database for PostgreSQL)
- Node.js and npm installed
- Database credentials ready

## Migration Steps

### 1. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Windows)
# Download from https://www.postgresql.org/download/windows/

# Create database
createdb laptop_app

# Or using psql
psql -U postgres
CREATE DATABASE laptop_app;
```

#### Option B: Azure Database for PostgreSQL
```bash
# Install Azure CLI
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login
az login

# Create resource group
az group create --name laptop-app-rg --location westeurope

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group laptop-app-rg \
  --name laptop-app-db \
  --location westeurope \
  --admin-user adminuser \
  --admin-password YourStrongPassword123! \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --version 14

# Create database
az postgres flexible-server db create \
  --resource-group laptop-app-rg \
  --server-name laptop-app-db \
  --database-name laptop_app
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Update `DATABASE_URL`:

**Local:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/laptop_app"
```

**Azure:**
```env
DATABASE_URL="postgresql://adminuser:YourStrongPassword123!@laptop-app-db.postgres.database.azure.com:5432/laptop_app?sslmode=require"
```

### 3. Install Dependencies (Already Done)

```bash
npm install drizzle-orm pg dotenv
npm install -D drizzle-kit @types/pg tsx
```

### 4. Review Generated Schema

Check the generated schema files in `src/db/schema/`:
- `users.ts` - User accounts and roles
- `universities.ts` - Universities, SRC officers, student profiles, wallets
- `applications.ts` - Laptop applications and verification
- `payments.ts` - Payment records and deliveries
- `commissions.ts` - SRC commission tracking and payouts
- `notifications.ts` - Notification and audit logs

### 5. Review Generated Migration

The initial migration file was generated at:
```
drizzle/migrations/0000_woozy_harry_osborn.sql
```

This contains all CREATE TABLE statements, enums, and indexes.

### 6. Run Migrations

```bash
# Apply migrations to database
npm run db:migrate
```

Expected output:
```
⏳ Running migrations...
✅ Migrations completed successfully
```

### 7. Verify Database Structure

```bash
# Open Drizzle Studio to inspect database
npm run db:studio
```

This opens a web UI at `https://local.drizzle.studio` to browse tables and data.

### 8. Seed Initial Data (Optional)

```bash
# Seed with default users and universities
npm run db:seed
```

Creates:
- Admin account: `admin@laptopapp.com` / `admin123`
- SRC account: `src@ug.edu.gh` / `src123`
- Student account: `student@ug.edu.gh` / `student123`

### 9. Update Application Code

Replace Prisma imports with Drizzle:

**Before (Prisma):**
```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const users = await prisma.user.findMany();
```

**After (Drizzle):**
```javascript
import { db } from './db/connection';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const allUsers = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.id, userId));
```

### 10. Data Migration (If Existing Data)

If you have existing data in Prisma/SQL Server, export and import:

```bash
# Export from SQL Server (pseudocode)
prisma db pull
# Export data to JSON/CSV

# Import to PostgreSQL
node scripts/import-data.js
```

## Database Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:migrate` | Apply pending migrations to database |
| `npm run db:push` | Push schema changes directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio UI |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:drop` | Drop migration (use with caution) |
| `npm run db:check` | Check for schema drift |

## Migration Workflow (Development)

1. **Modify schema** in `src/db/schema/*.ts`
2. **Generate migration**: `npm run db:generate`
3. **Review SQL** in `drizzle/migrations/`
4. **Apply migration**: `npm run db:migrate`
5. **Test changes** in Drizzle Studio

## Production Migration Strategy

### Zero-Downtime Migration

For production with existing data:

1. **Parallel Run**: Keep both databases synchronized
2. **Dual Write**: Write to both Prisma and Drizzle databases
3. **Verify Data**: Compare data integrity between systems
4. **Switch Read Traffic**: Route reads to PostgreSQL gradually
5. **Stop Dual Write**: Disable Prisma writes after verification
6. **Decommission**: Remove Prisma after full migration

### Example: Adding a New Column

```bash
# 1. Update schema
# src/db/schema/users.ts
export const users = pgTable('users', {
  // ... existing columns
  lastLoginAt: timestamp('last_login_at'),
});

# 2. Generate migration
npm run db:generate

# 3. Review generated SQL
# drizzle/migrations/0001_add_last_login_at.sql

# 4. Test locally
npm run db:migrate

# 5. Deploy to staging
# 6. Deploy to production
```

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL is correct
- Check firewall rules (Azure)

### Migration Failed
- Check database permissions
- Review migration SQL for errors
- Rollback manually if needed:
  ```sql
  DROP TABLE IF EXISTS _drizzle_migrations;
  ```

### Schema Drift Detected
```bash
npm run db:check
npm run db:generate  # Create migration to resolve drift
```

### SSL Connection Issues (Azure)
Add `?sslmode=require` to DATABASE_URL

## Rollback Strategy

Drizzle uses forward-only migrations. To rollback:

1. **Manual Rollback**: Write reverse migration SQL
2. **Database Restore**: Restore from backup
3. **Application Code**: Deploy previous version

## Cost Comparison

| Service | Prisma + SQL Server | Drizzle + PostgreSQL | Savings |
|---------|---------------------|----------------------|---------|
| Database | Azure SQL Basic ($5/mo) | Azure PostgreSQL Burstable B2s ($35/mo) | -$30/mo |
| Database (Production) | Azure SQL S1 ($135/mo) | Azure PostgreSQL General Purpose D2s ($110/mo) | $25/mo (18%) |
| ORM Overhead | ~15% query overhead | ~5% query overhead | +10% performance |

## Best Practices

1. **Always backup** before running migrations
2. **Test migrations** in staging environment first
3. **Use transactions** for data migrations
4. **Monitor query performance** after migration
5. **Keep migration files** in version control
6. **Never edit** applied migration files
7. **Use connection pooling** in production

## Next Steps

1. ✅ Database schema created
2. ✅ Initial migration generated
3. ⬜ Run migration: `npm run db:migrate`
4. ⬜ Update controllers to use Drizzle
5. ⬜ Test API endpoints
6. ⬜ Deploy to staging
7. ⬜ Load test
8. ⬜ Deploy to production

## Support

- Drizzle ORM Docs: https://orm.drizzle.team/docs/overview
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Azure PostgreSQL: https://learn.microsoft.com/en-us/azure/postgresql/

---

**Status**: ✅ Schema and migrations ready. Run `npm run db:migrate` to apply.
