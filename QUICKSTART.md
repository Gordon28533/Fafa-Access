# Quick Start Guide

This repository contains the Fafa Access platform, separated into frontend and backend.

## Structure

```
.
├── frontend/       # React frontend application
├── backend/        # Node.js/Express backend API
├── docs/           # Project documentation
├── scripts/        # Utility scripts
└── README.md       # Main documentation
```

## Getting Started

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:migrate
npm run dev
```

Backend will run on http://localhost:3000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:5173

## Development

- See `frontend/README.md` for frontend development guide
- See `backend/README.md` for backend development guide
- See `docs/` for detailed project documentation

## Deployment

### Frontend Deployment
The frontend can be deployed to:
- Vercel
- Netlify
- Any static hosting service

Build command: `npm run build`
Output directory: `dist`

### Backend Deployment
The backend can be deployed to:
- Railway
- Heroku
- Any Node.js hosting service

Start command: `npm start`
Port: 3000 (configurable via PORT env var)

## Need Help?

- Check the `docs/` folder for detailed documentation
- See individual README files in `frontend/` and `backend/`
