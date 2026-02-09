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

```
src/
 ├─ components/      # Reusable UI components
 ├─ pages/          # Page components
 ├─ layouts/        # Layout components
 ├─ services/       # API and service layer
 ├─ hooks/          # Custom React hooks
 ├─ utils/          # Utility functions
 ├─ styles/          # Global styles and CSS
 ├─ assets/         # Static assets (images, fonts, etc.)
 └─ types/          # TypeScript type definitions
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

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

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **ESLint** - Code linting

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
