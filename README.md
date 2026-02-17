# Fafa Access

A student laptop access platform with separated frontend and backend.

## 📁 Repository Structure

This repository is organized into two main directories:

```
.
├── frontend/     # React frontend application
├── backend/      # Node.js/Express backend API
└── README.md     # This file
```

### Frontend

The frontend is a React application built with TypeScript and Vite.

**Location:** `./frontend/`

**Quick Start:**
```bash
cd frontend
npm install
npm run dev
```

See [frontend/README.md](frontend/README.md) for detailed documentation.

### Backend

The backend is a Node.js/Express API with PostgreSQL database.

**Location:** `./backend/`

**Quick Start:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:migrate
npm run dev
```

See [backend/README.md](backend/README.md) for detailed documentation.

## 🚀 Full Stack Development

To run both frontend and backend together:

1. **Start the backend:**
```bash
cd backend
npm install
npm run dev
```

2. **In a new terminal, start the frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend (http://localhost:5173) will proxy API requests to the backend (http://localhost:3000).

## 🧩 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Recharts

### Backend
- Node.js
- Express
- PostgreSQL
- Drizzle ORM
- JWT Authentication
- TypeScript

## 📋 Development Workflow

1. Backend changes should be made in the `backend/` directory
2. Frontend changes should be made in the `frontend/` directory
3. Each directory has its own `package.json` and dependencies
4. Test both frontend and backend independently

## 🔒 Security

- Backend implements JWT authentication
- Rate limiting on all API endpoints
- Input sanitization and validation
- SQL injection protection
- XSS protection

## 📄 License

This project is private and proprietary.
