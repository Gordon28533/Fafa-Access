# Domain & SSL Setup Guide

## Overview

Complete production-ready domain configuration and automatic SSL/TLS certificate management for the Fafa Access laptop application. Covers custom domain setup, HTTPS enforcement, auto-renewal, and redirect rules.

---

## Part 1: Domain Registration & Configuration

### 1.1 Domain Provider Selection

**Recommended Options:**

| Provider | Features | Cost | Notes |
|----------|----------|------|-------|
| **Cloudflare** | Free SSL, DDoS protection, DNS, auto-renew | Free-$25/mo | Best for startups |
| **GoDaddy** | Simple interface, good support | $1-$15/yr | Good for beginners |
| **Namecheap** | Affordable, privacy protection, API | $8-$15/yr | Developer-friendly |
| **Google Domains** | Simple, integrated with Google Cloud | $12/yr | Works with Firebase/Cloud |

**Recommendation:** Use **Cloudflare** (free tier includes SSL, DDoS protection, global CDN).

### 1.2 Domain Registration Steps

#### Option A: Using Cloudflare (Recommended)

```bash
# 1. Register domain at Cloudflare
# - Go to cloudflare.com
# - Click "Register" → Search for domain name
# - Add to cart → Purchase ($8.99-$15/yr)

# 2. Cloudflare automatically:
# ✅ Points nameservers to Cloudflare
# ✅ Enables free Universal SSL
# ✅ Activates auto-renewal
# ✅ Provides DDoS protection
```

#### Option B: Register Elsewhere, Use Cloudflare DNS

```bash
# 1. Register domain at GoDaddy/Namecheap
# 2. Go to Cloudflare.com → Add Site
# 3. Enter your domain name
# 4. Copy Cloudflare's nameservers:
#    - kate.ns.cloudflare.com
#    - kris.ns.cloudflare.com

# 5. In registrar (GoDaddy/Namecheap):
#    - Go to DNS settings
#    - Replace nameservers with Cloudflare's nameservers
#    - Wait 24-48 hours for propagation
```

### 1.3 DNS Records Configuration

Add these DNS records in Cloudflare/registrar:

```
Domain: fafaaccess.com (replace with your domain)

A Record:
  Name: @
  Type: A
  Content: <YOUR_SERVER_IP>  (e.g., 20.188.45.123)
  TTL: Auto
  Proxy: ⚙️ (Proxied by Cloudflare - enables SSL)

A Record (www subdomain):
  Name: www
  Type: A
  Content: <YOUR_SERVER_IP>
  TTL: Auto
  Proxy: ⚙️

MX Records (for email):
  Priority 10: mail.fafaaccess.com
  Priority 20: mail2.fafaaccess.com

TXT Records (for email verification):
  Name: _dmarc
  Value: v=DMARC1; p=quarantine; rua=mailto:admin@fafaaccess.com

CAA Records (SSL certificate authority):
  Flags: 0
  Tag: issue
  Value: letsencrypt.org
```

### 1.4 Verify Domain Propagation

```bash
# Test DNS propagation
nslookup fafaaccess.com

# Expected output:
# Non-authoritative answer:
# Name: fafaaccess.com
# Address: 20.188.45.123

# Cloudflare DNS check
dig fafaaccess.com +short
# Should return your server IP
```

---

## Part 2: SSL/TLS Certificate Setup

### 2.1 Option A: Cloudflare Free SSL (Recommended)

#### Why Cloudflare SSL?
- ✅ **Free** - No cost ever
- ✅ **Automatic** - Issues in minutes
- ✅ **Auto-renewal** - Renews 30 days before expiry
- ✅ **DDoS Protection** - Included
- ✅ **Global CDN** - Fast delivery worldwide
- ✅ **Easy** - No configuration needed

#### Setup Steps:

```bash
# 1. In Cloudflare dashboard:
#    - Go to SSL/TLS tab
#    - Select "Flexible" (recommended) or "Full"

# 2. Cloudflare will:
#    - Issue free SSL certificate
#    - Auto-renew 30 days before expiry
#    - Use Universal SSL

# 3. Verify SSL is working:
#    curl -I https://fafaaccess.com
#    # Should return 200 with Cf-Cache-Status header
```

**SSL Modes Explained:**

| Mode | Encryption | When to Use |
|------|------------|------------|
| **Flexible** | Client→Cloudflare: HTTPS<br>Cloudflare→Origin: HTTP | Origin (your server) doesn't have SSL |
| **Full** | Both encrypted, unverified cert | Origin has self-signed SSL |
| **Full (Strict)** | Both encrypted, verified cert | Origin has valid SSL certificate |
| **Off** | No encryption | Not recommended (unsafe) |

**Recommendation:** Use **Full (Strict)** mode with a valid server certificate.

### 2.2 Option B: Let's Encrypt SSL (Zero Cost + Local Control)

Use if you want certificate on origin server (not just Cloudflare edge).

#### Install Certbot (Let's Encrypt Client)

**On Linux/Mac:**
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Or with Homebrew (Mac)
brew install certbot
```

**On Windows (using Windows Subsystem for Linux):**
```bash
# Enable WSL2
wsl --install

# Inside WSL terminal:
sudo apt-get install certbot python3-certbot-nginx
```

#### Issue Certificate

```bash
# Standalone mode (no web server running):
sudo certbot certonly --standalone \
  -d fafaaccess.com \
  -d www.fafaaccess.com \
  --email admin@fafaaccess.com \
  --agree-tos

# Nginx mode (if Nginx is running):
sudo certbot --nginx \
  -d fafaaccess.com \
  -d www.fafaaccess.com

# Result:
# Certificate: /etc/letsencrypt/live/fafaaccess.com/fullchain.pem
# Private Key: /etc/letsencrypt/live/fafaaccess.com/privkey.pem
```

#### Configure Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Automatic renewal via cron (runs 2x daily):
# Already set up by Certbot installation

# Verify renewal timer (systemd):
sudo systemctl status certbot.timer
sudo systemctl list-timers certbot

# Manual renewal:
sudo certbot renew --force-renewal
```

### 2.3 Configure Express Server for HTTPS

Update `src/server.js` to use SSL certificates:

```javascript
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = createServer(); // Your Express app

// Load SSL certificates
const sslOptions = {
  key: fs.readFileSync(
    process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/fafaaccess.com/privkey.pem'
  ),
  cert: fs.readFileSync(
    process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/fafaaccess.com/fullchain.pem'
  ),
};

// Start HTTPS server
if (process.env.NODE_ENV === 'production') {
  https.createServer(sslOptions, app).listen(443, () => {
    console.log('🔒 HTTPS Server running on port 443');
  });
  
  // Redirect HTTP → HTTPS
  app.listen(80, () => {
    console.log('Redirecting HTTP → HTTPS');
  });
} else {
  app.listen(3000, () => {
    console.log('🚀 Development server on port 3000');
  });
}
```

---

## Part 3: HTTPS Enforcement & Redirects

### 3.1 Server-Level Redirect (HTTP → HTTPS)

#### Using Express Middleware

```javascript
// src/middleware/httpsRedirect.js
export const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(301, `https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  } else {
    next();
  }
};

// In src/server.js
import { httpsRedirect } from './middleware/httpsRedirect.js';
app.use(httpsRedirect);
```

#### Using Nginx

```nginx
# /etc/nginx/sites-available/fafaaccess.com
server {
  listen 80;
  server_name fafaaccess.com www.fafaaccess.com;

  # Redirect all HTTP to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name fafaaccess.com www.fafaaccess.com;

  # SSL certificates
  ssl_certificate /etc/letsencrypt/live/fafaaccess.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/fafaaccess.com/privkey.pem;

  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Proxy to Node.js backend
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

#### Using Cloudflare Page Rules

```
Rule 1:
  If the URL matches: http://fafaaccess.com/*
  Then the settings are:
    → Forwarding URL (Status Code: 301)
    → To URL: https://fafaaccess.com/$1

Rule 2 (www):
  If the URL matches: http://www.fafaaccess.com/*
  Then: Forwarding URL (301) → https://fafaaccess.com/$1
```

### 3.2 HSTS (HTTP Strict Transport Security)

Force browsers to always use HTTPS:

```javascript
// src/server.js
import helmet from 'helmet';

app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true, // For HSTS preload list
}));
```

Or in Nginx:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 3.3 Additional Redirect Rules

#### Canonical Domain (www ↔ non-www)

```javascript
// Express middleware
export const canonicalDomain = (req, res, next) => {
  const host = req.header('host');
  
  if (host === 'www.fafaaccess.com') {
    // Redirect www → non-www
    return res.redirect(301, `https://fafaaccess.com${req.url}`);
  }
  next();
};
```

#### Legacy URL Redirects

```javascript
// src/routes/legacyRedirects.js
app.get('/old-application-page', (req, res) => {
  res.redirect(301, '/apply');
});

app.get('/old-admin-dashboard', (req, res) => {
  res.redirect(301, '/admin/dashboard');
});
```

---

## Part 4: Auto-Renewal Configuration

### 4.1 Let's Encrypt Auto-Renewal

```bash
# Check renewal configuration
sudo certbot renew --dry-run

# Output should show:
# Cert not yet due for renewal

# Verify systemd timer (Linux)
sudo systemctl status certbot.timer
sudo systemctl enable certbot.timer

# View renewal logs
sudo tail -f /var/log/letsencrypt/renewal.log

# Manual renewal with webhook notification
sudo certbot renew \
  --renew-hook "systemctl reload nginx" \
  --quiet
```

### 4.2 Cloudflare Auto-Renewal

```bash
# Cloudflare handles all auto-renewal automatically
# Monitor in dashboard:
# 1. Go to SSL/TLS tab
# 2. Check "Edge Certificates" section
# 3. Should show renewal status

# No action needed - Cloudflare renews 30 days before expiry
```

### 4.3 Certificate Monitoring & Alerts

**Monitor in .env:**

```env
# Email alerts for cert expiration
SSL_ALERT_EMAIL=admin@fafaaccess.com
CERT_RENEWAL_DAYS_BEFORE=30  # Alert 30 days before expiry
```

**Create monitoring script** (`scripts/check-ssl-expiry.sh`):

```bash
#!/bin/bash
# Check SSL certificate expiry

DOMAIN="fafaaccess.com"
EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)

echo "SSL Certificate for $DOMAIN expires: $EXPIRY_DATE"

# Calculate days remaining
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
NOW_EPOCH=$(date +%s)
DAYS_REMAINING=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "Days remaining: $DAYS_REMAINING"

if [ $DAYS_REMAINING -lt 30 ]; then
  echo "⚠️ WARNING: Certificate expires in $DAYS_REMAINING days!"
  # Send alert email
fi
```

---

## Part 5: Environment Variables

Update `.env` file:

```env
# Domain Configuration
DOMAIN=fafaaccess.com
WWW_DOMAIN=www.fafaaccess.com
FRONTEND_URL=https://fafaaccess.com
API_BASE_URL=https://api.fafaaccess.com

# SSL Configuration
NODE_ENV=production
SSL_KEY_PATH=/etc/letsencrypt/live/fafaaccess.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/fafaaccess.com/fullchain.pem
SSL_MODE=full-strict  # For Cloudflare

# HTTPS & Security
HTTPS_ONLY=true
HSTS_MAX_AGE=31536000  # 1 year
HSTS_PRELOAD=true

# Certificate Renewal Monitoring
SSL_ALERT_EMAIL=admin@fafaaccess.com
CERT_RENEWAL_DAYS_BEFORE=30

# Cloudflare (if using)
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_EMAIL=admin@fafaaccess.com
```

---

## Part 6: Security Headers & CORS

### 6.1 Cloudflare Security Headers

In Cloudflare dashboard → Caching Rules:

```
Rule: Add Security Headers
Condition: Hostname matches fafaaccess.com
Settings:
  Security Level: High
  Browser Integrity Check: On
  Email Obfuscation: On
```

### 6.2 Express Security Headers

```javascript
import helmet from 'helmet';
import cors from 'cors';

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'https://fafaaccess.com',
    'https://www.fafaaccess.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Additional headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

## Part 7: Deployment Checklist

### Pre-Launch
- [ ] Domain registered
- [ ] DNS records configured and propagated
- [ ] SSL certificate issued (Let's Encrypt or Cloudflare)
- [ ] HTTPS enforced on Express server
- [ ] HTTP → HTTPS redirects working
- [ ] HSTS header enabled
- [ ] Security headers configured
- [ ] CORS whitelist updated with production domain
- [ ] SSL certificate auto-renewal tested
- [ ] Certificate expiry monitoring set up
- [ ] Server can handle HTTPS traffic on port 443

### Go-Live
- [ ] DNS cutover to production server IP
- [ ] SSL certificate validity verified: `openssl s_client -connect fafaaccess.com:443`
- [ ] Browser certificate warning check - should be green padlock
- [ ] Redirect rules tested (http→https, www→non-www)
- [ ] API clients use HTTPS endpoints
- [ ] Frontend environment variables updated
- [ ] Monitoring and alerts configured

### Post-Launch
- [ ] Daily SSL certificate status check (first week)
- [ ] Certificate renewal logs monitored
- [ ] 404s and security issues logged
- [ ] Monthly security audit
- [ ] Quarterly certificate and domain renewal verification

---

## Part 8: Troubleshooting

### Issue: "Not Secure" Warning in Browser

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/fafaaccess.com/fullchain.pem -text -noout

# Check if cert is in validity period
echo | openssl s_client -servername fafaaccess.com -connect fafaaccess.com:443 2>/dev/null | grep -A 2 "Verify return code"

# Expected: Verify return code: 0 (ok)
```

### Issue: Redirect Loop

```javascript
// Check X-Forwarded-Proto header (from load balancer/Cloudflare)
export const httpsRedirect = (req, res, next) => {
  const proto = req.header('x-forwarded-proto') || req.protocol;
  
  if (proto !== 'https') {
    res.redirect(301, `https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
};
```

### Issue: Certificate Renewal Failed

```bash
# Check renewal logs
sudo tail -50 /var/log/letsencrypt/renewal.log

# Force renewal with verbose output
sudo certbot renew --force-renewal -v

# Verify renewal process
sudo certbot certificates

# If renewal fails, manually renew:
sudo certbot certonly --standalone --force-renewal \
  -d fafaaccess.com \
  -d www.fafaaccess.com
```

### Issue: DNS Not Propagating

```bash
# Check from multiple locations
nslookup fafaaccess.com 8.8.8.8
nslookup fafaaccess.com 1.1.1.1

# Clear local DNS cache
# Windows:
ipconfig /flushdns

# Mac:
sudo dscacheutil -flushcache

# Linux:
sudo resolvectl flush-caches
```

---

## Part 9: Cost & Timeline

### Timeline
| Task | Timeline | Notes |
|------|----------|-------|
| Domain registration | 5 minutes | Instant activation |
| DNS propagation | 24-48 hours | Usually 2-6 hours |
| SSL certificate issuance | 5-30 minutes | Automatic |
| Server configuration | 30 minutes | Update .env + restart |
| Verification | 10 minutes | Test HTTPS endpoints |

### Cost Breakdown
| Component | Cost | Recurring |
|-----------|------|-----------|
| Domain name | $8-15 | Yearly |
| SSL certificate (Let's Encrypt) | $0 | Free, auto-renew |
| Cloudflare (free tier) | $0 | Free |
| Cloudflare Pro (optional) | $20/mo | Enhanced DDoS/WAF |
| Dedicated IP (optional) | $20-40/mo | Not needed with Cloudflare |
| **Total (minimal)** | **$8-15/yr** | **Yearly** |

---

## Part 10: Best Practices

### ✅ DO

- ✅ Use HSTS to force HTTPS
- ✅ Enable certificate auto-renewal
- ✅ Monitor certificate expiry 30 days before renewal
- ✅ Use TLS 1.2+ only
- ✅ Implement CAA DNS records
- ✅ Redirect all HTTP to HTTPS
- ✅ Use strong cipher suites
- ✅ Enable OCSP stapling
- ✅ Test certificate renewal process monthly

### ❌ DON'T

- ❌ Use HTTP in production
- ❌ Ignore certificate expiry warnings
- ❌ Disable SSL certificate validation
- ❌ Use self-signed certificates in production
- ❌ Share private keys in version control
- ❌ Use TLS 1.0 or 1.1
- ❌ Disable security headers
- ❌ Mix HTTP and HTTPS content
- ❌ Trust old/weak certificate authorities

---

## Quick Start

```bash
# 1. Register domain on Cloudflare
#    → Automatic SSL in ~5 minutes
#    → Skip to step 4

# 2. OR use Let's Encrypt:
sudo certbot certonly --standalone \
  -d fafaaccess.com \
  -d www.fafaaccess.com \
  --email admin@fafaaccess.com \
  --agree-tos

# 3. Update .env with certificate paths
SSL_KEY_PATH=/etc/letsencrypt/live/fafaaccess.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/fafaaccess.com/fullchain.pem

# 4. Restart Express server
npm run server

# 5. Verify HTTPS
curl -I https://fafaaccess.com
# Should return 200 with security headers

# 6. Check certificate details
openssl s_client -connect fafaaccess.com:443 -brief
```

---

## Related Documentation

- [DEPLOYMENT_ARCHITECTURE.md](./DEPLOYMENT_ARCHITECTURE.md) - Full deployment setup
- [BACKEND_ARCHITECTURE_REFACTOR.md](./BACKEND_ARCHITECTURE_REFACTOR.md) - Backend security
- [Database SSL Configuration](./DATABASE_MIGRATION_GUIDE.md#SSL-Connection-Issues)

