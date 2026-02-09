# Drizzle Query Examples

## Common Query Patterns

### Users

```typescript
import { db } from './db/connection';
import { users } from './db/schema';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';

// Find user by email
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'admin@laptopapp.com'))
  .limit(1);

// Create user
const [newUser] = await db.insert(users)
  .values({
    email: 'user@example.com',
    passwordHash: hashedPassword,
    role: 'STUDENT',
  })
  .returning();

// Update user
await db.update(users)
  .set({ updatedAt: new Date() })
  .where(eq(users.id, userId));

// Delete user
await db.delete(users)
  .where(eq(users.id, userId));
```

### Applications with Relations

```typescript
import { applications, studentProfiles, laptops, universities } from './db/schema';

// Get application with student and laptop
const applicationData = await db.select({
  application: applications,
  student: studentProfiles,
  laptop: laptops,
  university: universities,
})
  .from(applications)
  .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
  .leftJoin(laptops, eq(applications.laptopId, laptops.id))
  .leftJoin(universities, eq(studentProfiles.universityId, universities.id))
  .where(eq(applications.id, applicationId));

// Filter applications by status
const pendingApplications = await db.select()
  .from(applications)
  .where(eq(applications.status, 'PENDING_SRC'))
  .orderBy(desc(applications.createdAt));

// Search applications by student name
const searchResults = await db.select()
  .from(applications)
  .where(like(applications.name, `%${searchTerm}%`))
  .limit(20);

// Count applications by status
import { count } from 'drizzle-orm';

const stats = await db.select({
  status: applications.status,
  count: count(),
})
  .from(applications)
  .groupBy(applications.status);
```

### Commissions

```typescript
import { srcCommissionRecords, srcPayouts, universities } from './db/schema';

// Get pending commissions for university
const pendingCommissions = await db.select()
  .from(srcCommissionRecords)
  .where(and(
    eq(srcCommissionRecords.universityId, universityId),
    eq(srcCommissionRecords.status, 'PENDING')
  ));

// Mark commissions as earned
await db.update(srcCommissionRecords)
  .set({ 
    status: 'EARNED',
    earnedAt: new Date(),
  })
  .where(eq(srcCommissionRecords.applicationId, applicationId));

// Create payout batch
const [payout] = await db.insert(srcPayouts)
  .values({
    universityId,
    payoutRef: generateRef(),
    totalAmount,
    commissionCount,
    status: 'PENDING',
  })
  .returning();

// Update commission records with payout
await db.update(srcCommissionRecords)
  .set({ 
    payoutId: payout.id,
    status: 'READY_FOR_PAYOUT',
    readyAt: new Date(),
  })
  .where(and(
    eq(srcCommissionRecords.universityId, universityId),
    eq(srcCommissionRecords.status, 'EARNED')
  ));
```

### Notifications

```typescript
import { notificationLogs } from './db/schema';
import { gte, lte, inArray } from 'drizzle-orm';

// Log notification
await db.insert(notificationLogs)
  .values({
    userId,
    recipientId,
    recipientRole: 'STUDENT',
    eventName: 'APPLICATION_SUBMITTED',
    channel: 'SMS',
    title: 'Application Received',
    message: 'Your application has been submitted',
    status: 'SENT',
    correlationId: generateId(),
    applicationId,
  });

// Get notification history
const logs = await db.select()
  .from(notificationLogs)
  .where(and(
    eq(notificationLogs.recipientId, userId),
    gte(notificationLogs.sentAt, startDate),
    lte(notificationLogs.sentAt, endDate)
  ))
  .orderBy(desc(notificationLogs.sentAt))
  .limit(50);

// Get failed notifications
const failedNotifications = await db.select()
  .from(notificationLogs)
  .where(inArray(notificationLogs.status, ['FAILED', 'REJECTED']))
  .orderBy(desc(notificationLogs.sentAt));
```

### Transactions

```typescript
import { db, pool } from './db/connection';
import { applications, srcCommissionRecords, universityWallets } from './db/schema';
import { sql } from 'drizzle-orm';

// Atomic update with transaction
await db.transaction(async (tx) => {
  // Update application status
  await tx.update(applications)
    .set({ status: 'DELIVERED' })
    .where(eq(applications.id, applicationId));

  // Mark commission as earned
  await tx.update(srcCommissionRecords)
    .set({ 
      status: 'EARNED',
      earnedAt: new Date(),
    })
    .where(eq(srcCommissionRecords.applicationId, applicationId));

  // Update university wallet
  await tx.update(universityWallets)
    .set({ 
      earnedCommissions: sql`${universityWallets.earnedCommissions} + ${commissionAmount}`,
    })
    .where(eq(universityWallets.universityId, universityId));
});
```

### Raw SQL (When Needed)

```typescript
import { sql } from 'drizzle-orm';

// Complex aggregation
const revenue = await db.execute(sql`
  SELECT 
    u.name as university,
    COUNT(a.id) as total_applications,
    SUM(a.total_price) as total_revenue,
    SUM(a.commission_earned) as total_commissions
  FROM universities u
  LEFT JOIN student_profiles sp ON u.id = sp.university_id
  LEFT JOIN applications a ON sp.id = a.student_id
  WHERE a.status = 'COMPLETED'
  GROUP BY u.id, u.name
  ORDER BY total_revenue DESC
`);

// Prepared statement
const getUserByEmail = db
  .select()
  .from(users)
  .where(eq(users.email, sql.placeholder('email')))
  .prepare('get_user_by_email');

const user = await getUserByEmail.execute({ email: 'test@example.com' });
```

## Migration from Prisma Queries

### findUnique → select with where + limit

**Prisma:**
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
});
```

**Drizzle:**
```typescript
const [user] = await db.select()
  .from(users)
  .where(eq(users.email, 'test@example.com'))
  .limit(1);
```

### findMany → select

**Prisma:**
```typescript
const applications = await prisma.application.findMany({
  where: { status: 'PENDING_SRC' },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

**Drizzle:**
```typescript
const applications = await db.select()
  .from(applications)
  .where(eq(applications.status, 'PENDING_SRC'))
  .orderBy(desc(applications.createdAt))
  .limit(10);
```

### create → insert

**Prisma:**
```typescript
const user = await prisma.user.create({
  data: {
    email: 'test@example.com',
    passwordHash: hash,
    role: 'STUDENT',
  }
});
```

**Drizzle:**
```typescript
const [user] = await db.insert(users)
  .values({
    email: 'test@example.com',
    passwordHash: hash,
    role: 'STUDENT',
  })
  .returning();
```

### update → update

**Prisma:**
```typescript
await prisma.application.update({
  where: { id: appId },
  data: { status: 'APPROVED' }
});
```

**Drizzle:**
```typescript
await db.update(applications)
  .set({ status: 'APPROVED' })
  .where(eq(applications.id, appId));
```

### include → join

**Prisma:**
```typescript
const application = await prisma.application.findUnique({
  where: { id: appId },
  include: {
    student: {
      include: { university: true }
    },
    laptop: true,
  }
});
```

**Drizzle:**
```typescript
const result = await db.select()
  .from(applications)
  .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
  .leftJoin(universities, eq(studentProfiles.universityId, universities.id))
  .leftJoin(laptops, eq(applications.laptopId, laptops.id))
  .where(eq(applications.id, appId))
  .limit(1);

const [data] = result;
```

## Performance Tips

1. **Use Indexes**: Already defined in schema for common queries
2. **Limit Results**: Always use `.limit()` for pagination
3. **Select Specific Columns**: Instead of `select()`, use `select({ id: users.id, email: users.email })`
4. **Prepared Statements**: For repeated queries
5. **Connection Pooling**: Already configured in `connection.ts`
6. **Batch Operations**: Use `db.insert().values([...])` for bulk inserts

## Type Safety

Drizzle provides full TypeScript inference:

```typescript
// Type is inferred automatically
const [user] = await db.select().from(users).limit(1);
// user: { id: string; email: string; role: 'STUDENT' | 'SRC' | 'ADMIN' | 'DELIVERY'; ... }

// Use InferModel for custom types
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;
```

---

For more examples, see: https://orm.drizzle.team/docs/select
