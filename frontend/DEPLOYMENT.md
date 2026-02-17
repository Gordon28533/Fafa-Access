# Deployment Guide

This guide explains how to deploy the Fafa Access Frontend to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

- Built the project successfully locally
- Configured environment variables
- Tested the production build

## 🏗️ Building for Production

Create a production build:

```bash
npm run build
```

This will create optimized files in the `dist/` directory.

## 🌐 Deployment Platforms

### Vercel (Recommended)

Vercel provides excellent support for Vite applications with zero configuration.

#### Quick Deploy

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Vercel will auto-detect Vite and configure everything

#### Manual Configuration

If needed, use these settings:

```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### Environment Variables

Add your environment variables in the Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add each variable from `.env.example`
- Ensure variables have the `VITE_` prefix

### Netlify

#### Deploy via CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

#### Deploy via Git

1. Push code to GitHub
2. Visit [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Cloudflare Pages

1. Push code to GitHub
2. Visit [pages.cloudflare.com](https://pages.cloudflare.com)
3. Click "Create a project"
4. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`

### AWS S3 + CloudFront

#### Build and Upload

```bash
# Build
npm run build

# Upload to S3 (requires AWS CLI)
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Build and Run

```bash
docker build -t fafa-access-frontend .
docker run -p 80:80 fafa-access-frontend
```

## 🔧 Environment Variables

### Production Variables

Ensure these are configured in your deployment platform:

```env
VITE_API_URL=https://your-api-domain.com/api
VITE_APP_NAME=Fafa Access
VITE_ENV=production
VITE_ENABLE_ANALYTICS=true
```

### Important Notes

- All environment variables must have the `VITE_` prefix
- Variables are embedded at build time
- Changing variables requires rebuilding the application

## 🚀 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🔍 Post-Deployment Checklist

After deploying:

- [ ] Verify the site loads correctly
- [ ] Test all major features
- [ ] Check API connectivity
- [ ] Verify environment variables are working
- [ ] Test on different devices/browsers
- [ ] Check console for errors
- [ ] Verify analytics are tracking (if enabled)
- [ ] Test authentication flows
- [ ] Check performance metrics

## 🐛 Troubleshooting

### Build Fails

- Ensure all dependencies are installed
- Check Node.js version (18+)
- Review build logs for specific errors
- Verify TypeScript has no errors

### Blank Page After Deploy

- Check browser console for errors
- Verify base path in `vite.config.ts`
- Ensure environment variables are set
- Check if assets are loading correctly

### API Connection Issues

- Verify `VITE_API_URL` is correct
- Check CORS configuration on backend
- Ensure backend is accessible from deployment
- Check network tab for failed requests

### Routing Issues (404 on refresh)

- Configure your hosting for SPA routing
- All routes should redirect to `index.html`
- Check server configuration (nginx, Apache, etc.)

## 📊 Performance Optimization

### Before Deploying

1. Run Lighthouse audit
2. Optimize images
3. Enable compression
4. Configure caching headers
5. Consider lazy loading for routes

### Monitoring

Set up monitoring to track:
- Page load times
- Error rates
- User interactions
- API response times

## 📞 Support

For deployment issues:
- Check the platform's documentation
- Review deployment logs
- Contact platform support if needed

## 📄 Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
