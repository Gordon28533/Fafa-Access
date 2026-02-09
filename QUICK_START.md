# Quick Start Guide - Drizzle Database

## 🚀 Setup (5 Minutes)

### 1. Install PostgreSQL
```bash
# Windows: Download from postgresql.org
# Or use Docker:
docker run --name postgres -e POSTGRES_PASSWORD=mysecret -p 5432:5432 -d postgres
```

### 2. Create Database
```bash
createdb laptop_app
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env:
DATABASE_URL="postgresql://postgres:mysecret@localhost:5432/laptop_app"
```

### 4. Run Migration
```bash
npm run db:migrate
```

### 5. Seed Data (Optional)
```bash
npm run db:seed
```

### 6. Verify
```bash
npm run db:studio
# Opens at https://local.drizzle.studio
```

## 📝 Common Commands

```bash
# Development workflow
npm run db:generate    # After changing schema
npm run db:migrate     # Apply changes to DB
npm run db:studio      # View data

# Production
npm run db:push        # Quick sync (dev only!)
npm run db:check       # Check for drift
```

## 🔑 Default Login

After seed:
- Admin: `admin@laptopapp.com` / `admin123`
- SRC: `src@ug.edu.gh` / `src123`
- Student: `student@ug.edu.gh` / `student123`

## 💻 Quick Query Examples

```typescript
import { db } from './db/connection';
import { users, applications } from './db/schema';
import { eq } from 'drizzle-orm';

// Find user
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'test@example.com'))
  .limit(1);

// Create application
const [app] = await db.insert(applications)
  .values({ ... })
  .returning();

// Update status
await db.update(applications)
  .set({ status: 'APPROVED' })
  .where(eq(applications.id, appId));

// Join tables
const data = await db.select()
  .from(applications)
  .leftJoin(users, eq(applications.studentId, users.id));
```

## 🆘 Troubleshooting

### "Connection refused"
```bash
# Check PostgreSQL is running
pg_isready
# Or start it:
sudo service postgresql start
```

### "Migration failed"
```bash
# Check connection
psql -U postgres -d laptop_app
# Manual rollback if needed
DROP TABLE IF EXISTS __drizzle_migrations;
```

### "bcrypt not found" (during seed)
```bash
npm install bcrypt
npm install -D @types/bcrypt
```

## 📚 Full Documentation

- [DATABASE_MIGRATION_GUIDE.md](./DATABASE_MIGRATION_GUIDE.md) - Complete guide
- [DRIZZLE_QUERY_EXAMPLES.md](./DRIZZLE_QUERY_EXAMPLES.md) - All query patterns
- [DATABASE_IMPLEMENTATION_SUMMARY.md](./DATABASE_IMPLEMENTATION_SUMMARY.md) - What was built

## ✅ Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created (`laptop_app`)
- [ ] `.env` configured with `DATABASE_URL`
- [ ] Migrations applied (`npm run db:migrate`)
- [ ] Seed data loaded (`npm run db:seed`)
- [ ] Drizzle Studio tested (`npm run db:studio`)
- [ ] Controllers updated to use Drizzle
- [ ] API endpoints tested

---

**Need help?** Check DATABASE_MIGRATION_GUIDE.md for detailed instructions.
