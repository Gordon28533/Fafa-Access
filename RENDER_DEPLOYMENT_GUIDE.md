# 🚀 Render Deployment Guide for Fafa Access

This guide provides step-by-step instructions for deploying the Fafa Access application to Render.com.

## Overview

The Fafa Access application consists of:
- **Frontend**: React + Vite application
- **Backend**: Express.js API server
- **Database**: PostgreSQL

Both the frontend and backend are in the same repository, but will be deployed as separate services on Render.

---

## Prerequisites

- GitHub account with your repository
- Render account (sign up at [render.com](https://render.com))
- Code pushed to GitHub

---

## Step 1: Create PostgreSQL Database

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com

2. **Create New PostgreSQL Database**
   - Click **New +** → **PostgreSQL**
   - **Name**: `fafa-access-db`
   - **Database**: `fafa_access` (lowercase with underscores only)
   - **User**: `fafa_admin`
   - **Region**: Choose closest to your users (e.g., Frankfurt for Europe/Africa)
   - **Plan**: Free (or paid for production)
   - Click **Create Database**

3. **Copy Database Connection String**
   - Once created, scroll down to **Connections**
   - Copy the **External Database URL** (starts with `postgres://`)
   - It looks like: `postgres://fafa_admin:xxxxx@dpg-xxxxx.frankfurt-postgres.render.com/fafa_access`
   - **Save this URL** - you'll need it for the backend configuration!

---

## Step 2: Deploy Backend API

### 2.1 Create Web Service

1. **In Render Dashboard**
   - Click **New +** → **Web Service**
   - Connect your GitHub account if not already connected
   - Select your `Fafa-Access` repository

2. **Configure Backend Service**
   - **Name**: `fafa-access-api` (or any name you prefer)
   - **Region**: Same as database (e.g., Frankfurt)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (since backend is in the root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2.2 Configure Environment Variables

Click **Advanced** → **Add Environment Variable** and add these:

**Required Variables:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste your database URL from Step 1>
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
COOKIE_SECRET=<generate another random string>
FRONTEND_URL=https://your-frontend-app.onrender.com
```

**Optional but Recommended:**

```env
# Email notifications (SendGrid)
SENDGRID_API_KEY=<your-sendgrid-key>
EMAIL_FROM=noreply@fafaaccess.com
EMAIL_FROM_NAME=Fafa Access

# SMS notifications (Hubtel for Ghana)
HUBTEL_API_KEY=<your-hubtel-key>
HUBTEL_CLIENT_ID=<your-hubtel-client-id>
HUBTEL_SENDER_ID=<your-sender-id>

# Logging level
LOG_LEVEL=info
```

> **Note**: You'll update `FRONTEND_URL` later once you have your frontend URL

### 2.3 Deploy Backend

1. Click **Create Web Service**
2. Wait 5-10 minutes for the build to complete
3. Once deployed, you'll see your backend URL

**Your Backend API URL will be:**
```
https://fafa-access-api.onrender.com
```

**The API endpoint base URL will be:**
```
https://fafa-access-api.onrender.com/api
```

### 2.4 Run Database Migrations

1. In Render Dashboard, go to your backend service
2. Click the **Shell** tab
3. Run the migration command:
```bash
npm run db:migrate
```

---

## Step 3: Deploy Frontend

### 3.1 Create Frontend Web Service

1. **In Render Dashboard**
   - Click **New +** → **Web Service**
   - Select the same `Fafa-Access` repository

2. **Configure Frontend Service**
   - **Name**: `fafa-access-frontend` (or any name you prefer)
   - **Region**: Same as backend (e.g., Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l 3000`

### 3.2 Configure Frontend Environment Variables

Add this environment variable:

```env
VITE_API_URL=https://fafa-access-api.onrender.com/api
```

Replace `fafa-access-api` with your actual backend service name.

### 3.3 Deploy Frontend

1. Click **Create Web Service**
2. Wait for the build to complete

**Your Frontend URL will be:**
```
https://fafa-access-frontend.onrender.com
```

---

## Step 4: Update Backend with Frontend URL

Now that you have your frontend URL, update the backend:

1. Go to your **backend service** in Render Dashboard
2. Go to **Environment** tab
3. Update the `FRONTEND_URL` variable:
```env
FRONTEND_URL=https://fafa-access-frontend.onrender.com
```
4. Click **Save Changes** (this will trigger a redeploy)

---

## Step 5: Test Your Deployment

### 5.1 Test Backend Health

Visit: `https://fafa-access-api.onrender.com/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T10:42:07.166Z"
}
```

### 5.2 Test Frontend

1. Visit: `https://fafa-access-frontend.onrender.com`
2. You should see the Fafa Access homepage
3. Try browsing laptops (should work without login)
4. Try registering a new account
5. Try logging in

---

## Finding Your Backend API URL

**Your backend API URL is always:**

```
https://<your-backend-service-name>.onrender.com/api
```

**Where to find it:**

1. **In Render Dashboard:**
   - Go to your backend service
   - Look at the top of the page for the service URL
   - Add `/api` to the end

2. **Example:**
   - Service name: `fafa-access-api`
   - Service URL: `https://fafa-access-api.onrender.com`
   - **API Base URL**: `https://fafa-access-api.onrender.com/api`

3. **Use this URL in your frontend:**
   - Set as `VITE_API_URL` environment variable
   - The frontend will use it for all API calls

---

## Common Issues and Solutions

### Issue 1: Backend service won't start

**Error:** "Application failed to respond"

**Solution:**
- Check that `PORT=3000` is set in environment variables
- Verify `npm start` command is set correctly
- Check logs for errors

### Issue 2: Database connection fails

**Error:** "Database connection error"

**Solution:**
- Verify `DATABASE_URL` is correctly copied from database settings
- Ensure database and backend are in the same region
- Check database is active (not suspended on free tier)

### Issue 3: CORS errors in browser console

**Error:** "Access-Control-Allow-Origin"

**Solution:**
- Verify `FRONTEND_URL` in backend matches your actual frontend URL
- Check there are no trailing slashes
- Redeploy backend after changing environment variables

### Issue 4: Frontend shows "API Error" or timeouts

**Solution:**
- Verify `VITE_API_URL` is set correctly in frontend
- Check backend is running and healthy
- Test backend URL directly: `https://your-backend.onrender.com/health`

### Issue 5: Free tier services suspended

**Problem:** Render free tier services spin down after inactivity

**Solution:**
- Services automatically wake up when accessed (takes ~30 seconds)
- Consider using a ping service to keep services active
- Upgrade to paid tier for always-on services

---

## Environment Variables Summary

### Backend Environment Variables

```env
# Required
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://user:pass@host/database
JWT_SECRET=<32+ character random string>
COOKIE_SECRET=<32+ character random string>
FRONTEND_URL=https://your-frontend.onrender.com

# Optional
SENDGRID_API_KEY=<for emails>
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Fafa Access
HUBTEL_API_KEY=<for SMS>
HUBTEL_CLIENT_ID=<for SMS>
HUBTEL_SENDER_ID=<for SMS>
LOG_LEVEL=info
SENTRY_DSN=<for error tracking>
```

### Frontend Environment Variables

```env
VITE_API_URL=https://your-backend-api.onrender.com/api
```

---

## Next Steps

1. **Create Admin User**
   - Register a user on your frontend
   - Update their role in the database:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```

2. **Add Initial Data**
   - Login as admin
   - Add universities via Admin → University Management
   - Add laptop inventory

3. **Set Up Custom Domain (Optional)**
   - In Render Dashboard → Service → Settings → Custom Domain
   - Add your domain (e.g., `app.yourdomain.com` for frontend)
   - Add subdomain for API (e.g., `api.yourdomain.com` for backend)
   - Update DNS records as instructed by Render
   - Update environment variables with custom domains

4. **Enable Monitoring (Optional)**
   - Set up Sentry for error tracking
   - Configure SendGrid for email notifications
   - Set up Hubtel for SMS notifications

---

## Cost Information

**Render Free Tier Includes:**
- PostgreSQL database (limited storage)
- Web services (750 hours/month)
- Services spin down after 15 minutes of inactivity

**Paid Plans:**
- Starter: $7/month per service (always-on)
- Standard: $25/month per service (more resources)
- PostgreSQL: $7/month (more storage and connections)

---

## Support

For issues:
1. Check Render logs in dashboard (Logs tab)
2. Review this guide's troubleshooting section
3. Check [Render documentation](https://render.com/docs)
4. Contact repository maintainers

---

## Quick Reference

**Backend Service URL:**
```
https://<backend-service-name>.onrender.com
```

**Backend API Base URL (for VITE_API_URL):**
```
https://<backend-service-name>.onrender.com/api
```

**Frontend Service URL:**
```
https://<frontend-service-name>.onrender.com
```

**Health Check Endpoint:**
```
https://<backend-service-name>.onrender.com/health
```
