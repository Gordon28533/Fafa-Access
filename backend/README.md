# Fafa Access - Backend

The backend API for Fafa Access, a student laptop access platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
 ├─ routes/          # API route definitions
 ├─ controllers/     # Request handlers
 ├─ services/        # Business logic layer
 ├─ middleware/      # Express middleware
 ├─ db/              # Database configuration and migrations
 ├─ schemas/         # Data schemas
 ├─ templates/       # Email and notification templates
 ├─ email-templates/ # Email template files
 ├─ lib/             # Shared libraries
 └─ server.js        # Express server entry point
```

## 🛠️ Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with test data

## 🧩 Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Pino** - Logging
- **Azure Blob Storage** - Document storage
- **Supabase** - Additional services

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on all API endpoints
- Helmet security headers
- Input sanitization
- SQL injection protection via ORM
- XSS protection
- CSRF protection

## 📡 API Documentation

The API follows RESTful conventions:

- Authentication: `/api/auth/*`
- Applications: `/api/applications/*`
- Users: `/api/users/*`
- Universities: `/api/universities/*`
- Payments: `/api/payments/*`
- Commissions: `/api/commissions/*`
- And more...

## 🗄️ Database

Using PostgreSQL with Drizzle ORM for type-safe database operations.

### Migrations

Generate a new migration:
```bash
npm run db:generate
```

Apply migrations:
```bash
npm run db:migrate
```

### Database Studio

Open Drizzle Studio to explore your database:
```bash
npm run db:studio
```

## 📄 License

This project is private and proprietary.
