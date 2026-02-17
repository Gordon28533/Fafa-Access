# Production Logging and Monitoring

**Status**: ✅ Implemented  
**Date**: January 22, 2026

## Overview

Production-grade observability stack implemented with structured logging, distributed tracing, and error tracking to monitor API errors, authentication failures, payment issues, delivery failures, and notification failures.

---

## Architecture

### Components

1. **Structured Logger**: Pino (high-performance JSON logger)
2. **HTTP Middleware**: pino-http (automatic request/response logging with correlation IDs)
3. **Error Tracking**: Sentry (distributed error tracking and performance monitoring)
4. **Domain Event Logging**: Specialized helpers for critical business events

### Data Flow

```
Request → HTTP Logger (req ID) → Route Handler → Domain Logger → Sentry (if error) → Log Sink
```

---

## Implementation

### Files Modified/Created

- **[src/observability.js](src/observability.js)**: Core observability module
  - Structured logger with redaction
  - HTTP logging middleware
  - Sentry initialization
  - Centralized error handler
  - Domain-specific log helpers

- **[src/server.js](src/server.js)**: Server integration
  - Sentry request/tracing handlers
  - HTTP logger middleware
  - Error handler registration
  - Replaced console.log with structured logging

- **[package.json](package.json)**: Dependencies
  - `pino`: Structured logging
  - `pino-http`: HTTP request/response logging
  - `pino-pretty`: Dev-mode pretty printer
  - `@sentry/node`: Error tracking and APM

---

## Configuration

### Environment Variables

```bash
# Logging
LOG_LEVEL=info                    # debug|info|warn|error|fatal
NODE_ENV=production               # production|development

# Sentry (Error Tracking)
SENTRY_DSN=https://xxx@sentry.io/yyy
SENTRY_TRACES_SAMPLE_RATE=0.1     # 10% transaction sampling
SENTRY_PROFILES_SAMPLE_RATE=0.05  # 5% profile sampling
```

### Log Levels

- **debug**: Verbose diagnostic info (development only)
- **info**: Normal operations (health checks, startup)
- **warn**: Non-critical issues (auth failures, notification retries)
- **error**: Errors requiring attention (payment failures, delivery errors)
- **fatal**: Application crashes

---

## Usage

### Basic Logging

```javascript
import { logger } from './observability.js';

// Simple message
logger.info('User logged in');

// With structured data
logger.info({ userId: 123, role: 'student' }, 'User authenticated');

// Error logging
logger.error({ err: error, userId: 123 }, 'Payment processing failed');
```

### Domain Event Logging

Use specialized helpers for tracked failure categories:

```javascript
import {
  logAuthFailure,
  logPaymentIssue,
  logDeliveryFailure,
  logNotificationFailure,
  logApiError,
  sentryCapture
} from './observability.js';

// Authentication failures
logAuthFailure({
  userId: 123,
  reason: 'invalid_credentials',
  ip: req.ip
});

// Payment issues
logPaymentIssue({
  orderId: 'ord_123',
  amount: 50000,
  gateway: 'stripe',
  errorCode: 'card_declined',
  reason: 'insufficient_funds'
});

// Delivery failures
logDeliveryFailure({
  deliveryId: 'del_456',
  laptopId: 789,
  studentId: 123,
  reason: 'address_unreachable',
  retryCount: 3
});

// Notification failures
logNotificationFailure({
  channel: 'email',
  recipient: 'user@example.com',
  type: 'application_approved',
  provider: 'sendgrid',
  errorCode: 'bounce',
  retryable: false
});

// API errors (caught exceptions)
try {
  await riskyOperation();
} catch (error) {
  logApiError({
    endpoint: '/api/applications',
    method: 'POST',
    userId: req.user?.id,
    error: error.message
  });
  sentryCapture(error, {
    tags: { endpoint: '/api/applications' },
    user: { id: req.user?.id }
  });
}
```

### HTTP Request Logging

Automatic via middleware (already wired in server.js):
- Request ID generation (tracks requests across services)
- Method, URL, status code, duration
- Redacts sensitive headers (Authorization, passwords, tokens)

Example output:
```json
{
  "level": "info",
  "time": 1737544800000,
  "req": {
    "id": "req-abc123",
    "method": "POST",
    "url": "/api/applications"
  },
  "res": {
    "statusCode": 201
  },
  "responseTime": 145,
  "msg": "POST /api/applications 201"
}
```

---

## Alerting Rules

### API Errors

**Metric**: 5xx error rate  
**Threshold**: >2% of requests over 5 minutes  
**Severity**: Critical  
**Query**: `event=api_error OR statusCode>=500`

**Metric**: p99 latency  
**Threshold**: >1.5s  
**Severity**: Warning  
**Query**: `responseTime>1500`

### Authentication Failures

**Metric**: Failed login attempts  
**Threshold**: >20 per minute  
**Severity**: Warning (potential brute force)  
**Query**: `event=auth_failure AND reason=invalid_credentials`

**Metric**: Token validation failures  
**Threshold**: >10 per minute  
**Severity**: Critical (potential token compromise)  
**Query**: `event=auth_failure AND reason=invalid_token`

### Payment Issues

**Metric**: Payment gateway errors  
**Threshold**: Any occurrence  
**Severity**: Critical  
**Query**: `event=payment_issue AND errorCode IN (gateway_error, timeout)`

**Metric**: High decline rate  
**Threshold**: >10% of transactions  
**Severity**: Warning  
**Query**: `event=payment_issue AND errorCode=card_declined`

**Metric**: Webhook verification failures  
**Threshold**: Any occurrence  
**Severity**: Critical  
**Query**: `event=payment_issue AND reason=webhook_verification_failed`

### Delivery Failures

**Metric**: Exhausted retries  
**Threshold**: Any occurrence  
**Severity**: High  
**Query**: `event=delivery_failure AND retryCount>=3`

**Metric**: SLA breach  
**Threshold**: Avg delivery time >72 hours  
**Severity**: Warning  
**Query**: `event=delivery_failure AND deliveryTime>259200000`

**Metric**: Address issues  
**Threshold**: >5 per day  
**Severity**: Warning (data quality issue)  
**Query**: `event=delivery_failure AND reason=address_unreachable`

### Notification Failures

**Metric**: Channel failure rate  
**Threshold**: >10 per minute per channel  
**Severity**: High  
**Query**: `event=notification_failure GROUP BY channel`

**Metric**: Provider errors  
**Threshold**: Any provider downtime  
**Severity**: Critical  
**Query**: `event=notification_failure AND errorCode IN (provider_down, rate_limited)`

**Metric**: Queue backlog  
**Threshold**: >1000 pending notifications  
**Severity**: Warning  
**Query**: `notification_queue_depth>1000`

---

## Log Aggregation & Visualization

### Recommended Platforms

1. **AWS CloudWatch Logs** (if hosted on AWS)
   - Ship logs via CloudWatch agent
   - Create metric filters for alerting
   - Build CloudWatch dashboards

2. **Datadog**
   - Install Datadog agent
   - Auto-parse JSON logs
   - Pre-built APM dashboards

3. **ELK Stack** (Elasticsearch, Logstash, Kibana)
   - Self-hosted option
   - Powerful query language
   - Custom visualizations

4. **Grafana Loki**
   - Lightweight log aggregation
   - Integrates with Grafana dashboards
   - Low storage cost

### Shipping Logs

**Example**: Stream to CloudWatch
```javascript
import { logger } from './observability.js';
import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs';

const cwLogs = new CloudWatchLogs({ region: 'us-east-1' });

const transport = pino.transport({
  target: 'pino-cloudwatch',
  options: {
    logGroupName: '/app/laptop-platform',
    logStreamName: `${process.env.NODE_ENV}-${Date.now()}`,
    awsRegion: 'us-east-1',
  }
});
```

**Example**: Stream to Datadog
```bash
npm install pino-datadog
```
```javascript
const transport = pino.transport({
  target: 'pino-datadog',
  options: {
    apiKey: process.env.DATADOG_API_KEY,
    service: 'laptop-platform',
    env: process.env.NODE_ENV
  }
});
```

---

## Monitoring Dashboards

### Suggested Metrics

#### API Health
- Request rate (req/min)
- Error rate (5xx %)
- p50/p95/p99 latency
- Status code distribution

#### Authentication
- Login attempts (success/failure)
- Token refresh rate
- Session duration
- Failed auth reasons (pie chart)

#### Payments
- Transaction volume
- Success rate
- Decline rate by reason
- Average transaction value
- Gateway response times

#### Deliveries
- Pending deliveries
- Avg delivery time
- Failure rate
- Retry distribution
- SLA compliance %

#### Notifications
- Sent/failed/pending by channel
- Provider latency
- Bounce/complaint rates (email)
- Queue depth over time

---

## Security & Compliance

### PII Redaction

Automatically redacted fields:
- `req.headers.authorization`
- `req.body.password`
- `req.body.token`
- Credit card numbers (add custom redaction if needed)

### Custom Redaction

Add to observability.js logger config:
```javascript
redact: {
  paths: [
    'req.headers.authorization',
    'req.body.password',
    'req.body.token',
    'req.body.creditCard',
    'user.ssn',
    '*.email'  // Redact all email fields
  ],
  censor: '[REDACTED]'
}
```

### Retention Policies

- **Development logs**: 7 days
- **Production logs**: 90 days (compliance requirement)
- **Error traces**: 1 year (debugging historical issues)
- **Audit logs**: 7 years (regulatory compliance)

---

## Testing

### Verify Logging

```bash
# Start server with debug logging
LOG_LEVEL=debug npm run server:dev

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/test-db

# Check logs for structured JSON output
```

### Test Sentry Integration

```javascript
// Add to a test route
app.get('/test-sentry', () => {
  throw new Error('Test Sentry integration');
});
```

Visit `/test-sentry` and verify error appears in Sentry dashboard.

### Simulate Failures

```javascript
// Test auth failure logging
logAuthFailure({
  userId: 999,
  reason: 'invalid_credentials',
  ip: '127.0.0.1'
});

// Test payment issue logging
logPaymentIssue({
  orderId: 'test_ord_123',
  amount: 10000,
  gateway: 'test',
  errorCode: 'card_declined'
});
```

---

## Next Steps

### 1. Instrument Controllers

Add domain logging to existing controllers:

**Example**: Auth controller
```javascript
import { logAuthFailure } from '../observability.js';

export async function login(req, res) {
  const { email, password } = req.body;
  
  const user = await User.findByEmail(email);
  if (!user) {
    logAuthFailure({ email, reason: 'user_not_found', ip: req.ip });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    logAuthFailure({ userId: user.id, reason: 'invalid_password', ip: req.ip });
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Success path...
}
```

**Example**: Payment controller
```javascript
import { logPaymentIssue, sentryCapture } from '../observability.js';

export async function processPayment(req, res) {
  try {
    const charge = await stripe.charges.create({
      amount: req.body.amount,
      currency: 'usd',
      source: req.body.token
    });
    
    // Success...
  } catch (error) {
    logPaymentIssue({
      orderId: req.body.orderId,
      amount: req.body.amount,
      gateway: 'stripe',
      errorCode: error.code,
      reason: error.message
    });
    
    sentryCapture(error, {
      tags: { gateway: 'stripe', orderId: req.body.orderId },
      user: { id: req.user.id }
    });
    
    res.status(500).json({ error: 'Payment failed' });
  }
}
```

### 2. Set Up Log Sink

Choose and configure a log aggregation platform:
- Create account (CloudWatch/Datadog/etc.)
- Install transport library
- Update observability.js with transport config
- Verify logs flowing

### 3. Create Dashboards

Build dashboards for each domain:
- API health dashboard
- Auth monitoring dashboard
- Payment analytics dashboard
- Delivery tracking dashboard
- Notification status dashboard

### 4. Configure Alerts

Set up alerting based on rules above:
- Create metric queries
- Set thresholds
- Configure notification channels (email, Slack, PagerDuty)
- Test alert triggers

### 5. Establish Runbooks

Document response procedures:
- High error rate → Check recent deployments, database health
- Auth spike → Investigate potential attack, review firewall logs
- Payment failures → Verify gateway status, check webhook endpoints
- Delivery issues → Contact logistics partner, review address data
- Notification failures → Check provider status, verify credentials

---

## Troubleshooting

### Logs Not Appearing

**Issue**: No logs in console/sink  
**Fix**: Check `LOG_LEVEL` env var; ensure logger imported correctly

### Sentry Not Capturing Errors

**Issue**: Errors not appearing in Sentry dashboard  
**Fix**: Verify `SENTRY_DSN` is set; check error handler is registered after routes

### Request IDs Missing

**Issue**: Can't correlate logs across services  
**Fix**: Ensure `httpLogger` middleware registered before routes

### Performance Impact

**Issue**: Logging slowing down requests  
**Fix**: Use async transport; adjust log level to `warn` or `error` in production

---

## Cost Optimization

### Log Volume Management

- Set `LOG_LEVEL=warn` in production (info for debugging periods)
- Sample high-volume endpoints (e.g., health checks)
- Use Sentry sampling rates (10% traces, 5% profiles)
- Set retention policies per log criticality

### Estimated Costs (monthly)

**Small deployment** (1M req/month):
- Sentry: $26/month (Team plan, 50k events)
- CloudWatch Logs: ~$10/month (5GB ingestion)
- **Total**: ~$36/month

**Medium deployment** (10M req/month):
- Sentry: $99/month (Business plan, 500k events)
- Datadog: $15/host + log ingestion
- **Total**: ~$150/month

---

## Summary

✅ Structured logging with Pino (JSON, fast, redacted)  
✅ HTTP request/response logging with correlation IDs  
✅ Sentry error tracking and APM  
✅ Centralized error handler  
✅ Domain-specific log helpers for all tracked categories:
  - API errors
  - Auth failures
  - Payment issues
  - Delivery failures
  - Notification failures  
✅ Alerting rules defined for production monitoring  
✅ Security: PII redaction, configurable retention  

**Status**: Ready for controller instrumentation and log sink integration.
