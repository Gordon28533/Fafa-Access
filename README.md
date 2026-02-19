# Fafa Access Backend

Backend API for the Fafa Access platform.

## Tech Stack

- Node.js + Express
- Drizzle ORM + PostgreSQL
- TypeScript tooling (`tsx`) for runtime scripts

## Quick Start

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

## Notes

This repository is backend-only. Frontend is maintained in a separate repository.
