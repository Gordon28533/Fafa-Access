# 🚀 GO LIVE DEPLOYMENT GUIDE

## Quick Overview
This guide will walk you through deploying your Student Laptop Access Platform to production so real users can access it.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ What's Already Done
- ✅ Application code is complete
- ✅ Authentication & authorization implemented
- ✅ Database schema ready
- ✅ Security hardening complete
- ✅ Rate limiting configured
- ✅ Error handling in place

### 🔧 What You Need To Do

---

## STEP 1: CHOOSE YOUR HOSTING PLATFORM

### Option A: Render.com (Recommended - Free Tier Available)
**Pros:** Easy setup, free PostgreSQL database, auto-deploy from GitHub
**Best for:** Getting started quickly

### Option B: Railway.app (Modern Alternative)
**Pros:** Simple setup, generous free tier, fast deployments
**Best for:** Quick deployment with good DX

### Option C: Vercel (Frontend) + Render (Backend)
**Pros:** Vercel excels at React hosting, split concerns
**Best for:** Optimal performance

### Option D: AWS/Azure (Enterprise)
**Pros:** Full control, scalable
**Best for:** Long-term production use

**👉 Recommendation:** Start with **Render.com** or **Railway.app** for easiest deployment

---

## STEP 2: SETUP PRODUCTION DATABASE

### Using Render.com PostgreSQL (Free)
1. Go to https://render.com
2. Sign up with GitHub
3. Click **New** → **PostgreSQL**
4. Name: `fafa-access-db` (keep it hyphenated for Render)
5. Database: `fafa_access` (⚠️ **must be lowercase with underscores only**)
6. User: `fafa_admin`
7. Region: Choose closest to Ghana (e.g., Frankfurt)
8. Click **Create Database**
9. **Copy the External Database URL** (starts with `postgres://`)

**⚠️ Important:** Database name must match pattern: `^[a-z_][a-z0-9_]*$` (lowercase, underscores, no uppercase or hyphens)

### Alternative: Supabase (Free PostgreSQL)
1. Go to https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database

**⚠️ Save this DATABASE_URL - you'll need it!**

---

## STEP 3: PREPARE YOUR CODE FOR DEPLOYMENT

### A. Push to GitHub (if not already)
```bash
# In your project folder
git init
git add .
git commit -m "Ready for production deployment"

# Create GitHub repo at github.com, then:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

### B. Verify Environment Variables
Check that `.env.example` has all needed variables (it does! ✅)

---

## STEP 4: DEPLOY BACKEND API

### Using Render.com

1. **Create Web Service**
   - Go to Render Dashboard
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Select your repo

2. **Configure Build Settings**
   - **Name:** `laptop-platform-api`
   - **Region:** Frankfurt (or closest to Ghana)
   - **Branch:** `main`
   - **Root Directory:** Leave empty
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

3. **Add Environment Variables** (Click "Advanced" → "Add Environment Variable")
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<paste your database URL from Step 2>
   JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   COOKIE_SECRET=<generate another random string>
   FRONTEND_URL=https://YOUR-FRONTEND-URL.vercel.app
   ```

   **Optional but recommended:**
   ```
   SENDGRID_API_KEY=<for email notifications>
   EMAIL_FROM=noreply@yourdomain.com
   HUBTEL_API_KEY=<for SMS in Ghana>
   ```

4. **Deploy**
   - Click **Create Web Service**
   - Wait 5-10 minutes for build
   - Your API will be live at: `https://laptop-platform-api.onrender.com`

5. **Run Database Migrations**
   - In Render Dashboard, go to your service
   - Click **Shell** tab
   - Run: `npm run db:migrate`

---

## STEP 5: DEPLOY FRONTEND

### Using Vercel (Recommended for React)

1. **Prepare Frontend Build**
   - In your project, create `.env.production`:
     ```
     VITE_API_URL=https://laptop-platform-api.onrender.com/api
     ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click **Add New** → **Project**
   - Import your GitHub repository
   - **Framework Preset:** Vite
   - **Root Directory:** Leave empty
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - Click **Deploy**

3. **Add Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://laptop-platform-api.onrender.com/api`
   - Redeploy

4. **Your frontend is now live!**
   - URL: `https://your-project.vercel.app`

---

## STEP 6: UPDATE FRONTEND_URL IN BACKEND

1. Go back to Render dashboard
2. Edit your backend service
3. Update `FRONTEND_URL` environment variable to your Vercel URL
4. Save (this will trigger a redeploy)

---

## STEP 7: SETUP CUSTOM DOMAIN (Optional but Recommended)

### Buy Domain (Namecheap, GoDaddy, etc.)
- Suggested: `laptopaccess.com.gh` or similar

### Connect to Vercel (Frontend)
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Follow DNS instructions
4. Add CNAME record pointing to Vercel

### Connect to Render (Backend API)
1. Render Dashboard → Your Service → Settings → Custom Domain
2. Add `api.yourdomain.com`
3. Update DNS with CNAME
4. Update `FRONTEND_URL` in backend to use your custom domain

---

## STEP 8: FINAL VERIFICATION

### Test Core Features
1. ✅ Visit your frontend URL
2. ✅ Browse laptops (should work without login)
3. ✅ Register a new student account
4. ✅ Login
5. ✅ Apply for a laptop
6. ✅ Test admin login
7. ✅ View admin dashboard

### Check Backend Health
- Visit: `https://your-backend-url.onrender.com/health`
- Should return: `{"status":"ok","timestamp":"..."}`

---

## STEP 9: CREATE FIRST ADMIN USER

### Option A: Via Database (Recommended)
1. In Render dashboard, access your PostgreSQL database
2. Run SQL:
   ```sql
   UPDATE users 
   SET role = 'ADMIN' 
   WHERE email = 'youremail@example.com';
   ```

### Option B: Register normally then update
1. Register on your live site
2. Update role in database as above

---

## STEP 10: POPULATE INITIAL DATA

### Add Universities
1. Login as ADMIN
2. Go to Admin → University Management
3. Add your university

### Add Laptop Inventory
1. Go to Admin → Laptop Inventory
2. Add initial laptops with:
   - Brand, Model, Specs
   - Pricing (70/30 split)
   - Stock quantity
   - Images

---

## 🎉 YOUR PLATFORM IS NOW LIVE!

### Share with Users
- Students: `https://your-domain.com`
- Tell them to browse laptops and register

### Monitor Your Application
- **Render Logs:** Real-time errors and requests
- **Database:** Monitor connections and performance
- **Uptime:** Use uptimerobot.com for free monitoring

---

## 📊 RECOMMENDED NEXT STEPS

### 1. Setup Datadog Monitoring (Recommended)
Free tier perfect for monitoring your app!

**Get API Keys:**
1. Go to https://www.datadoghq.com
2. Sign up (free account included)
3. Go to Settings → API Keys → Create API Key (`DATADOG_API_KEY`)
4. Go to Settings → Application Keys → Create App Key (`DATADOG_CLIENT_TOKEN`)
5. Go to Settings → Integrations → Browser RUM to get APP ID

**Add to Render Backend:**
1. Render Dashboard → Your Service → Environment Variables
2. Add:
   ```
   DATADOG_ENABLED=true
   DATADOG_ENV=production
   DATADOG_SERVICE=fafa-access-api
   ```
3. Save & Redeploy

**Add to Vercel Frontend:**
1. Vercel Project → Settings → Environment Variables
2. Add:
   ```
   VITE_DATADOG_ENABLED=true
   VITE_DATADOG_APP_ID=<your-app-id>
   VITE_DATADOG_CLIENT_TOKEN=<your-client-token>
   ```
3. Redeploy

**Monitor:**
- Dashboard: https://app.datadoghq.com/dashboard
- See real-time metrics, errors, performance, user sessions
- **Cost:** Free tier (~$0/month)

### 2. Setup Email Notifications (SendGrid)
- Free tier: 100 emails/day
- Get API key from sendgrid.com
- Add to environment variables
- Test registration emails

### 2. Setup SMS for Ghana (Hubtel)
- Sign up at hubtel.com
- Get API credentials
- Add to environment variables
- Test application notifications

### 3. Enable Analytics
- Google Analytics for frontend
- Track user registrations, applications

### 4. Backup Strategy
- Render: Automatic daily backups ✅
- Download manual backup weekly
- Keep copies of database

### 5. Security Monitoring
- Setup Sentry.io for error tracking
- Monitor failed login attempts
- Review audit logs weekly

---

## 🆘 COMMON DEPLOYMENT ISSUES

### Issue: "Cannot connect to database"
**Fix:** Check DATABASE_URL is correct in environment variables

### Issue: "CORS error" in browser
**Fix:** Ensure FRONTEND_URL in backend matches your actual frontend URL

### Issue: "502 Bad Gateway"
**Fix:** Backend is down. Check Render logs, ensure start command is correct

### Issue: "Build failed"
**Fix:** Check build logs. Usually missing dependencies or TypeScript errors

---

## 💰 COST ESTIMATE

### Free Tier (Testing/Small Scale)
- Render Web Service: Free (with limitations)
- Render PostgreSQL: Free (1GB storage)
- Vercel Frontend: Free
- **Total: $0/month** ✅

### Production Tier (Recommended)
- Render Web Service: $7/month (always on)
- Render PostgreSQL: $7/month (256MB RAM)
- Vercel Pro: $20/month (custom domain, analytics)
- SendGrid: Free (100 emails/day)
- **Total: ~$14-34/month**

---

## 📞 SUPPORT

### If You Get Stuck:
1. Check Render/Vercel deployment logs
2. Review error messages carefully
3. Check environment variables are set correctly
4. Ensure DATABASE_URL connection works
5. Verify Git repository is public or connected

### Testing Checklist Before Launch:
- [ ] Students can browse laptops without login
- [ ] Students can register and login
- [ ] Students can apply for laptops
- [ ] Admin can login and see dashboard
- [ ] Admin can manage laptop inventory
- [ ] Logout works correctly
- [ ] Application status updates work

---

## 🎯 YOU'RE READY TO GO LIVE!

Follow these steps in order, and your platform will be accessible to users worldwide within 1-2 hours.

**Good luck! 🚀**
