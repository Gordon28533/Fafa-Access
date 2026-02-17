# Frontend Files Migration Notes

## Current Status

This repository currently contains both backend and frontend code in a monorepo structure. The following frontend files are present:

### Frontend Application Files
- `src/App.tsx` - Main React application component
- `src/main.tsx` - React application entry point
- `src/components/` - React UI components
- `src/pages/` - React page components
- `src/layouts/` - React layout components
- `src/hooks/` - React custom hooks
- `src/contexts/` - React context providers
- `src/assets/` - Static assets
- `src/styles/` - CSS/styling files

### Frontend Configuration Files
- `index.html` - HTML entry point for Vite
- `vite.config.ts` - Vite build configuration
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.js` - Tailwind CSS configuration

### Frontend Dependencies (in package.json)
- React 18
- React DOM
- React Router DOM
- Vite
- Tailwind CSS
- Lucide React (icons)
- Recharts

## Migration Options

### Option 1: Keep Both (Current State)
**Pros:**
- Easier development with everything in one place
- Single deployment if needed
- Shared dependencies

**Cons:**
- Larger repository size
- Confused purpose
- Cannot scale independently
- Mixed concerns

### Option 2: Move Frontend to Separate Repository (Recommended)
**Pros:**
- Clear separation of concerns
- Independent deployment
- Better scalability
- Cleaner codebase
- Team can work independently

**Cons:**
- Need to coordinate between repos
- More repos to manage
- API contract must be well-defined

### Option 3: Create Separate Branches
**Pros:**
- Single repository with clear branches
- Easy to see full history

**Cons:**
- Still in same repo
- Deployment complexity
- Not truly independent

## Recommended: Migrate Frontend to Separate Repository

### Step 1: Create New Frontend Repository

1. Create new repository: `fafa-access-frontend`
2. Initialize with README
3. Set up basic structure

### Step 2: Copy Frontend Files

Copy these directories and files to the new frontend repository:

```
# Directories to copy
src/components/
src/pages/
src/layouts/
src/hooks/
src/contexts/
src/assets/
src/styles/
src/types/ (only frontend types)

# Files to copy
src/App.tsx
src/main.tsx
src/vite-env.d.ts
index.html
vite.config.ts
postcss.config.js
tailwind.config.js
.eslintrc.cjs (frontend rules)
tsconfig.json (adjust for frontend only)
tsconfig.node.json
package.json (extract frontend dependencies)
.env.example (frontend vars only)
```

### Step 3: Update Frontend Repository

In the new frontend repository:

1. **Update package.json**
   ```json
   {
     "name": "fafa-access-frontend",
     "description": "Frontend application for Fafa Access",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "lint": "eslint . --ext ts,tsx"
     },
     "dependencies": {
       "react": "^18.2.0",
       "react-dom": "^18.2.0",
       "react-router-dom": "^6.20.0",
       "lucide-react": "^0.563.0",
       "recharts": "^3.7.0"
     },
     "devDependencies": {
       "@vitejs/plugin-react": "^4.2.1",
       "vite": "^7.3.1",
       "typescript": "^5.2.2",
       "tailwindcss": "^3.4.19",
       "postcss": "^8.5.6",
       "autoprefixer": "^10.4.23"
     }
   }
   ```

2. **Update .env.example**
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=Fafa Access
   VITE_ENABLE_ANALYTICS=false
   ```

3. **Create services/api.ts** for backend communication
   ```typescript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
   
   export const api = {
     get: (endpoint: string) => fetch(`${API_URL}${endpoint}`),
     post: (endpoint: string, data: any) => fetch(`${API_URL}${endpoint}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data)
     }),
     // ... more methods
   };
   ```

4. **Create README.md** for frontend
   - Installation instructions
   - Development server setup
   - Build process
   - Environment variables
   - Link to backend repository

### Step 4: Clean Up Backend Repository

After confirming frontend works independently:

1. **Remove frontend files from backend repo**
   ```bash
   git rm -r src/components
   git rm -r src/pages
   git rm -r src/layouts
   git rm -r src/hooks
   git rm -r src/contexts
   git rm -r src/assets
   git rm src/App.tsx
   git rm src/main.tsx
   git rm src/vite-env.d.ts
   git rm index.html
   git rm vite.config.ts
   git rm postcss.config.js
   git rm tailwind.config.js
   ```

2. **Update package.json** - remove frontend dependencies
   ```bash
   npm uninstall react react-dom react-router-dom lucide-react recharts
   npm uninstall vite @vitejs/plugin-react tailwindcss postcss autoprefixer
   ```

3. **Update scripts in package.json**
   Remove: `dev`, `build`, `preview` (frontend scripts)
   Keep: `server:dev`, `start`, `db:*` (backend scripts)

4. **Commit changes**
   ```bash
   git add .
   git commit -m "Remove frontend code (moved to fafa-access-frontend repo)"
   git push
   ```

### Step 5: Update Documentation

1. **In backend repository (this repo)**
   - Update README.md with link to frontend repo
   - Update BACKEND_REPOSITORY.md with frontend repo link
   - Add note about API endpoints for frontend

2. **In frontend repository**
   - Document API integration
   - Link to backend repository
   - Document environment variables
   - Add deployment guide

### Step 6: Configure CORS

In backend `.env`, add frontend URL:
```
CORS_ORIGIN=http://localhost:5173,https://your-frontend-domain.com
```

Update `src/server.js` CORS configuration to allow frontend origin.

## Files That Belong in Backend Only

Keep these in the backend repository:
```
src/
├── server.js            ✓ Backend
├── routes/             ✓ Backend
├── controllers/        ✓ Backend
├── services/ (backend) ✓ Backend
├── middleware/         ✓ Backend
├── db/                 ✓ Backend
├── schemas/            ✓ Backend
├── email-templates/    ✓ Backend
├── utils/ (backend)    ✓ Backend
└── types/ (backend)    ✓ Backend
```

## Files That Belong in Frontend Only

Move these to frontend repository:
```
src/
├── App.tsx             → Frontend
├── main.tsx            → Frontend
├── components/         → Frontend
├── pages/              → Frontend
├── layouts/            → Frontend
├── hooks/              → Frontend
├── contexts/           → Frontend
├── assets/             → Frontend
├── styles/             → Frontend
└── types/ (frontend)   → Frontend

Root files:
├── index.html          → Frontend
├── vite.config.ts      → Frontend
├── postcss.config.js   → Frontend
└── tailwind.config.js  → Frontend
```

## Shared Files

Some files might need to be in both repositories:
- `.eslintrc.cjs` (with appropriate rules for each)
- `tsconfig.json` (configured for each environment)
- `.env.example` (with relevant variables for each)
- `.gitignore` (with relevant patterns for each)

## Testing After Migration

### Backend Tests
```bash
cd fafa-access-backend
npm install
npm run db:migrate
npm run server:dev
# Test: http://localhost:5000/api/health
```

### Frontend Tests
```bash
cd fafa-access-frontend
npm install
# Update .env with VITE_API_URL=http://localhost:5000/api
npm run dev
# Test: http://localhost:5173
```

### Integration Tests
1. Start backend server
2. Start frontend dev server
3. Test login flow
4. Test API calls from frontend
5. Verify CORS is working
6. Test authentication
7. Test all major features

## Timeline

**Recommended approach:**

1. **Phase 1 (Current)**: Update documentation and rename repository
2. **Phase 2**: Create frontend repository and migrate files
3. **Phase 3**: Clean up backend repository
4. **Phase 4**: Update deployment configurations
5. **Phase 5**: Full testing and verification

## Questions to Answer Before Migration

1. Where will frontend be deployed? (Vercel, Netlify, Cloudflare Pages?)
2. Where is backend deployed? (Render, Railway, AWS?)
3. What is the production API URL?
4. Who will maintain frontend vs backend?
5. How will versions be coordinated?
6. What is the deployment process for each?

## Support

For help with the migration:
1. Review this document thoroughly
2. Check [BACKEND_REPOSITORY.md](./BACKEND_REPOSITORY.md)
3. Check [REPOSITORY_RENAME_GUIDE.md](./REPOSITORY_RENAME_GUIDE.md)
4. Contact the development team
5. Create an issue if you encounter problems

## Status

**Current**: Repository contains both frontend and backend code
**Target**: Separate repositories for frontend and backend
**Progress**: Documentation updated, rename pending
**Next Steps**: See [REPOSITORY_RENAME_GUIDE.md](./REPOSITORY_RENAME_GUIDE.md)
