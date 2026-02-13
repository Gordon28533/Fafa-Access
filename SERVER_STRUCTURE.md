# Server Structure Documentation

## Overview

This project uses a **monorepo architecture** with both frontend and backend code in the same repository under the `src/` directory. The backend is a Node.js/Express application that serves both API endpoints and the built frontend application.

## ✅ Complete Server Structure Checklist

The project has all required server components:

- ✅ **package.json** - Project dependencies and scripts (in root directory)
- ✅ **server.js** - Main server entry point (`src/server.js`)
- ✅ **routes/** - API route definitions (`src/routes/`)
- ✅ **controllers/** - Request handlers and business logic (`src/controllers/`)
- ✅ **services/** - Business logic and external integrations (`src/services/`)
- ✅ **.env** - Environment variables (properly excluded via `.gitignore` - **DO NOT push to GitHub**)

## 📁 Current Structure

```
/Fafa-Access
├── package.json              # Root package.json with all dependencies
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment variables template
└── src/
    ├── server.js             # Express server entry point
    ├── routes/               # API route definitions
    │   ├── adminAnalyticsRoutes.js
    │   ├── adminAuditLogRoutes.js
    │   ├── adminCommissionRoutes.js
    │   ├── adminNotificationRoutes.js
    │   ├── adminPaymentRoutes.js
    │   ├── adminSRCRoutes.js
    │   └── adminUniversityRoutes.js
    ├── controllers/          # Request handlers
    │   ├── applicationController.js
    │   ├── authController.js
    │   ├── paymentController.js
    │   ├── commissionController.js
    │   ├── laptopController.js
    │   └── ... (24 controllers total)
    ├── services/             # Business logic services
    │   ├── EmailService.js
    │   ├── NotificationService.js
    │   ├── PaystackService.js
    │   ├── applicationService.js
    │   ├── authService.js
    │   └── ... (27 services total)
    ├── middleware/           # Express middleware
    │   ├── auth.js
    │   ├── roleAuth.js
    │   └── validation.js
    ├── db/                   # Database configuration
    │   ├── migrate.ts
    │   ├── seed.ts
    │   └── schema/
    └── email-templates/      # Email templates
```

## 🔧 Server Entry Point

**File:** `src/server.js`

This file:
- Configures Express application
- Sets up middleware (CORS, body-parser, authentication, rate limiting)
- Mounts all route handlers
- Connects to PostgreSQL database via Drizzle ORM
- Serves static files from `dist/` (built frontend)
- Implements security best practices (helmet, rate limiting)

### Starting the Server

```bash
# Development mode (with auto-reload)
npm run server:dev

# Production mode
npm start
# or
npm run server
```

## 📂 Directory Details

### routes/
Contains Express router modules that define API endpoints. Each route file groups related endpoints:
- Authentication routes
- Application management routes
- Payment processing routes
- Commission calculation routes
- Admin analytics routes
- University management routes
- SRC (Student Representative Council) routes

**Example:** `src/routes/adminAnalyticsRoutes.js`

### controllers/
Contains controller functions that handle HTTP requests and responses. Controllers:
- Validate input data
- Call service layer functions
- Format responses
- Handle errors

**Example:** `src/controllers/applicationController.js`

### services/
Contains business logic separated from HTTP layer. Services:
- Interact with the database
- Implement business rules
- Call external APIs (Paystack, email, SMS)
- Process complex operations

**Example:** `src/services/PaystackService.js`, `src/services/EmailService.js`

## 🔐 Environment Variables

The `.env` file contains sensitive configuration and is **excluded from Git** via `.gitignore`.

**Setup:**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

**Required variables include:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token generation
- `PAYSTACK_SECRET_KEY` - Payment processing API key
- Email service credentials (SendGrid, etc.)
- SMS service credentials (Hubtel)
- Azure Storage credentials

**See `.env.example` for the complete list.**

## 🛡️ Security Best Practices

✅ **Implemented:**
- `.env` is in `.gitignore` (never committed)
- Rate limiting on all API endpoints
- JWT authentication middleware
- Role-based authorization (RBAC)
- Input validation with Zod schemas
- SQL injection protection (Drizzle ORM parameterized queries)
- XSS protection (HTML sanitization)
- CORS configuration
- Helmet.js security headers
- Bcrypt password hashing

## 📦 Package Management

All dependencies (both frontend and backend) are managed in the **root `package.json`**.

### Backend Dependencies Include:
- `express` - Web framework
- `drizzle-orm` - Database ORM
- `postgres` - PostgreSQL client
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `cors` - Cross-Origin Resource Sharing
- `zod` - Schema validation
- `@azure/storage-blob` - Document storage
- `@sendgrid/mail` - Email service
- `axios` - HTTP client

## 🗄️ Database

**ORM:** Drizzle ORM  
**Database:** PostgreSQL  
**Schema Location:** `src/db/schema/`

### Database Scripts
```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Open Drizzle Studio GUI
npm run db:seed      # Seed test data
```

## 🚀 API Endpoints

The server exposes multiple API endpoint groups:

- `/api/auth` - Authentication (login, register, logout)
- `/api/applications` - Student applications
- `/api/payments` - Payment processing (Paystack integration)
- `/api/commissions` - Commission calculations
- `/api/laptops` - Laptop inventory management
- `/api/admin/*` - Admin-only endpoints (analytics, audit logs, etc.)
- `/api/src/*` - SRC-specific endpoints
- `/api/universities` - University management

**Note:** All API routes are protected with authentication and rate limiting middleware.

## 📊 Monitoring & Logging

The server implements:
- **Audit logging** - All critical actions logged to database
- **Email logging** - All sent emails tracked
- **Error tracking** - Sentry integration for production errors
- **Observability** - Datadog RUM and logging (configurable)

## 🔄 Development Workflow

1. **Start Database:** Ensure PostgreSQL is running
2. **Run Migrations:** `npm run db:migrate`
3. **Start Backend:** `npm run server:dev`
4. **Start Frontend:** `npm run dev` (in another terminal)

The backend will run on port defined in `.env` (typically 3000 or 5000), and the frontend dev server runs on port 5173.

## 📝 Notes

### Why Monorepo Structure?

This project uses a monorepo (both frontend and backend in `src/`) instead of separate `/server` and `/client` directories because:

1. **Simplified deployment** - Single build process
2. **Shared types** - TypeScript types shared between frontend and backend
3. **Easier development** - Single `node_modules` and `package.json`
4. **Vite integration** - Vite can proxy API requests during development

### Alternative Structure

If you prefer a separate `/server` directory, you could restructure as:

```
/server
  ├── package.json       # Backend-only dependencies
  ├── server.js          # Entry point
  ├── routes/
  ├── controllers/
  ├── services/
  └── .env

/client  (or /frontend)
  ├── package.json       # Frontend-only dependencies
  ├── src/
  └── index.html
```

However, the current monorepo structure is intentional and works well for this project size.

## 🆘 Common Issues

**"Cannot find module 'dotenv'"**
- Run `npm install` to install all dependencies

**"Database connection failed"**
- Check `.env` file has correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Run `npm run db:migrate` to create tables

**"Port already in use"**
- Another process is using the port
- Change port in `.env` or stop conflicting process

## 📚 Additional Documentation

- See `BACKEND_ARCHITECTURE_REFACTOR.md` for database architecture details
- See `AUTHENTICATION_SYSTEM_DESIGN.md` for auth implementation
- See `PAYMENT_FLOW_EXAMPLES.md` for payment integration
- See `README.md` for general project overview
