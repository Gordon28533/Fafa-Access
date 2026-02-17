# Security Testing Guide

This guide provides practical tests to verify the security hardening implementation.

## Quick Security Tests

### 1. Test CORS Protection
```powershell
# Test with invalid origin (should be blocked)
$headers = @{
  "Origin" = "http://evil.com"
  "Access-Control-Request-Method" = "POST"
}
Invoke-WebRequest -Uri http://localhost:3000/api/test-db `
  -Headers $headers `
  -Method OPTIONS -Verbose

# Test with allowed origin (should succeed)
$headers = @{
  "Origin" = "http://localhost:5173"
}
Invoke-WebRequest -Uri http://localhost:3000/api/test-db `
  -Headers $headers `
  -Method OPTIONS
```

### 2. Test Rate Limiting
```powershell
# Make 10+ rapid requests - should hit limit after 5 auth attempts
for ($i = 1; $i -le 10; $i++) {
  Write-Host "Request $i..."
  Invoke-WebRequest -Uri http://localhost:3000/api/auth/login `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body '{"email":"test@test.com","password":"test"}' `
    -ErrorAction SilentlyContinue
}
# After 5 failed auth attempts, should see: "Too many authentication attempts..."
```

### 3. Test Input Sanitization
```powershell
# Try NoSQL injection attack - dangerous $ characters should be stripped
$payload = @{
  email = 'admin@test.com'
  password = @{
    '$ne' = ''  # This should be sanitized
  }
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/auth/login `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $payload
# The $ in '$ne' will be stripped by sanitization middleware
```

### 4. Test Security Headers
```powershell
# Check for Helmet headers
$response = Invoke-WebRequest -Uri http://localhost:3000/health
$response.Headers | Select-Object @(
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-XSS-Protection',
  'Content-Security-Policy',
  'Referrer-Policy'
)
# Should see all security headers present
```

### 5. Test Request Size Limits
```powershell
# Create a 15KB payload (exceeds 10KB limit)
$largePayload = @{
  email = 'test@test.com'
  data = 'A' * 15000  # Large string
} | ConvertTo-Json

try {
  Invoke-WebRequest -Uri http://localhost:3000/api/auth/login `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $largePayload
} catch {
  Write-Host "Expected error (413 Payload Too Large): $_"
}
```

### 6. Test Error Masking (Production Mode)
```powershell
# Set production mode to test error masking
$env:NODE_ENV = "production"

# Try to access non-existent endpoint
Invoke-WebRequest -Uri http://localhost:3000/api/non-existent `
  -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty Content |
  ConvertFrom-Json

# In production, should NOT show stack traces or detailed error info
```

### 7. Test Secure Cookies
```powershell
# Login and check cookie attributes
$response = Invoke-WebRequest -Uri http://localhost:3000/api/auth/login `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"student@test.com","password":"password123"}' `
  -SessionVariable session

# Check cookies
$session.Cookies.GetCookies("http://localhost:3000") | ForEach-Object {
  Write-Host "Cookie: $($_.Name)"
  Write-Host "  Value: $($_.Value)"
  Write-Host "  Path: $($_.Path)"
  Write-Host "  Domain: $($_.Domain)"
}
```

## Browser-Based Testing

### 1. Test CSP (Content Security Policy)
```javascript
// In browser console, this should work:
console.log("CSP allows self-hosted scripts");

// This should be blocked by CSP:
fetch('http://evil.com/script.js')  // Will be blocked
```

### 2. Test HSTS (HTTP Strict Transport Security)
```bash
# curl should show HSTS header
curl -I http://localhost:3000/health | grep -i "strict-transport"
# Output: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 3. Test Clickjacking Protection
```javascript
// In an iframe, page should NOT load (protected by X-Frame-Options)
// Open browser console
const iframe = document.createElement('iframe');
iframe.src = 'http://localhost:3000/';
document.body.appendChild(iframe);
// Should fail or show blank due to X-Frame-Options: DENY
```

## Automated Security Scanning

### Using OWASP ZAP
```bash
# Download from https://www.zaproxy.org/
# Scan the application
zaproxy -cmd -quickurl http://localhost:3000 -quickout report.html
```

### Using npm audit
```bash
# Check for known vulnerabilities
npm audit

# Fix automatically (use with caution)
npm audit fix
```

## Load/Stress Testing Rate Limits

```powershell
# Test global rate limiter (100 req/15min in production)
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$successCount = 0
$rateLimitCount = 0

for ($i = 1; $i -le 150; $i++) {
  try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/health `
      -TimeoutSec 5 `
      -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 429) {
      $rateLimitCount++
    } else {
      $successCount++
    }
  } catch {
    if ($_.Exception.Response.StatusCode -eq 429) {
      $rateLimitCount++
    }
  }
  
  Start-Sleep -Milliseconds 100
}

Write-Host "Success: $successCount"
Write-Host "Rate Limited: $rateLimitCount"
Write-Host "Time: $($stopwatch.Elapsed.TotalSeconds)s"
```

## Security Checklist

Before deploying to production:

- [ ] Test CORS with your actual frontend domain
- [ ] Verify rate limiting is appropriate for your use case
- [ ] Check security headers with browser DevTools
- [ ] Test error messages don't leak sensitive info
- [ ] Verify database is using SSL connection
- [ ] Set `NODE_ENV=production`
- [ ] Update `COOKIE_SECRET` with strong random value
- [ ] Configure reverse proxy (Nginx/CloudFlare) with rate limiting
- [ ] Enable DDoS protection
- [ ] Set up monitoring and alerting
- [ ] Review logs for suspicious activity

## Performance Impact

Security middleware has minimal performance impact:
- Helmet headers: < 1ms
- Rate limiting: ~1-2ms per request
- Input sanitization: < 1ms
- CORS validation: < 0.5ms

**Total overhead**: ~3-5ms per request (negligible on most systems)

## References

- [OWASP Top 10 API Security](https://owasp.org/www-project-api-security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
