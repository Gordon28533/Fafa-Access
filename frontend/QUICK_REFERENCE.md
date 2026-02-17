# 🚀 Quick Reference - Frontend Repository Setup

## Create New Repository on GitHub

1. Go to https://github.com
2. Click **"+"** → **"New repository"**
3. Name: `Fafa-Access-Frontend` (or your choice)
4. Description: `Frontend application for Fafa Access - Student Laptop Access Platform`
5. **DO NOT** initialize with README/gitignore/license
6. Click **"Create repository"**

## Setup Options

### 🤖 Automated (Recommended)

```bash
cd frontend
./init-repo.sh https://github.com/YOUR_USERNAME/Fafa-Access-Frontend.git
```

### ✋ Manual

```bash
cd frontend
git init
git add .
git commit -m "Initial commit: Fafa Access Frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Fafa-Access-Frontend.git
git push -u origin main
```

## After Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development
npm run dev
```

## Available Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Build for production → dist/
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `SETUP_NEW_REPO.md` | Detailed setup guide |
| `CONTRIBUTING.md` | Development guidelines |
| `DEPLOYMENT.md` | Deployment instructions |
| `CHECKLIST.md` | Verification checklist |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Fafa Access
VITE_ENV=development
```

## Deployment

### Vercel (Easiest)
1. Push to GitHub
2. Visit vercel.com
3. Import project
4. Auto-configured! ✅

### Others
See `DEPLOYMENT.md` for:
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Docker

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- Recharts (charts)
- Lucide React (icons)

## Project Structure

```
src/
├── components/  # Reusable components
├── pages/       # Page components
├── hooks/       # Custom hooks
├── contexts/    # React contexts
├── services/    # API layer
├── utils/       # Utilities
├── styles/      # CSS
└── types/       # TypeScript types
```

## Help

- 📖 Full guide: `SETUP_NEW_REPO.md`
- 🤝 Contributing: `CONTRIBUTING.md`
- 🚀 Deployment: `DEPLOYMENT.md`
- ✅ Checklist: `CHECKLIST.md`

## Common Issues

**Script not executable?**
```bash
chmod +x init-repo.sh
```

**Remote already exists?**
```bash
git remote remove origin
git remote add origin YOUR_URL
```

**Need help?**
Read `SETUP_NEW_REPO.md` for troubleshooting!

---

**Ready?** Run `./init-repo.sh` or follow the manual steps above! 🎉
