# 🚀 Render Quick Start - Get Your Backend API URL

## TL;DR - Finding Your Backend API URL

When you deploy your backend to Render, your **Backend API URL** will be:

```
https://<your-backend-service-name>.onrender.com/api
```

**Example:**
- If your service is named `fafa-access-api`
- Your full API URL is: `https://fafa-access-api.onrender.com/api`
- Use this as `VITE_API_URL` in your frontend environment variables

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     RENDER DEPLOYMENT                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐         ┌───────────────────┐    │
│  │   PostgreSQL     │◄────────│  Backend Service  │    │
│  │   Database       │         │  (Express.js)     │    │
│  │                  │         │                   │    │
│  │ fafa-access-db   │         │ fafa-access-api   │    │
│  └──────────────────┘         └─────────▲─────────┘    │
│                                          │               │
│                                          │               │
│                         https://fafa-access-api         │
│                               .onrender.com/api          │
│                                          │               │
│                                          │               │
│  ┌──────────────────────────────────────┼──────┐       │
│  │        Frontend Service              │      │       │
│  │        (React + Vite)                │      │       │
│  │                                      │      │       │
│  │  VITE_API_URL=https://fafa-access-api       │       │
│  │                .onrender.com/api     │      │       │
│  │                                             │       │
│  │  fafa-access-frontend                      │       │
│  └─────────────────────────────────────────────┘       │
│                                                          │
│      https://fafa-access-frontend.onrender.com          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Users access: https://fafa-access-frontend.onrender.com
Frontend calls: https://fafa-access-api.onrender.com/api
Backend connects to: PostgreSQL database
```

---

## Quick Deployment Steps

### 1. Deploy Backend (5 minutes)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create **PostgreSQL Database**
   - Name: `fafa-access-db`
   - Copy the connection URL
3. Create **Web Service** (Backend)
   - Connect GitHub repo
   - Name: `fafa-access-api` (or your choice)
   - Build: `npm install`
   - Start: `npm start`
   - Add environment variables:
     ```env
     NODE_ENV=production
     PORT=3000
     DATABASE_URL=<paste your database URL>
     JWT_SECRET=<generate random string>
     FRONTEND_URL=https://your-frontend.onrender.com
     ```
4. Deploy and wait
5. **Your backend URL**: `https://fafa-access-api.onrender.com`
6. **Your API URL**: `https://fafa-access-api.onrender.com/api` ⭐

### 2. Deploy Frontend (5 minutes)

1. Create **Web Service** (Frontend)
   - Same GitHub repo
   - Name: `fafa-access-frontend` (or your choice)
   - Build: `npm install && npm run build`
   - Start: `npx serve -s dist -l 3000`
   - Add environment variable:
     ```env
     VITE_API_URL=https://fafa-access-api.onrender.com/api
     ```
2. Deploy and wait
3. **Your frontend URL**: `https://fafa-access-frontend.onrender.com`

### 3. Update Backend (2 minutes)

Go back to backend service and update:
```env
FRONTEND_URL=https://fafa-access-frontend.onrender.com
```

---

## Where to Use the API URL

### In Render Dashboard (Frontend)
Set environment variable:
```env
VITE_API_URL=https://fafa-access-api.onrender.com/api
```

### In Local .env.production File
```env
VITE_API_URL=https://fafa-access-api.onrender.com/api
```

### Testing Your API
Visit: `https://fafa-access-api.onrender.com/health`

Should return:
```json
{"status":"ok","timestamp":"..."}
```

---

## Common Questions

**Q: What is backend-api.com/api?**
A: That's a placeholder example. Your actual URL will be `https://<your-service-name>.onrender.com/api`

**Q: How do I find my service name?**
A: Look in your Render Dashboard at the top of your backend service page

**Q: Can I use a custom domain?**
A: Yes! Go to Service Settings → Custom Domain and add your domain (e.g., `api.yourdomain.com`)

**Q: Why do I need /api at the end?**
A: Your Express backend routes are all under the `/api` path. The frontend needs the complete base URL.

**Q: My API isn't responding**
A: Free tier services sleep after inactivity. Wait 30 seconds for it to wake up on first request.

---

## Full Documentation

For complete step-by-step guide with screenshots and troubleshooting, see:
- [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) - Detailed Render deployment
- [GO_LIVE_GUIDE.md](./GO_LIVE_GUIDE.md) - Multiple deployment options

---

## Need Help?

1. Check backend logs in Render Dashboard → Logs tab
2. Verify environment variables are set correctly
3. Test health endpoint: `https://your-backend.onrender.com/health`
4. Check frontend console for CORS errors
5. Review [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) troubleshooting section
