# Fafa Access Backend Repository

## Overview

This repository contains the backend API server for the Fafa Access application. It provides RESTful APIs for student onboarding, laptop inventory management, payment processing, document management, and administrative functions.

## Repository Purpose

This is the **backend-only** repository after splitting from the original monorepo. The frontend has been moved to a separate repository for better:
- **Deployment independence**: Backend and frontend can be deployed separately
- **Development workflow**: Teams can work independently on frontend and backend
- **Scalability**: Each part can scale independently
- **Security**: Backend secrets are isolated from frontend code

## Architecture

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Pino (structured logging)
- **Monitoring**: Datadog integration (optional)
- **Email**: SMTP with template support
- **Storage**: Azure Blob Storage / Supabase Storage
- **Payments**: Paystack integration

### Application Structure

```
src/
├── routes/              # API route definitions (22 files)
│   ├── auth.js          # Authentication routes
│   ├── applications.js  # Student application routes
│   ├── laptops.js       # Laptop inventory routes
│   ├── payments.js      # Payment processing routes
│   ├── users.js         # User management routes
│   └── ...              # Additional route files
│
├── controllers/         # Request handlers (24 files)
│   ├── authController.js
│   ├── applicationController.js
│   ├── laptopController.js
│   └── ...
│
├── services/            # Business logic (31 files)
│   ├── authService.js
│   ├── applicationService.js
│   ├── laptopService.js
│   ├── emailService.js
│   └── ...
│
├── middleware/          # Express middleware
│   ├── auth.js          # JWT authentication
│   ├── authorize.js     # Role-based authorization
│   ├── errorHandler.js  # Global error handling
│   ├── rateLimiter.js   # Rate limiting
│   └── validator.js     # Request validation
│
├── db/                  # Database configuration
│   ├── migrate.ts       # Migration runner
│   ├── seed.ts          # Database seeding
│   └── index.js         # Database connection
│
├── schemas/             # Drizzle ORM schemas
│   ├── users.ts
│   ├── applications.ts
│   ├── laptops.ts
│   └── ...
│
├── email-templates/     # Email templates
│   ├── welcome.html
│   ├── application-approved.html
│   └── ...
│
├── utils/               # Utility functions
│   ├── validateEnv.js   # Environment validation
│   ├── logger.js        # Logging utilities
│   └── ...
│
├── types/               # TypeScript definitions
│   └── express.d.ts
│
└── server.js            # Application entry point
```

## Key Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Roles: STUDENT, SRC, ADMIN, UNIVERSITY_ADMIN
- Secure password hashing with bcrypt
- Session management with HTTP-only cookies

### 2. Student Onboarding
- Student registration and profile management
- Document upload and verification
- Application workflow (submit → SRC review → Admin approval)
- Status tracking and notifications

### 3. Laptop Inventory Management
- Inventory tracking and management
- Assignment to approved students
- Change requests and approval workflow
- Real-time inventory analytics

### 4. Payment Processing
- Paystack integration for online payments
- Payment verification and webhooks
- Payment history and receipts
- Refund processing

### 5. Document Management
- Secure document storage (Azure Blob / Supabase)
- Document upload, download, and preview
- Access control and audit logging
- Support for multiple document types

### 6. Email Notifications
- Template-based email system
- Automated triggers for workflow events
- Email audit logging
- SMTP configuration with fallback

### 7. Audit Logging
- Comprehensive audit trail for all actions
- User activity tracking
- Security event logging
- Compliance reporting

### 8. Analytics & Reporting
- Application statistics
- Payment analytics
- Inventory reports
- Export functionality (CSV, PDF)

## API Endpoints

The backend exposes RESTful APIs grouped by functionality:

### Authentication (`/api/auth`)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Applications (`/api/applications`)
- `GET /api/applications` - List applications (filtered by role)
- `POST /api/applications` - Submit new application
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id` - Update application
- `POST /api/applications/:id/review` - Review application (SRC)
- `POST /api/applications/:id/approve` - Approve/reject (Admin)

### Laptops (`/api/laptops`)
- `GET /api/laptops` - List laptops
- `POST /api/laptops` - Add laptop (Admin)
- `GET /api/laptops/:id` - Get laptop details
- `PUT /api/laptops/:id` - Update laptop
- `POST /api/laptops/:id/assign` - Assign to student
- `POST /api/laptops/:id/change-request` - Request laptop change

### Payments (`/api/payments`)
- `POST /api/payments/initialize` - Initialize payment
- `GET /api/payments/verify/:reference` - Verify payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/webhook` - Paystack webhook

### Users (`/api/users`)
- `GET /api/users` - List users (Admin)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)

### Documents (`/api/documents`)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Download document
- `DELETE /api/documents/:id` - Delete document

For complete API documentation, see individual route files or use the API documentation tools.

## Environment Configuration

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fafa_access

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (SMTP)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@fafaaccess.com

# Storage
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER_NAME=documents

# Payments (Paystack)
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Monitoring (optional)
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=your-sentry-dsn
```

## Getting Started

### 1. Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn package manager

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/Gordon28533/fafa-access-backend.git
cd fafa-access-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database with test data
npm run db:seed
```

### 4. Development

```bash
# Start development server with auto-reload
npm run server:dev

# Or start without auto-reload
npm run start
```

The server will start at `http://localhost:5000`

### 5. Testing

```bash
# Check database connection
node test-db-connection.js

# Test authentication
node test-auth-quick.js

# Run full test workflow
node test-full-workflow.js
```

## Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production database
4. Set up SSL/TLS certificates
5. Configure CORS for your frontend domain
6. Set up monitoring and logging
7. Configure backup strategy
8. Enable rate limiting
9. Review security headers (Helmet)
10. Set up CI/CD pipeline

### Deployment Platforms
- **Render**: See [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)
- **Railway**: See [GO_LIVE_GUIDE.md](./GO_LIVE_GUIDE.md)
- **AWS**: See [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md)
- **Vercel**: Edge functions support available

For detailed deployment instructions, refer to the respective guides.

## Security Considerations

- ✅ JWT tokens with secure secrets
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ HTTP-only cookies for token storage
- ✅ CORS configuration
- ✅ Rate limiting on all endpoints
- ✅ Helmet for security headers
- ✅ Input sanitization (mongo-sanitize)
- ✅ SQL injection prevention (parameterized queries via ORM)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure file upload validation
- ✅ Environment variable validation
- ✅ Error handling without information leakage
- ✅ Audit logging for sensitive operations

## Monitoring & Logging

### Structured Logging
- Uses Pino for high-performance logging
- JSON format for easy parsing
- Log levels: trace, debug, info, warn, error, fatal
- Request/response logging via pino-http

### Monitoring Integrations
- **Datadog**: APM and infrastructure monitoring
- **Sentry**: Error tracking and reporting
- **Custom**: Health check endpoint at `/api/health`

### Audit Trail
- All user actions are logged
- Authentication events tracked
- Payment transactions recorded
- Document access logged
- Admin actions audited

## Maintenance

### Database Migrations
```bash
# Create new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# View database in GUI
npm run db:studio
```

### Logs
- Development: Pretty-printed console logs
- Production: JSON logs to stdout
- Log rotation recommended for production

### Backups
- Regular database backups (automated)
- Document storage backups
- Configuration backup strategy

## Troubleshooting

### Common Issues

**Database connection errors**
- Verify DATABASE_URL in `.env`
- Check PostgreSQL is running
- Verify credentials and permissions

**JWT errors**
- Ensure JWT_SECRET is set
- Check token expiration
- Verify cookie configuration

**Email not sending**
- Verify SMTP credentials
- Check firewall/network settings
- Review email service logs

**File upload errors**
- Check storage configuration
- Verify file size limits
- Check file type restrictions

## Contributing

1. Follow TypeScript best practices
2. Use async/await for asynchronous code
3. Add proper error handling
4. Write meaningful commit messages
5. Document new endpoints
6. Add tests for new features
7. Update documentation

## License

This project is private and proprietary.

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Refer to documentation in the `/docs` folder

## Related Documentation

- [Authentication System Design](./AUTHENTICATION_SYSTEM_DESIGN.md)
- [Authorization Enforcement Guide](./AUTHORIZATION_ENFORCEMENT_GUIDE.md)
- [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md)
- [Email System Documentation](./EMAIL_SYSTEM_DOCUMENTATION.md)
- [Production Security Checklist](./PRODUCTION_SECURITY_CHECKLIST.md)
- [Deployment Architecture](./DEPLOYMENT_ARCHITECTURE.md)
- [Documentation Index](./DOCUMENTATION_INDEX.md)
