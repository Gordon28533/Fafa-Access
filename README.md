# Fafa Access Backend

A production-ready backend API server built with Express.js, TypeScript, PostgreSQL, and Drizzle ORM. This repository contains the backend services for the Fafa Access application.
Backend API for the Fafa Access platform.
**This repository contains the Fafa Access Backend** - Express.js REST API for laptop access management.

A production-ready backend API for laptop access management in Nigerian universities.

> **✅ Frontend Code Migrated**: All frontend code has been moved to the [fafa-access-frontend](https://github.com/Gordon28533/fafa-access-frontend) repository. See [FRONTEND_MIGRATION_COMPLETE_GUIDE.md](./FRONTEND_MIGRATION_COMPLETE_GUIDE.md) for migration details.

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 14+ database
- Environment variables configured (see `.env.example`)
---

## 🔍 Backend-Only Repository

**✅ CLEAN BACKEND ARCHITECTURE!** 

This repository is now **backend-only**:
- ✅ **Backend**: Express.js REST API server (`src/server.js`)
- ✅ **Database**: PostgreSQL with Drizzle ORM
- ✅ **Full Backend Infrastructure**: 23 routes, 24 controllers, 31+ services
- ❌ **No Frontend Code**: All frontend code moved to separate repository
- ❌ **No Frontend Build Tools**: Vite, Tailwind, PostCSS removed

See [BACKEND_CLEANUP.md](./BACKEND_CLEANUP.md) and [FRONTEND_MIGRATION_COMPLETE_GUIDE.md](./FRONTEND_MIGRATION_COMPLETE_GUIDE.md) for details.

---

## Tech Stack

- Node.js + Express
- Drizzle ORM + PostgreSQL
- TypeScript tooling (`tsx`) for runtime scripts

## Quick Start
- Node.js 18+ and npm
- PostgreSQL database

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Run API server:
   ```bash
   npm run server:dev
   ```

API default: `http://localhost:3000`
Health check: `http://localhost:3000/health`
1. Clone the repository:
```bash
git clone https://github.com/Gordon28533/fafa-access-backend.git
cd fafa-access-backend
git clone <repository-url>
cd Fafa-Access
```

## Scripts

- `npm run start` - start API server
- `npm run server:dev` - start API server in watch mode
- `npm run lint` - run ESLint
- `npm run db:generate` - generate Drizzle migrations
- `npm run db:migrate` - apply migrations
- `npm run db:seed` - seed database

## Project Layout

- `src/server.js` - Express bootstrap
- `src/routes/` - API routes
- `src/controllers/` - request handlers
- `src/services/` - business and integration services
- `src/db/` - DB connection, schema, migrations
- `src/middleware/` - auth/security middleware
3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start the backend server:
```bash
npm run db:migrate
```

5. Start the backend server:
```bash
npm run server:dev
```

The API server will be available at `http://localhost:5000`
The backend server will start on `http://localhost:5000`

## Notes

This repository is backend-only. Frontend is maintained in a separate repository.
This is a **backend-only repository**. All frontend code has been moved to a separate repository.

```
src/
 ├─ routes/          # API route definitions (22 route files)
 ├─ controllers/     # Request handlers and business logic (24 controller files)
 ├─ services/        # Business logic and data access (31 service files)
 ├─ middleware/      # Express middleware (authentication, authorization, etc.)
 ├─ db/             # Database configuration and migrations
 ├─ schemas/        # Database schemas (Drizzle ORM)
 ├─ utils/          # Utility functions and helpers
 ├─ email-templates/# Email templates for notifications
 ├─ types/          # TypeScript type definitions
 └─ server.js       # Express server entry point
 ├─ server.js           # Backend Express.js server (main entry point)
 ├─ routes/            # Backend API routes (23 files)
 ├─ controllers/       # Backend controllers (24 files)
 ├─ services/          # Backend services (31+ files)
 ├─ middleware/        # Backend middleware (auth, security, etc.)
 ├─ db/                # Database layer (Drizzle ORM + PostgreSQL)
 ├─ schemas/           # Database schemas
 ├─ utils/             # Backend utilities
 └─ email-templates/   # Email templates
```

## 🛠️ Available Scripts

- `npm run server:dev` - Start backend server with auto-reload
- `npm run start` - Start backend server (production)
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with test data
- `npm run lint` - Run ESLint

## 🏗️ Deployment

To deploy the backend server:

1. Set up your PostgreSQL database
2. Configure environment variables (see `.env.example`)
3. Run database migrations: `npm run db:migrate`
4. Start the server: `npm run start`

For detailed deployment instructions, see [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md).

### Backend Scripts
- `npm start` - Start backend server (production)
- `npm run dev` - Start backend with auto-reload (watch mode)
- `npm run server` - Start backend server
- `npm run server:dev` - Start backend with auto-reload
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with initial data

### General Scripts
- `npm run lint` - Run ESLint on backend code

## 🏗️ Backend Architecture

The backend runs directly via Node.js/tsx (no build step required):
```bash
npm start              # Production start
npm run server:dev     # Development with auto-reload
```

### Frontend
To create a production frontend build:
```bash
npm run build
```
## 📝 Environment Variables

Create a `.env` file based on `.env.example`:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT token generation
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins
- Additional variables for email, storage, payments, etc. (see `.env.example`)

## 🧩 Tech Stack

- **Express.js 5** - Web framework
- **TypeScript** - Type safety
### Backend Environment Variables
- `PORT` - Backend server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_EXPIRES_IN` - JWT expiration time
- `PAYSTACK_SECRET_KEY` - Paystack API secret key
- `PAYSTACK_PUBLIC_KEY` - Paystack API public key
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Blob Storage
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase API key
- `FRONTEND_URL` - Frontend URL for CORS

## 🧩 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js 5.2** - Web framework
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Pino** - Logging
- **ESLint** - Code linting

## 📋 Development Guidelines

- Follow TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper error handling and logging
- Add authentication middleware to protected routes
- Use service layer for business logic
- Keep controllers thin - delegate to services
- Write database queries using Drizzle ORM
- Follow RESTful API design principles
- Document API endpoints with comments
- **Pino** - Logging
- **Multer** - File uploads
- **Paystack** - Payment processing

### DevOps & Monitoring
- **Sentry** - Error tracking
- **Datadog** - APM and tracing (optional)
- **Drizzle Kit** - Database migrations

## 📋 Development Guidelines

### Backend Development
- Use async/await for asynchronous operations
- Use Drizzle ORM for all database operations
- Implement proper error handling with try-catch
- Use Pino logger for logging (not console.log)
- Follow REST API conventions
- Validate all inputs using schemas
- Use JWT for authentication
- Implement rate limiting for sensitive endpoints
- Use transactions for multi-step database operations
- Write service layer functions for business logic

### General Guidelines
- Write clear commit messages
- Update documentation when adding features
- Run linting before committing
- Test your changes locally
- Follow security best practices

## 🔧 Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `drizzle.config.ts` - Drizzle ORM configuration
- `.eslintrc.cjs` - ESLint configuration
- `.env.example` - Environment variables template

## 🔗 Related Repositories

- **Frontend Repository**: [Link to frontend repo when available]

## 📚 Documentation

- [Authentication System Design](./AUTHENTICATION_SYSTEM_DESIGN.md)
- [Authorization Guide](./AUTHORIZATION_ENFORCEMENT_GUIDE.md)
- [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md)
- [Email System Documentation](./EMAIL_SYSTEM_DOCUMENTATION.md)
- [API Documentation](./DOCUMENTATION_INDEX.md)

## 📄 License

This project is private and proprietary.
