# Fafa Access Backend

Backend API for the Fafa Access platform.
**This repository contains the Fafa Access Backend** - Express.js REST API for laptop access management.

A production-ready backend API for laptop access management in Nigerian universities.

> **✅ Frontend Code Migrated**: All frontend code has been moved to the [fafa-access-frontend](https://github.com/Gordon28533/fafa-access-frontend) repository. See [FRONTEND_MIGRATION_COMPLETE_GUIDE.md](./FRONTEND_MIGRATION_COMPLETE_GUIDE.md) for migration details.

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
npm run dev
```

The backend server will start on `http://localhost:5000`

## Notes

This repository is backend-only. Frontend is maintained in a separate repository.
This is a **backend-only repository**. All frontend code has been moved to a separate repository.

```
src/
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
- `vite.config.ts` - Vite configuration
- `.eslintrc.cjs` - ESLint configuration
- `.env.example` - Environment variables template

## 📄 License

This project is private and proprietary.
