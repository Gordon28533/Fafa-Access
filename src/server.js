import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import process from 'process';
import { db, pool } from './db/connection.js';
import { sql } from 'drizzle-orm';
import { httpLogger, initSentry, observabilityErrorHandler, logger } from './observability.js';
import { validateEnvironment, validateProductionConfig, getEnvConfig } from './utils/validateEnv.js';
import authRoutes from './routes/authRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import paymentsRoutes from './routes/paymentsRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import studentProfileRoutes from './routes/studentProfileRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import notificationPreferencesRoutes from './routes/notificationPreferencesRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import laptopRoutes from './routes/laptopRoutes.js';
import adminAuditLogRoutes from './routes/adminAuditLogRoutes.js';
import adminPaymentRoutes from './routes/adminPaymentRoutes.js';
import adminUniversityRoutes from './routes/adminUniversityRoutes.js';
import studentUniversityRoutes from './routes/studentUniversityRoutes.js';
import adminSRCRoutes from './routes/adminSRCRoutes.js';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes.js';
import srcAcceptanceRoutes from './routes/srcAcceptanceRoutes.js';
import srcRevenueRoutes from './routes/srcRevenueRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

dotenv.config();

// Initialize Datadog tracing (optional monitoring)
if (process.env.DATADOG_ENABLED === 'true') {
  try {
    const tracer = require('dd-trace').init({
      enabled: true,
      env: process.env.NODE_ENV || 'development',
      service: process.env.DATADOG_SERVICE || 'laptop-access-api',
      version: '1.0.0',
      apiVersion: 'v0.4',
      logInjection: true
    });
  } catch (err) {
    console.warn('[Server] Datadog initialization failed (optional)', err.message);
  }
}

// Validate environment configuration before proceeding
validateEnvironment();
if (process.env.NODE_ENV === 'production') {
  validateProductionConfig();
}

const config = getEnvConfig();
const app = express();
const PORT = config.port;
const NODE_ENV = config.nodeEnv;
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.VITE_APP_URL
].filter(Boolean);

// ===== SECURITY MIDDLEWARE =====

// 1. Helmet: Set secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// 2. CORS: Strict origin validation
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '3600');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// 3. Rate Limiting: Global and endpoint-specific
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Increased from 5 to 15 to prevent legitimate use cases from being blocked
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: NODE_ENV === 'production' ? 30 : 100,
  message: 'API rate limit exceeded.',
});

app.use(globalLimiter);

// 4. Input sanitization: Strip $ and . from keys to prevent NoSQL injection
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (typeof obj[key] === 'object') {
            sanitize(obj[key]);
          } else if (typeof obj[key] === 'string') {
            obj[key] = obj[key].replace(/\$/g, '').replace(/\./g, '');
          }
        }
      }
    }
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
});

// 5. Body size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// 6. Secure cookies
const cookieSecret = config.cookieSecret;
if (NODE_ENV === 'production' && !cookieSecret) {
  logger.fatal('COOKIE_SECRET is required in production. Set it via environment variable.');
  throw new Error('COOKIE_SECRET is required in production');
}
app.use(cookieParser(cookieSecret || 'dev-secret'));

// 7. CSRF Protection
// Configure CSRF protection to use cookies
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production', // Only use secure cookies in production
    sameSite: 'strict'
  }
});

// Apply CSRF protection to state-changing routes
// Exclude specific routes that don't need CSRF (like health checks, token refresh)
app.use((req, res, next) => {
  // Skip CSRF for:
  // 1. GET, HEAD, OPTIONS requests (safe methods)
  // 2. Health check endpoint
  // 3. Token refresh endpoint (already has token validation)
  const skipCsrf = 
    ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
    req.path === '/health' ||
    req.path === '/api/auth/refresh';
  
  if (skipCsrf) {
    return next();
  }
  
  // Apply CSRF protection to all other routes
  csrfProtection(req, res, next);
});

// Endpoint to get CSRF token for frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Observability wiring
initSentry(app);
app.use(httpLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    logger.info('Health check requested...');
    // Test database connection
    const result = await db.execute(sql`SELECT current_database(), current_user, version()`);
    const dbInfo = result.rows[0];
    
    logger.info({ dbInfo }, 'Database query successful');
    
    // In production, don't expose database details
    if (NODE_ENV === 'production') {
      return res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        database: dbInfo.current_database,
        user: dbInfo.current_user,
        version: dbInfo.version.split(' ')[0] + ' ' + dbInfo.version.split(' ')[1]
      },
      pool: {
        total: pool.totalCount || 0,
        idle: pool.idleCount || 0,
        waiting: pool.waitingCount || 0
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Health check error');
    const statusCode = NODE_ENV === 'production' ? 503 : 500;
    const responseBody = NODE_ENV === 'production' 
      ? { status: 'unhealthy', timestamp: new Date().toISOString() }
      : {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          database: { connected: false }
        };
    res.status(statusCode).json(responseBody);
  }
});

// Database test endpoint (development only)
if (NODE_ENV !== 'production') {
  app.get('/api/test-db', async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM users) as user_count,
          (SELECT COUNT(*) FROM universities) as university_count,
          (SELECT COUNT(*) FROM applications) as application_count
      `);
      
      res.json({
        success: true,
        tables: result.rows[0]
      });
    } catch (error) {
      logger.error({ err: error }, 'Database test endpoint failed');
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// DB schema status endpoint (development only)
if (NODE_ENV !== 'production') {
  app.get('/api/db-schema-status', async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'student_profiles'
      `);
      const columns = result.rows.map((r) => r.column_name);
      const expected = ['level', 'course', 'profile_photo_url'];
      const status = Object.fromEntries(expected.map((c) => [c, columns.includes(c)]));

      res.json({ success: true, table: 'student_profiles', status, columns });
    } catch (error) {
      logger.error({ err: error }, 'DB schema status endpoint failed');
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Root endpoint
app.get('/', (req, res) => {
  const response = {
    message: 'Laptop Application Backend API',
    version: '1.0.0',
  };
  
  // Only expose endpoints in development
  if (NODE_ENV !== 'production') {
    response.endpoints = {
      health: '/health',
      testDb: '/api/test-db',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile',
      },
      applications: {
        create: 'POST /api/applications',
        myApplications: 'GET /api/applications/my',
        getById: 'GET /api/applications/:id',
        srcPending: 'GET /api/applications/src/pending',
        srcDecision: 'PUT /api/applications/:id/src-decision',
      },
      documents: {
        upload: 'POST /api/documents/upload',
        review: 'GET /api/documents/review/:applicationId',
        get: 'GET /api/documents/:applicationId/:documentId',
        audit: 'GET /api/documents/audit/:applicationId',
        delete: 'DELETE /api/documents/:applicationId/:documentId',
      },
    };
  }
  
  res.json(response);
});

// Auth routes
app.use('/api/auth', authLimiter, authRoutes);
// Laptop inventory routes
app.use('/api/laptops', apiLimiter, laptopRoutes);
// Application routes
app.use('/api/applications', apiLimiter, applicationRoutes);
// Student profile routes
app.use('/api/student', apiLimiter, studentProfileRoutes);
// Security routes
app.use('/api/security', apiLimiter, securityRoutes);
// Notification preferences routes
app.use('/api/notifications', apiLimiter, notificationPreferencesRoutes);
// Support ticket routes
app.use('/api/support', apiLimiter, supportRoutes);
// Delivery routes
app.use('/api/delivery', apiLimiter, deliveryRoutes);
// Payments routes
app.use('/api/payments', apiLimiter, paymentsRoutes);
// Document routes
app.use('/api/documents', apiLimiter, documentRoutes);
// Admin audit log routes
app.use('/api/admin/audit-logs', apiLimiter, adminAuditLogRoutes);
// Admin payment routes
app.use('/api/admin/payments', apiLimiter, adminPaymentRoutes);
// Admin analytics routes
app.use('/api/admin/analytics', apiLimiter, adminAnalyticsRoutes);
// Admin export routes
app.use('/api/admin/export', apiLimiter, exportRoutes);
// Admin university management routes
app.use('/api/admin/universities', apiLimiter, adminUniversityRoutes);
// Student university selection routes
app.use('/api/universities', apiLimiter, studentUniversityRoutes);
// Admin SRC invitation management routes
app.use('/api/admin/src', apiLimiter, adminSRCRoutes);
// SRC agreement acceptance routes
app.use('/api/src', apiLimiter, srcAcceptanceRoutes);
// SRC revenue and commission tracking routes
app.use('/api/src/revenue', apiLimiter, srcRevenueRoutes);

// 404 handler (must be last)
app.use((req, res) => {
  const isDev = NODE_ENV !== 'production';
  logger.warn({ path: req.path, method: req.method }, '404 Not Found');
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.path}`,
    ...(isDev && { endpoints: 'See GET / for available endpoints' })
  });
});

// Centralized error handler (after all middleware/routes)
app.use((err, req, res, _next) => {
  void _next;
  const isDev = NODE_ENV !== 'production';
  logger.error({ err, path: req.path, method: req.method }, 'Application error');
  
  // Don't expose stack traces in production
  const response = {
    success: false,
    message: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack })
  };
  
  const status = err.status || err.statusCode || 500;
  res.status(status).json(response);
});

// Call original error handler after custom one
app.use(observabilityErrorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  if (NODE_ENV !== 'production') {
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Database test: http://localhost:${PORT}/api/test-db`);
  }
  console.log('[server] Server is listening and ready to accept connections');
});

// Add error handler to server
server.on('error', (err) => {
  logger.error({ err }, 'Server error');
  console.error('[server] Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    try {
      await pool.end();
    } catch (e) {
      logger.error({ err: e }, 'Error closing pool');
    }
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    try {
      await pool.end();
    } catch (e) {
      logger.error({ err: e }, 'Error closing pool');
    }
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception');
});

