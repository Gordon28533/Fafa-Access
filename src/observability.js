import pino from "pino";
import pinoHttp from "pino-http";
import * as Sentry from "@sentry/node";

// Structured logger with sensible defaults for production
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: undefined, // remove pid/hostname for cleaner logs in containerized envs
  redact: {
    paths: ["req.headers.authorization", "req.body.password", "req.body.token"],
    censor: "[redacted]",
  },
  transport: process.env.NODE_ENV === "production" ? undefined : { target: "pino-pretty" },
});

// Request-aware HTTP logger that adds req/res metadata and duration
export const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
  customAttributeKeys: { req: "req", res: "res", err: "err" },
  serializers: {
    // Keep bodies small; headers already redacted above
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

// Sentry initialization; safe to no-op if DSN not provided
export function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.warn({ msg: "Sentry DSN not set; error tracing disabled" });
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || 0.05),
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Express error handler that logs and forwards to Sentry if configured
export function observabilityErrorHandler(err, req, res, next) {
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  if (Sentry.getCurrentHub().getClient()) {
    Sentry.captureException(err, {
      tags: { path: req.path, method: req.method },
      contexts: { request: { url: req.url, params: req.params, query: req.query } },
    });
  }
  res.status(500).json({ error: "Internal server error" });
  next();
}

// Domain helpers to standardize important failure logs
export const logAuthFailure = (details) =>
  logger.warn({ event: "auth_failure", ...details }, "Authentication failed");

export const logPaymentIssue = (details) =>
  logger.error({ event: "payment_issue", ...details }, "Payment processing issue");

export const logDeliveryFailure = (details) =>
  logger.error({ event: "delivery_failure", ...details }, "Delivery failure");

export const logNotificationFailure = (details) =>
  logger.warn({ event: "notification_failure", ...details }, "Notification failure");

export const logApiError = (details) =>
  logger.error({ event: "api_error", ...details }, "API error");

export const sentryCapture = (err, context = {}) => {
  if (Sentry.getCurrentHub().getClient()) {
    Sentry.captureException(err, context);
  }
};

export { Sentry };