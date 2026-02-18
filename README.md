# Fafa Access

**This repository contains the Fafa Access Backend** (Express.js REST API) + Frontend (React + TypeScript).

A production-ready full-stack web application for laptop access management in Nigerian universities.

---

## 🔍 Looking for the Backend?

**✅ YOU'RE IN THE RIGHT PLACE!** 

This repository contains:
- ✅ **Backend**: Express.js REST API server (`src/server.js`)
- ✅ **Frontend**: React + TypeScript SPA (`src/main.tsx`, `src/App.tsx`)
- ✅ **Database**: PostgreSQL with Drizzle ORM
- ✅ **Full Backend Infrastructure**: 23 routes, 24 controllers, 31+ services

See [REPOSITORY_IDENTIFICATION.md](./REPOSITORY_IDENTIFICATION.md) for detailed backend documentation.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "New folder"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

This is a **full-stack monorepo** with both frontend and backend in the same codebase.

```
src/
 ├─ server.js           # 🔴 Backend Express.js server (main entry point)
 ├─ routes/            # 🔴 Backend API routes (23 files)
 ├─ controllers/       # 🔴 Backend controllers (24 files)
 ├─ services/          # 🔴 Backend services (31+ files)
 ├─ middleware/        # 🔴 Backend middleware (auth, security, etc.)
 ├─ db/                # 🔴 Database layer (Drizzle ORM + PostgreSQL)
 ├─ schemas/           # 🔴 Database schemas
 ├─ utils/             # 🔴 Backend utilities
 │
 ├─ App.tsx            # 🔵 Frontend React app
 ├─ main.tsx           # 🔵 Frontend entry point
 ├─ components/        # 🔵 Frontend React components
 ├─ pages/             # 🔵 Frontend page components
 ├─ layouts/           # 🔵 Frontend layout components
 ├─ hooks/             # 🔵 Frontend custom React hooks
 ├─ contexts/          # 🔵 Frontend React contexts
 ├─ styles/            # 🔵 Frontend styles (CSS/Tailwind)
 ├─ assets/            # 🔵 Frontend static assets
 └─ types/             # 🔵 TypeScript type definitions
```

🔴 = Backend (Express.js)  
🔵 = Frontend (React + TypeScript)

## 🛠️ Available Scripts

### Backend Scripts
- `npm start` - Start backend server (production)
- `npm run server` - Start backend server (development)
- `npm run server:dev` - Start backend with auto-reload (watch mode)
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with initial data

### Frontend Scripts
- `npm run dev` - Start frontend development server (Vite)
- `npm run build` - Build frontend for production
- `npm run preview` - Preview frontend production build

### General Scripts
- `npm run lint` - Run ESLint on both frontend and backend

## 🏗️ Build

### Backend
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
The build output will be in the `dist` folder.

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

### Frontend Environment Variables
- `VITE_API_URL` - Backend API base URL (e.g., http://localhost:5000/api)
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version
- `VITE_ENABLE_ANALYTICS` - Enable analytics (true/false)
- `VITE_PAYSTACK_PUBLIC_KEY` - Paystack public key for frontend

## 🧩 Tech Stack

### Backend (Express.js API)
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

### Frontend (React SPA)
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons

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

### Frontend Development
- Follow TypeScript best practices
- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Place reusable components in `src/components/`
- Place page-specific components in `src/pages/`
- Use the API service layer for all HTTP requests
- Follow the existing folder structure
- Use Tailwind CSS for styling
- Implement proper error handling and loading states

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
