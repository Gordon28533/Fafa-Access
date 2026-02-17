# Fafa Access - Frontend

The frontend application for Fafa Access, a student laptop access platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
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
 ├─ services/       # API service layer
 ├─ hooks/          # Custom React hooks
 ├─ contexts/       # React contexts
 ├─ utils/          # Utility functions
 ├─ styles/         # Global styles and CSS
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

## 🧩 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons

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
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

## 🌐 API Integration

The frontend connects to the backend API running on `http://localhost:3000` (in development).

Configure the API URL via environment variables if needed.

## 📄 License

This project is private and proprietary.
