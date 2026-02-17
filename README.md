# Fafa Access Backend

A production-ready backend API server built with Express.js, TypeScript, PostgreSQL, and Drizzle ORM. This repository contains the backend services for the Fafa Access application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 14+ database
- Environment variables configured (see `.env.example`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Gordon28533/fafa-access-backend.git
cd fafa-access-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start the backend server:
```bash
npm run server:dev
```

The API server will be available at `http://localhost:5000`

## 📁 Project Structure

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
