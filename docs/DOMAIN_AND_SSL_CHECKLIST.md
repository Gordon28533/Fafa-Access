# Domain & SSL Setup Checklist

## Quick Start (5 Steps)

### ✅ Step 1: Choose Your Approach (5 minutes)

- [ ] **Option A: Cloudflare** (Recommended - Easiest)
  - Free SSL, auto-renewal, DDoS protection
  - Go to: cloudflare.com
  - Register domain (~5 minutes)
  - Done! SSL works automatically

- [ ] **Option B: Let's Encrypt** (Self-managed - Medium)
  - Free SSL, requires Linux/WSL
  - Automatic renewal if set up correctly
  - Better for complete server control

- [ ] **Option C: Self-Signed** (Development only - Quick)
  - For local testing only
  - No browser trust

### ✅ Step 2: Configure DNS (15 minutes)

```bash
# A Records
@ A YOUR_SERVER_IP
www A YOUR_SERVER_IP

# MX Records (email)
@ MX 5 gmail-smtp-in.l.google.com

# CAA Records (SSL authority)
@ CAA 0 issue "letsencrypt.org"
```

- [ ] DNS records configured in Cloudflare/Route53/registrar
- [ ] Propagation verified: `nslookup fafaaccess.com`
- [ ] Expected: Returns your server IP

### ✅ Step 3: Obtain SSL Certificate (10 minutes)

**Cloudflare:**
- [ ] Logged into Cloudflare dashboard
- [ ] SSL/TLS tab → Select "Full (Strict)"
- [ ] Certificate auto-issued (check Email inbox)

**Let's Encrypt:**
- [ ] Certbot installed
- [ ] Certificate issued: `certbot certonly --standalone -d fafaaccess.com`
- [ ] Files created in `/etc/letsencrypt/live/fafaaccess.com/`

**Self-Signed:**
- [ ] Run: `powershell scripts/setup-ssl.ps1`
- [ ] Select option 3
- [ ] Certificate files created in `./certs/`

### ✅ Step 4: Configure Express Server (10 minutes)

**Update `.env`:**
```env
DOMAIN=fafaaccess.com
WWW_DOMAIN=www.fafaaccess.com
HTTPS_ONLY=true
NODE_ENV=production
SSL_CERT_PATH=/etc/letsencrypt/live/fafaaccess.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/fafaaccess.com/privkey.pem
```

**Update `src/server.js`:**
```javascript
import https from 'https';
import fs from 'fs';

const app = createServer(); // Your Express app

const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

https.createServer(sslOptions, app).listen(443);
```

- [ ] `.env` updated with certificate paths
- [ ] `src/server.js` updated with HTTPS configuration
- [ ] `src/middleware/httpsRedirect.js` middleware created
- [ ] Middleware added to Express app: `app.use(httpsRedirect);`

### ✅ Step 5: Test & Verify (10 minutes)

```bash
# Test DNS
nslookup fafaaccess.com
# Expected: Your server IP

# Test HTTPS
curl -I https://fafaaccess.com
# Expected: 200 OK with SSL headers

# Check certificate
openssl s_client -connect fafaaccess.com:443 -brief
# Expected: Certificate information, no errors

# Test HTTP redirect
curl -I http://fafaaccess.com
# Expected: 301 redirect to https://
```

- [ ] DNS resolves to correct IP
- [ ] HTTPS accessible on port 443
- [ ] HTTP redirects to HTTPS
- [ ] No certificate warnings in browser
- [ ] Green padlock visible in address bar

---

## Pre-Launch Checklist

### Domain & Registration
- [ ] Domain registered with registrar or Cloudflare
- [ ] Domain ownership verified (if required)
- [ ] Domain nameservers pointing to DNS provider
- [ ] Domain propagation confirmed globally

### DNS Configuration
- [ ] A record configured (domain → server IP)
- [ ] www A record configured
- [ ] MX records added (email delivery)
- [ ] SPF record configured (email authentication)
- [ ] DMARC record configured (email policy)
- [ ] CAA record configured (SSL authority)
- [ ] All DNS records propagated (check with: `dig +short fafaaccess.com`)

### SSL Certificate
- [ ] SSL certificate obtained (Cloudflare/Let's Encrypt/Self-Signed)
- [ ] Certificate validity verified (`openssl x509 -noout -dates -in cert.pem`)
- [ ] Private key secure (permissions: 600 or in secure vault)
- [ ] Certificate chain complete (fullchain.pem not just cert.pem)
- [ ] Certificate covers all domains (fafaaccess.com and www.fafaaccess.com)

### Server Configuration
- [ ] Express server configured for HTTPS
- [ ] SSL certificate paths in .env (production)
- [ ] Port 443 accessible from internet (firewall rules)
- [ ] Port 80 redirects to 443
- [ ] HSTS header enabled
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] CORS whitelist updated with production domain

### HTTPS Enforcement
- [ ] All traffic redirected HTTP → HTTPS
- [ ] Canonical domain configured (www → non-www or vice versa)
- [ ] Mixed content disabled (all resources load over HTTPS)
- [ ] External APIs use HTTPS endpoints
- [ ] Database connections use SSL/TLS

### Auto-Renewal Setup
- [ ] Certificate auto-renewal configured
  - Cloudflare: ✅ Automatic (30 days before expiry)
  - Let's Encrypt: Check with `sudo certbot certificates`
  - Self-Signed: Manual renewal required
- [ ] Renewal test executed: `certbot renew --dry-run`
- [ ] Renewal logs monitored for errors

### Monitoring & Alerts
- [ ] Certificate expiry monitoring enabled
- [ ] Alert email configured (admin@fafaaccess.com)
- [ ] Cron job/scheduled task for monitoring
- [ ] Monitoring script deployed: `scripts/check-ssl-expiry.sh`

### Security & Compliance
- [ ] SSL Labs test passed (A+ rating if possible)
- [ ] No weak cipher suites configured
- [ ] TLS 1.2+ minimum enforced
- [ ] OCSP stapling enabled (optional, improves performance)
- [ ] Certificate pinning evaluated (optional, advanced)
- [ ] Security headers verified with observatory.mozilla.org

### Testing
- [ ] Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test with curl: `curl -I https://fafaaccess.com`
- [ ] Test with openssl: `echo | openssl s_client -connect fafaaccess.com:443`
- [ ] Test redirect chains (http://www → https://www → https://non-www)
- [ ] Test API endpoints all use HTTPS
- [ ] Load test with HTTPS (no performance regression)

### Documentation
- [ ] Domain registrar credentials stored securely
- [ ] SSL certificate location documented
- [ ] Renewal procedures documented
- [ ] Emergency contact list created
- [ ] Runbook for certificate renewal created
- [ ] Monitoring configuration documented

---

## Deployment Steps

### Pre-Deployment
```bash
# Verify certificate
sudo openssl x509 -noout -dates -in /etc/letsencrypt/live/fafaaccess.com/fullchain.pem

# Test auto-renewal
sudo certbot renew --dry-run

# Update .env
export DOMAIN=fafaaccess.com
export SSL_CERT_PATH=/etc/letsencrypt/live/fafaaccess.com/fullchain.pem
export SSL_KEY_PATH=/etc/letsencrypt/live/fafaaccess.com/privkey.pem
export HTTPS_ONLY=true
```

### Deployment
```bash
# Install dependencies
npm install

# Build application (if needed)
npm run build

# Verify server
npm run server &

# Test endpoints
curl https://fafaaccess.com/health
curl https://fafaaccess.com/api/test-db
```

### Post-Deployment
```bash
# Verify certificate is active
echo | openssl s_client -connect fafaaccess.com:443 2>/dev/null | grep -A 5 "subject="

# Check certificate expiry
echo | openssl s_client -connect fafaaccess.com:443 2>/dev/null | openssl x509 -noout -dates

# Test redirect
curl -I http://fafaaccess.com

# Monitor logs
tail -f /var/log/ssl-cert-monitor.log

# Setup renewal monitoring cron
sudo crontab -e
# Add: 0 2 * * * /path/to/check-ssl-expiry.sh fafaaccess.com 30
```

---

## Troubleshooting

### Issue: "SSL Certificate Problem: self signed certificate"
**Solution:**
- Use Cloudflare (auto-trusted) or Let's Encrypt (widely trusted)
- Don't use self-signed in production
- Check certificate chain: `openssl x509 -noout -text -in fullchain.pem`

### Issue: "Certificate doesn't match domain"
**Solution:**
- Verify certificate covers correct domain
- Check SANs (Subject Alternative Names): `echo | openssl s_client -connect fafaaccess.com:443 | grep "Subject:"` 
- Re-issue with correct domain

### Issue: "Certificate expired"
**Solution:**
```bash
# Check expiry
openssl x509 -noout -dates -in cert.pem

# Renew Let's Encrypt
certbot renew --force-renewal

# Verify auto-renewal set up
systemctl status certbot.timer
```

### Issue: "ERR_TOO_MANY_REDIRECTS"
**Solution:**
- Check redirect logic in `src/middleware/httpsRedirect.js`
- Verify X-Forwarded-Proto header handling
- Check nginx/ALB configuration
- Test: `curl -I http://fafaaccess.com -L`

### Issue: "MIXED CONTENT" warning
**Solution:**
- All resources must load over HTTPS
- Check external API endpoints (use HTTPS)
- Check image/font URLs (use HTTPS)
- Check script sources (CDN, use HTTPS)

### Issue: "DNS not resolving"
**Solution:**
```bash
# Check propagation
nslookup fafaaccess.com
nslookup fafaaccess.com 8.8.8.8

# Clear DNS cache
ipconfig /flushdns  # Windows
sudo dscacheutil -flushcache  # Mac
sudo systemctl restart systemd-resolved  # Linux
```

---

## Monitoring Checklist

### Daily (First Week)
- [ ] Certificate status verified
- [ ] HTTPS endpoints responding
- [ ] No security errors in logs
- [ ] Redirect working (HTTP → HTTPS)
- [ ] No mixed content warnings

### Weekly
- [ ] Certificate expiry checked
- [ ] Renewal process working
- [ ] Monitoring logs reviewed
- [ ] Alerts tested

### Monthly
- [ ] Certificate validity verified
- [ ] SSL/TLS configuration audited
- [ ] Security headers tested (observatory.mozilla.org)
- [ ] SSL Labs test run (ssllabs.com)
- [ ] Renewal logs reviewed

### Quarterly
- [ ] Certificate audit performed
- [ ] Domain renewal status verified
- [ ] Security incident review
- [ ] Renewal runbook updated

---

## Cost Summary

| Item | Cost | Frequency | Notes |
|------|------|-----------|-------|
| Domain | $8-15 | Yearly | Cloudflare free, registrars vary |
| SSL Certificate | Free | Yearly | Let's Encrypt or Cloudflare free |
| Cloudflare Pro (optional) | $20/mo | Monthly | Enhanced DDoS/WAF |
| Monitoring (optional) | Free-$50 | Monthly | Internal or external monitoring |
| **Total (Minimal)** | **$8-15** | **Yearly** | **Most cost-effective** |

---

## References

- [Domain & SSL Setup Guide](./DOMAIN_AND_SSL_SETUP.md)
- [DNS Records Configuration](./DNS_RECORDS_CONFIG.txt)
- [Deployment Architecture](./DEPLOYMENT_ARCHITECTURE.md)
- [Nginx Configuration](./scripts/nginx-fafaaccess.conf)
- [Certificate Monitor Script](./scripts/check-ssl-expiry.sh)
- [SSL Setup Script](./scripts/setup-ssl.ps1)

---

## Support & Next Steps

### Need Help?
1. Check troubleshooting section above
2. Review full guide: `DOMAIN_AND_SSL_SETUP.md`
3. Run diagnostic script: `scripts/check-ssl-expiry.sh fafaaccess.com`
4. Test with online tools:
   - SSL Labs: https://www.ssllabs.com/ssltest/
   - Observatory: https://observatory.mozilla.org/
   - MXToolbox: https://mxtoolbox.com/

### Quick Commands

```bash
# Check certificate
openssl s_client -connect fafaaccess.com:443 -brief

# Renew certificate
certbot renew --force-renewal

# Monitor certificate
./scripts/check-ssl-expiry.sh fafaaccess.com 30

# Test HTTPS
curl -I https://fafaaccess.com

# Test HTTP redirect
curl -I http://fafaaccess.com -L

# Check DNS
nslookup fafaaccess.com
dig fafaaccess.com +short
```

---

**Last Updated:** January 2026  
**Status:** ✅ Ready for Production  
**Maintenance:** Quarterly review
