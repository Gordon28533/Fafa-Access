import { logger } from '../observability.js';

/**
 * Validate that all required environment variables are set
 * Throws an error if any required variables are missing
 */
export function validateEnvironment() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV',
    'PORT',
  ];

  const missing = [];

  required.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });

  if (missing.length > 0) {
    logger.fatal(
      { missing },
      `Missing required environment variables: ${missing.join(', ')}`
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\n` +
      'Please set all required variables in .env file or environment.\n' +
      'Reference: .env.example'
    );
  }

  // Validate JWT_SECRET length (should be at least 32 characters)
  if (process.env.JWT_SECRET.length < 32) {
    logger.warn(
      'JWT_SECRET is less than 32 characters. This is insecure and should only be used for development.'
    );
    if (process.env.NODE_ENV === 'production') {
      logger.fatal('JWT_SECRET is insecure in production. Exiting.');
      throw new Error(
        'JWT_SECRET must be at least 32 characters long in production'
      );
    }
  }

  // Validate DATABASE_URL format
  if (!process.env.DATABASE_URL.includes('postgresql://')) {
    logger.warn('DATABASE_URL does not appear to be a PostgreSQL URL');
  }

  // Validate NODE_ENV is one of the expected values
  if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    logger.warn(
      { NODE_ENV: process.env.NODE_ENV },
      'NODE_ENV has unexpected value'
    );
  }

  // Validate PORT is a valid number
  const port = Number(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    logger.fatal({ PORT: process.env.PORT }, 'PORT must be a number between 1 and 65535');
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  logger.info('Environment validation passed');
}

/**
 * Get environment-specific configuration
 */
export function getEnvConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  return {
    isDevelopment,
    isProduction,
    isTest,
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    cookieSecret: process.env.COOKIE_SECRET || (isDevelopment ? 'dev-secret' : null),
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  };
}

/**
 * Validate that production environment is properly configured
 */
export function validateProductionConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return; // Skip validation if not production
  }

  const errors = [];

  // Cookie secret must be set and secure
  if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET === 'dev-secret') {
    errors.push(
      'COOKIE_SECRET must be set to a secure random value in production. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // JWT Secret must be secure
  if (process.env.JWT_SECRET.includes('dev') || process.env.JWT_SECRET.includes('change')) {
    errors.push('JWT_SECRET contains development placeholder. Use a secure random value.');
  }

  // Frontend URL should be set
  if (!process.env.FRONTEND_URL) {
    errors.push('FRONTEND_URL is not set. This is needed for CORS configuration.');
  }

  // Database should not be localhost
  if (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) {
    errors.push(
      'DATABASE_URL points to localhost. This should be a remote database in production.'
    );
  }

  // Log email provider configuration
  const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
  if (emailProvider === 'smtp') {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      errors.push('SMTP configuration is incomplete. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD.');
    }
  }

  if (errors.length > 0) {
    logger.fatal({ errors }, 'Production environment configuration errors');
    throw new Error(
      'Production environment validation failed:\n' +
      errors.map((e) => `  - ${e}`).join('\n')
    );
  }

  logger.info('Production environment validation passed');
}
