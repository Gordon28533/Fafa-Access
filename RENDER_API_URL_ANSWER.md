# ✅ ANSWER: Where to Get backend-api.com/api When Using Render

## Direct Answer to Your Question

When you deploy your Fafa Access backend to Render, **backend-api.com/api** becomes:

```
https://<your-backend-service-name>.onrender.com/api
```

## Example

If you name your backend service `fafa-access-api` on Render:

**Your Backend API URL will be:**
```
https://fafa-access-api.onrender.com/api
```

**Use this URL in your frontend by setting:**
```env
VITE_API_URL=https://fafa-access-api.onrender.com/api
```

## How to Get This URL

1. **Deploy your backend to Render**
   - Create a Web Service on Render
   - Connect your GitHub repository
   - Name it something like `fafa-access-api`
   - Set build command: `npm install`
   - Set start command: `npm start`

2. **Find your backend URL**
   - Once deployed, Render shows your service URL at the top of the page
   - It will be: `https://fafa-access-api.onrender.com`
   - Add `/api` to get: `https://fafa-access-api.onrender.com/api`

3. **Use it in your frontend**
   - In Render frontend service environment variables, add:
   ```env
   VITE_API_URL=https://fafa-access-api.onrender.com/api
   ```

## Step-by-Step Guides Created

I've created comprehensive documentation to help you deploy:

1. **[RENDER_QUICK_START.md](./RENDER_QUICK_START.md)** - Quick 5-minute guide
2. **[RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)** - Complete step-by-step guide (379 lines)
3. **[README.md](./README.md)** - Updated with deployment info

## Quick Deployment (15 minutes total)

### 1. Create PostgreSQL Database (5 min)
- Go to Render Dashboard → New → PostgreSQL
- Copy the database URL

### 2. Deploy Backend (5 min)
- New → Web Service
- Name: `fafa-access-api`
- Build: `npm install`
- Start: `npm start`
- Add environment variables (DATABASE_URL, JWT_SECRET, etc.)
- **Result:** Get `https://fafa-access-api.onrender.com`

### 3. Deploy Frontend (5 min)
- New → Web Service
- Name: `fafa-access-frontend`
- Build: `npm install && npm run build`
- Start: `npx serve -s dist -l 3000`
- Add: `VITE_API_URL=https://fafa-access-api.onrender.com/api`
- **Result:** Get `https://fafa-access-frontend.onrender.com`

## Testing Your API

Visit: `https://fafa-access-api.onrender.com/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T10:42:07.166Z"
}
```

## Common Issues

**"My API isn't responding"**
- Free tier services sleep after 15 min inactivity
- First request takes ~30 seconds to wake up
- Solution: Wait or upgrade to paid tier

**"CORS error in browser console"**
- Update `FRONTEND_URL` in backend environment variables
- Use your actual frontend URL: `https://fafa-access-frontend.onrender.com`

**"Can't connect to database"**
- Verify `DATABASE_URL` is correct in backend env vars
- Check database is in same region as backend

## Need More Help?

Read the full guides:
- **Quick Start:** [RENDER_QUICK_START.md](./RENDER_QUICK_START.md)
- **Complete Guide:** [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)

Both include:
- ✅ Architecture diagrams
- ✅ Step-by-step instructions
- ✅ Environment variable examples
- ✅ Troubleshooting sections
- ✅ Cost information

## Summary

**backend-api.com/api** was just an example URL. Your actual backend API URL on Render will be:

```
https://<your-service-name>.onrender.com/api
```

Follow the guides above to deploy and get your actual URL!
