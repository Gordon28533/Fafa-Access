# Frontend Migration Guide

## Overview

This guide provides complete instructions for migrating all frontend code from the `Fafa-Access` backend repository to a new `fafa-access-frontend` repository.

---

## 📋 What Needs to Be Moved

### 1. Frontend Source Code (96 files)

#### Main Entry Points
```
src/App.tsx                 # Main React application component
src/main.tsx                # React entry point (ReactDOM.render)
```

#### Component Directories
```
src/components/             # 58+ React components
  ├── common/               # Common components (Footer, HowItWorks, etc.)
  ├── auth/                 # Authentication components
  ├── admin/                # Admin dashboard components
  ├── application/          # Application-related components
  ├── apply/                # Application form components
  ├── laptop/               # Laptop catalog components
  ├── src/                  # SRC-specific components
  ├── status/               # Status display components
  └── student/              # Student dashboard components
```

#### Page Components (30 pages)
```
src/pages/
  ├── HomePage.tsx                      # Landing page
  ├── LoginPage.jsx                     # User login
  ├── RegisterPage.jsx                  # User registration
  ├── StudentDashboard.jsx              # Student main dashboard
  ├── AdminDashboard.jsx                # Admin main dashboard
  ├── SRCDashboard.jsx                  # SRC dashboard
  ├── AdminAnalyticsDashboard.tsx       # Analytics & reporting
  ├── LaptopInventoryPage.jsx           # Laptop management
  ├── LaptopCatalog.jsx                 # Browse laptops
  ├── LaptopDetails.jsx                 # Laptop details page
  ├── ApplicationDetailPage.jsx         # Application details
  ├── StudentProfile.jsx                # Student profile page
  ├── StudentSettings.jsx               # Student settings
  ├── StudentSecuritySettings.jsx       # Security settings
  ├── NotificationPreferences.jsx       # Notification preferences
  ├── SupportTickets.jsx                # Support system
  ├── DeliveryQueue.jsx                 # Delivery management
  ├── DeliveryPerformancePanel.tsx      # Delivery analytics
  ├── FinancialAnalyticsPanel.tsx       # Financial analytics
  ├── UniversityPerformancePanel.tsx    # University analytics
  ├── SrcAccountabilityPanel.tsx        # SRC accountability
  ├── AdminAuditLogViewer.tsx           # Audit log viewer
  ├── AdminProductManagement.jsx        # Product management
  ├── ExportModal.tsx                   # Export functionality
  ├── EmailVerificationPage.jsx         # Email verification
  ├── ForgotPasswordPage.jsx            # Password reset request
  ├── ResetPasswordPage.jsx             # Password reset form
  ├── NotFoundPage.jsx                  # 404 page
  └── UnauthorizedPage.jsx              # 403 page
```

#### Other Frontend Directories
```
src/layouts/                # Layout components
  └── Layout.tsx            # Main layout wrapper

src/hooks/                  # Custom React hooks
  └── (hook files)          # useAuth, useApi, etc.

src/contexts/               # React Context providers
  └── (context files)       # AuthContext, etc.

src/assets/                 # Static assets
  └── (images, icons)       # SVG, PNG files

src/styles/                 # CSS stylesheets (9 files)
  ├── index.css             # Main stylesheet
  ├── design-system.css     # Design system styles
  ├── admin-analytics.css   # Admin analytics styles
  ├── audit-log.css         # Audit log styles
  ├── delivery-analytics.css # Delivery analytics styles
  ├── export-modal.css      # Export modal styles
  ├── financial-analytics.css # Financial analytics styles
  ├── src-accountability.css # SRC accountability styles
  └── university-analytics.css # University analytics styles
```

### 2. Frontend Configuration Files (Need to be recreated)

The following files were previously removed and need to be recreated in the frontend repo:

```
postcss.config.js           # PostCSS configuration
tailwind.config.js          # Tailwind CSS configuration
vite.config.ts              # Vite bundler configuration
index.html                  # HTML entry point
tsconfig.json               # TypeScript configuration (frontend-focused)
.eslintrc.cjs              # ESLint configuration (React rules)
```

### 3. Frontend Documentation
```
FRONTEND_AUTH_COMPLETE.md            # Frontend authentication documentation
STUDENT_PAYMENT_FLOW_FRONTEND.md     # Payment flow documentation
```

---

## 🏗️ Setting Up the New Frontend Repository

### Step 1: Create the Repository Structure

```bash
# Create new frontend repository
mkdir fafa-access-frontend
cd fafa-access-frontend
git init

# Create directory structure
mkdir -p src/{components,pages,layouts,hooks,contexts,assets,styles,lib,types,services}
mkdir -p public
```

### Step 2: Initialize Package.json

Create `package.json`:

```json
{
  "name": "fafa-access-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "lucide-react": "^0.563.0",
    "recharts": "^3.7.0",
    "@datadog/browser-logs": "^6.26.0",
    "@datadog/browser-rum": "^6.26.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.19",
    "typescript": "^5.2.2",
    "vite": "^7.3.1"
  }
}
```

### Step 3: Create Configuration Files

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
    },
    cors: {
      origin: 'localhost',
      credentials: true,
    },
  },
})
```

#### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### `postcss.config.js`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

#### `.eslintrc.cjs`
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
```

#### `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fafa Access - Laptop Access Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 4: Copy Frontend Files

Copy the following from the backend repository:

```bash
# From the backend repo directory
cd /path/to/Fafa-Access

# Copy to frontend repo
cp src/App.tsx ../fafa-access-frontend/src/
cp src/main.tsx ../fafa-access-frontend/src/
cp -r src/components ../fafa-access-frontend/src/
cp -r src/pages ../fafa-access-frontend/src/
cp -r src/layouts ../fafa-access-frontend/src/
cp -r src/hooks ../fafa-access-frontend/src/
cp -r src/contexts ../fafa-access-frontend/src/
cp -r src/assets ../fafa-access-frontend/src/
cp -r src/styles ../fafa-access-frontend/src/

# Copy types if they're frontend-related
cp -r src/types ../fafa-access-frontend/src/

# Copy documentation
cp FRONTEND_AUTH_COMPLETE.md ../fafa-access-frontend/
cp STUDENT_PAYMENT_FLOW_FRONTEND.md ../fafa-access-frontend/
```

### Step 5: Create API Service Layer

Create `src/services/api.ts` in the frontend repo:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Important for cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  },

  get(endpoint: string) {
    return this.fetch(endpoint);
  },

  post(endpoint: string, data: any) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(endpoint: string, data: any) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint: string) {
    return this.fetch(endpoint, {
      method: 'DELETE',
    });
  },
};
```

### Step 6: Environment Variables

Create `.env.example`:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=Fafa Access
VITE_APP_VERSION=1.0.0

# Features
VITE_ENABLE_ANALYTICS=false

# Paystack (for frontend)
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here

# Monitoring (optional)
VITE_DATADOG_APPLICATION_ID=
VITE_DATADOG_CLIENT_TOKEN=
VITE_SENTRY_DSN=
```

Create `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Fafa Access
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=false
```

### Step 7: Create README

Create `README.md`:

```markdown
# Fafa Access Frontend

React + TypeScript frontend for the Fafa Access laptop management system.

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running at http://localhost:5000

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your backend API URL
   \`\`\`

3. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

   The app will be available at http://localhost:5173

## Project Structure

\`\`\`
src/
├── components/     # Reusable React components
├── pages/          # Page components
├── layouts/        # Layout components
├── hooks/          # Custom React hooks
├── contexts/       # React Context providers
├── services/       # API service layer
├── assets/         # Static assets
├── styles/         # CSS stylesheets
├── types/          # TypeScript type definitions
├── App.tsx         # Main application component
└── main.tsx        # Application entry point
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build
- \`npm run lint\` - Run ESLint

## Backend Integration

The frontend communicates with the backend API at the URL specified in \`VITE_API_URL\`.

API endpoints are proxied through Vite in development:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Requests to /api/* are proxied to the backend

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The production build will be in the \`dist/\` directory.

## Deployment

### Deploy to Vercel/Netlify

1. Connect your repository
2. Set environment variables:
   - \`VITE_API_URL\` - Your production backend URL
3. Build command: \`npm run build\`
4. Output directory: \`dist\`

## Tech Stack

- React 18
- TypeScript
- Vite (build tool)
- React Router (routing)
- Tailwind CSS (styling)
- Recharts (charts)
- Lucide React (icons)
```

### Step 8: Create .gitignore

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
*.log
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

---

## 🔗 Frontend-Backend Integration

### API Communication

The frontend communicates with the backend through REST API endpoints:

**Base URL**: `http://localhost:5000/api` (development)

### Key API Endpoints

```
Authentication:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me

Applications:
  GET    /api/applications
  POST   /api/applications
  GET    /api/applications/:id
  PUT    /api/applications/:id

Payments:
  POST   /api/payments/initialize
  GET    /api/payments/verify/:reference
  GET    /api/payments/history

Laptops:
  GET    /api/laptops
  GET    /api/laptops/:id
  POST   /api/laptops (admin)
  PUT    /api/laptops/:id (admin)

Admin:
  GET    /api/admin/analytics
  GET    /api/admin/payments
  GET    /api/admin/universities
  GET    /api/admin/audit-logs
```

### Authentication

The application uses **JWT tokens stored in HTTP-only cookies**:

1. Login: User credentials sent to `/api/auth/login`
2. Backend returns JWT in HTTP-only cookie
3. Frontend makes authenticated requests with cookies automatically included
4. Backend validates JWT from cookie on each request

### CORS Configuration

The backend must allow the frontend origin:

```javascript
// In backend server.js
const ALLOWED_ORIGINS = [
  'http://localhost:5173',  // Vite dev server
  'https://your-frontend-domain.com'  // Production
];
```

---

## 📦 Installation Steps Summary

```bash
# 1. Create and initialize frontend repository
mkdir fafa-access-frontend
cd fafa-access-frontend
git init
npm init -y

# 2. Install dependencies
npm install react react-dom react-router-dom lucide-react recharts @datadog/browser-logs @datadog/browser-rum

# 3. Install dev dependencies
npm install -D @types/react @types/react-dom @typescript-eslint/eslint-plugin @typescript-eslint/parser @vitejs/plugin-react autoprefixer eslint eslint-plugin-react-hooks eslint-plugin-react-refresh postcss tailwindcss typescript vite

# 4. Create configuration files (vite.config.ts, tailwind.config.js, etc.)
# 5. Copy frontend files from backend repo
# 6. Set up environment variables
# 7. Test the application

npm run dev
```

---

## 🚀 Running Both Repos

### Terminal 1: Backend
```bash
cd fafa-access-backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### Terminal 2: Frontend
```bash
cd fafa-access-frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## ✅ Verification Checklist

After migration, verify:

- [ ] All frontend files copied successfully
- [ ] Dependencies installed (`npm install` works)
- [ ] Development server starts (`npm run dev`)
- [ ] Frontend loads in browser (http://localhost:5173)
- [ ] API calls reach backend (check Network tab)
- [ ] Authentication works (login/logout)
- [ ] Protected routes work
- [ ] All pages render correctly
- [ ] Styling appears correct (Tailwind CSS)
- [ ] No console errors
- [ ] Production build works (`npm run build`)

---

## 🔄 Next Steps

After successfully setting up the frontend repository:

1. **Remove frontend files from backend repo** (see cleanup guide)
2. **Update backend CORS** to allow frontend origin
3. **Deploy frontend** to Vercel/Netlify
4. **Deploy backend** to Render/Railway/Heroku
5. **Update environment variables** for production
6. **Test end-to-end** with production URLs

---

## 📞 Support

For issues or questions:
- Backend API issues: Check backend repository
- Frontend build issues: Check Vite documentation
- Deployment issues: Check hosting platform docs

---

**Created**: February 18, 2026  
**Repository**: fafa-access-frontend (new)  
**Migration From**: Fafa-Access (backend repo)
