# Fafa Access

A production-ready web application built with React, TypeScript, and Vite.

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

This is a full-stack monorepo with both frontend (React) and backend (Express) in the same codebase.

### Frontend Structure (React + TypeScript + Vite)
```
src/
 ├─ components/      # Reusable UI components
 ├─ pages/          # Page components
 ├─ layouts/        # Layout components
 ├─ hooks/          # Custom React hooks
 ├─ utils/          # Utility functions
 ├─ styles/         # Global styles and CSS
 ├─ assets/         # Static assets (images, fonts, etc.)
 ├─ types/          # TypeScript type definitions
 └─ main.tsx        # Frontend entry point
```

### Backend Structure (Express + Node.js)
```
src/
 ├─ server.js           # Backend server entry point
 ├─ routes/            # API route definitions (22 files)
 ├─ controllers/       # Request handlers and business logic (24 files)
 ├─ services/          # Business logic and external integrations (31 files)
 ├─ middleware/        # Express middleware (auth, validation, etc.)
 ├─ db/               # Database configuration and schemas (Drizzle ORM)
 ├─ email-templates/  # Email template files
 └─ schemas/          # Validation schemas
```

### Environment Configuration
```
├─ .env              # Environment variables (DO NOT push to GitHub - already in .gitignore)
├─ .env.example      # Template for environment variables
└─ .env.production   # Production environment template
```

## 🛠️ Available Scripts

### Frontend Scripts
- `npm run dev` - Start Vite development server (frontend)
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts
- `npm run server` - Start backend server
- `npm run server:dev` - Start backend server with watch mode
- `npm start` - Start backend server (production)

### Database Scripts
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with test data

## 🏗️ Build

To create a production build:

```bash
npm run build
```

The build output will be in the `dist` folder.

## 📝 Environment Variables

Create a `.env` file based on `.env.example`:

- `VITE_API_URL` - API base URL
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version
- `VITE_ENABLE_ANALYTICS` - Enable analytics (true/false)

## 🧩 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **ESLint** - Code linting

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Azure Storage** - Document storage

## 📋 Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Place reusable components in `src/components/`
- Place page-specific components in `src/pages/`
- Use the API service layer for all HTTP requests
- Follow the existing folder structure

## 🔧 Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite configuration
- `.eslintrc.cjs` - ESLint configuration
- `.env.example` - Environment variables template

## 📄 License

This project is private and proprietary.
