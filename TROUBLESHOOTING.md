# Troubleshooting Guide

## Common Issues and Solutions

### PostCSS Plugin Error: Cannot find module 'tailwindcss'

**Error Message:**
```
Error: Loading PostCSS Plugin failed: Cannot find module 'tailwindcss'
```

**Cause:**
This error occurs when the `node_modules` directory is missing or the dependencies haven't been installed.

**Solution:**
Run the following command in the project root directory:
```bash
npm install
```

This will install all dependencies including `tailwindcss` (defined in `devDependencies` in package.json).

**Verification:**
After installation, verify that the build works:
```bash
npm run build
```

Or start the development server:
```bash
npm run dev
```

### Other Common Setup Issues

#### Missing Environment Variables
If you encounter errors about missing environment variables:
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and configure the required variables

#### Database Connection Issues
If you can't connect to the database:
1. Ensure PostgreSQL is running
2. Check your `DATABASE_URL` in `.env`
3. Run migrations:
   ```bash
   npm run db:migrate
   ```

#### Build Warnings About Chunk Sizes
The application may show warnings about large chunk sizes. This is expected and can be ignored, or you can suppress them by adjusting `build.chunkSizeWarningLimit` in `vite.config.ts`.

## Getting Help

- Check the [README.md](./README.md) for setup instructions
- Review [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) for deployment help
- See [GO_LIVE_GUIDE.md](./GO_LIVE_GUIDE.md) for production deployment options
