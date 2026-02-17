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

Edit the `.env` file and set at minimum:
```env
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/fafa_access
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000/api
```

4. Set up the database:
```bash
npm run db:migrate
npm run db:seed
```

5. Start the backend server:
```bash
npm run server:dev
```

6. In a separate terminal, start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`
The backend API will be available at `http://localhost:3000/api`

## 📁 Project Structure

```
src/
 ├─ components/      # Reusable UI components
 ├─ pages/          # Page components
 ├─ layouts/        # Layout components
 ├─ services/       # API and service layer
 ├─ hooks/          # Custom React hooks
 ├─ utils/          # Utility functions
 ├─ styles/         # Global styles and CSS
 ├─ assets/         # Static assets (images, fonts, etc.)
 ├─ types/          # TypeScript type definitions
 ├─ controllers/    # Backend API controllers
 ├─ routes/         # Backend API routes
 ├─ middleware/     # Backend middleware
 ├─ db/             # Database configuration and migrations
 └─ server.js       # Backend Express server
```

## 🛠️ Available Scripts

### Frontend Scripts
- `npm run dev` - Start frontend development server (Vite)
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts
- `npm start` - Start backend server (production)
- `npm run server` - Start backend server
- `npm run server:dev` - Start backend server in development mode with auto-reload

### Database Scripts
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate new migrations
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

### Frontend Variables
- `VITE_API_URL` - Backend API base URL (e.g., `http://localhost:3000/api` for development, `https://your-backend.onrender.com/api` for production)
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version
- `VITE_ENABLE_ANALYTICS` - Enable analytics (true/false)

### Backend Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `COOKIE_SECRET` - Secret key for cookie encryption
- `FRONTEND_URL` - Frontend URL for CORS (e.g., `http://localhost:5173` for development)
- `SENDGRID_API_KEY` - SendGrid API key for email notifications (optional)
- `EMAIL_FROM` - Email sender address (optional)

See `.env.example` for a complete list of environment variables.

## 🧩 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

### Backend
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Drizzle ORM** - Database ORM
- **JWT** - Authentication
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting

### DevOps & Tools
- **ESLint** - Code linting
- **Drizzle Kit** - Database migrations
- **Pino** - Logging
- **Sentry** - Error tracking (optional)

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

## 🚀 Deployment

### Deploy to Render

For detailed instructions on deploying to Render.com, see the [Render Deployment Guide](./RENDER_DEPLOYMENT_GUIDE.md).

**Quick Summary:**
- Deploy backend as Web Service with Node runtime
- Deploy frontend as Web Service with static site serving
- Configure PostgreSQL database
- Set environment variables (especially `VITE_API_URL` for frontend)

**Your Backend API URL will be:**
```
https://<your-backend-service-name>.onrender.com/api
```

For other deployment options (Vercel, Railway, AWS), see the [Go Live Guide](./GO_LIVE_GUIDE.md).

## 📄 License

This project is private and proprietary.
