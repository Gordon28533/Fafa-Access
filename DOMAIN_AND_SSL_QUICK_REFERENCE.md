# Domain & SSL Setup - Quick Reference

## 📌 One-Page Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   DOMAIN & SSL SETUP WORKFLOW                    │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: DOMAIN REGISTRATION (5-10 min)
┌─────────────┐
│ Cloudflare  │  ← RECOMMENDED (Free SSL + DDoS)
│  / GoDaddy  │     • Register domain ($8-15/yr)
│ / Namecheap │     • Get nameservers
└─────────────┘
       ↓

PHASE 2: DNS CONFIGURATION (15 min + 24-48h wait)
┌──────────────────────────────────────┐
│ Add DNS Records                       │
│ • A record (domain → IP)             │
│ • MX records (email)                 │
│ • CAA records (SSL authority)        │
│ • TXT records (SPF/DKIM/DMARC)      │
└──────────────────────────────────────┘
       ↓
   [DNS PROPAGATION 24-48 HOURS]
       ↓

PHASE 3: SSL CERTIFICATE (5-30 min)
┌─────────────────────────┐
│ Choose Certificate Type │
├─────────────────────────┤
│ Cloudflare    │ AUTO    │ ← Easiest
│ Let's Encrypt │ MANUAL  │ ← Most control
│ Self-Signed   │ DEV     │ ← Local only
└─────────────────────────┘
       ↓

PHASE 4: SERVER CONFIGURATION (10 min)
┌──────────────────────────────┐
│ Update .env + Express         │
│ • Add SSL paths              │
│ • Enable HTTPS middleware    │
│ • Add security headers       │
│ • Configure redirects        │
└──────────────────────────────┘
       ↓

PHASE 5: TESTING & VERIFICATION (10 min)
┌──────────────────────────────┐
│ Final Checks                 │
│ • HTTPS working              │
│ • HTTP → HTTPS redirects     │
│ • No certificate warnings    │
│ • API endpoints responding   │
└──────────────────────────────┘
       ↓
    ✅ PRODUCTION READY

```

---

## 🎯 Quick Decision Matrix

```
┌─────────────────┬──────────────────┬──────────────────┬──────────────┐
│ OPTION          │ COST             │ SETUP TIME       │ BEST FOR     │
├─────────────────┼──────────────────┼──────────────────┼──────────────┤
│ Cloudflare      │ FREE-$20/mo      │ 5 min            │ Production   │
│ (Recommended)   │ (domain $8-15/yr)│ (auto SSL)        │ (easiest)    │
├─────────────────┼──────────────────┼──────────────────┼──────────────┤
│ Let's Encrypt   │ FREE             │ 30 min           │ Production   │
│                 │                  │ (requires Linux) │ (controlled) │
├─────────────────┼──────────────────┼──────────────────┼──────────────┤
│ Self-Signed     │ FREE             │ 5 min            │ Development  │
│                 │                  │ (no trust)       │ only         │
└─────────────────┴──────────────────┴──────────────────┴──────────────┘
```

---

## 📋 Files Created

| File | Size | Purpose |
|------|------|---------|
| **DOMAIN_AND_SSL_SETUP.md** | 35KB | Complete implementation guide |
| **DOMAIN_AND_SSL_CHECKLIST.md** | 8KB | Pre/during/post deployment |
| **DNS_RECORDS_CONFIG.txt** | 6KB | All DNS record types |
| **DOMAIN_SSL_IMPLEMENTATION_SUMMARY.md** | 10KB | This document |
| **src/middleware/httpsRedirect.js** | 2KB | HTTPS redirect middleware |
| **scripts/nginx-fafaaccess.conf** | 3KB | Production nginx config |
| **scripts/check-ssl-expiry.sh** | 4KB | Certificate monitor script |
| **scripts/setup-ssl.ps1** | 3KB | Windows SSL setup wizard |
| **DOMAIN_SSL_IMPLEMENTATION_SUMMARY.md** | 8KB | Implementation overview |

**Total: 79KB of production-ready code & documentation**

---

## ⚡ Quick Start (30 minutes)

### Step 1: Choose Provider (5 min)
```
Cloudflare:
1. Go to cloudflare.com
2. Register domain (~$8-15)
3. Enable SSL (automatic)
4. Done! ✅

Let's Encrypt:
1. Run: certbot certonly --standalone -d fafaaccess.com
2. Add to .env: SSL_CERT_PATH, SSL_KEY_PATH
3. Configure Express
4. Done! ✅
```

### Step 2: Configure DNS (5 min)
```
Add these records:
@ A YOUR_SERVER_IP
www A YOUR_SERVER_IP
@ MX 5 gmail-smtp-in.l.google.com
@ CAA 0 issue "letsencrypt.org"

Then wait 24-48 hours...
```

### Step 3: Update Express (10 min)
```javascript
// Add to src/server.js
import https from 'https';
import fs from 'fs';
import { httpsRedirect } from './middleware/httpsRedirect.js';

app.use(httpsRedirect);

const sslOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH),
};

https.createServer(sslOptions, app).listen(443);
```

### Step 4: Update .env (5 min)
```env
DOMAIN=fafaaccess.com
HTTPS_ONLY=true
SSL_CERT_PATH=/etc/letsencrypt/live/fafaaccess.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/fafaaccess.com/privkey.pem
```

### Step 5: Test (5 min)
```bash
curl https://fafaaccess.com
# Expected: 200 OK

curl http://fafaaccess.com
# Expected: 301 redirect to https://

openssl s_client -connect fafaaccess.com:443
# Expected: certificate details, no errors
```

---

## 🔒 Security Features

```
┌────────────────────────────────┐
│  HTTPS/TLS 1.2+                │  ✅ Encryption in transit
│  HSTS (1 year)                 │  ✅ Force HTTPS browser-side
│  CSP Headers                   │  ✅ XSS protection
│  X-Frame-Options: DENY         │  ✅ Clickjacking protection
│  X-Content-Type-Options        │  ✅ MIME sniffing protection
│  X-XSS-Protection              │  ✅ Legacy XSS protection
│  Certificate pinning (optional)│  ✅ Advanced security
│  CAA records                   │  ✅ Restrict SSL issuance
│  SPF/DKIM/DMARC                │  ✅ Email authentication
└────────────────────────────────┘
```

---

## 📊 Monitoring Setup

```
DAILY (First Week)
├── Check HTTPS accessible
├── Verify redirects working
├── Monitor error logs
└── Test from multiple browsers

WEEKLY
├── Check certificate status
├── Review renewal process
├── Test alerts
└── Monitor logs

MONTHLY
├── Full security audit
├── SSL Labs test (ssllabs.com)
├── Check certificate expiry
└── Verify auto-renewal

QUARTERLY
├── Domain renewal check
├── Certificate audit
├── Security incident review
└── Runbook update
```

---

## 🛠️ Command Reference

### Certificate Management
```bash
# Check certificate details
openssl s_client -connect fafaaccess.com:443

# Check expiry date
echo | openssl s_client -connect fafaaccess.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Renew certificate (Let's Encrypt)
certbot renew --force-renewal

# List certificates
certbot certificates

# Monitor expiry
./scripts/check-ssl-expiry.sh fafaaccess.com 30
```

### DNS Verification
```bash
# Check A record
nslookup fafaaccess.com

# Check MX records
nslookup -type=MX fafaaccess.com

# Check SPF
nslookup -type=TXT fafaaccess.com

# Check CAA
nslookup -type=CAA fafaaccess.com

# Full DNS info
dig fafaaccess.com
```

### HTTPS Testing
```bash
# Test HTTPS
curl -I https://fafaaccess.com
curl -v https://fafaaccess.com

# Test redirect
curl -I http://fafaaccess.com
curl -L http://fafaaccess.com  # Follow redirects

# Test specific API endpoint
curl -I https://fafaaccess.com/api/health
```

### Nginx Management (if using)
```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/fafaaccess-access.log
sudo tail -f /var/log/nginx/fafaaccess-error.log
```

---

## ✅ Pre-Launch Checklist

```
DOMAIN & REGISTRATION
☐ Domain registered
☐ Nameservers configured
☐ Domain propagation verified

DNS
☐ A records configured
☐ MX records configured
☐ CAA records configured
☐ SPF record added
☐ DMARC record added
☐ DNS propagation verified

SSL CERTIFICATE
☐ Certificate obtained
☐ Certificate covers all domains
☐ Certificate validity verified
☐ Private key secured

EXPRESS SERVER
☐ HTTPS middleware added
☐ Redirect middleware added
☐ Security headers configured
☐ CORS whitelist updated

HTTPS ENFORCEMENT
☐ HTTP → HTTPS redirects working
☐ Canonical domain configured
☐ Mixed content resolved
☐ API endpoints use HTTPS

AUTO-RENEWAL
☐ Auto-renewal configured
☐ Renewal process tested
☐ Email alerts configured
☐ Monitoring script deployed

TESTING
☐ HTTPS accessible
☐ No certificate warnings
☐ Redirects working
☐ API responding
☐ Performance acceptable

MONITORING
☐ Certificate expiry alerts set up
☐ Logs monitored
☐ Uptime monitoring configured
☐ Team trained on renewal
```

---

## 📈 Cost Summary

```
Initial Cost:
• Domain: $8-15 (one-time yearly)
• SSL Certificate: FREE (Let's Encrypt or Cloudflare)
• DNS Hosting: FREE (Cloudflare free tier)
TOTAL: $8-15/year

Optional Add-ons:
• Cloudflare Pro: $20/mo (enhanced DDoS/WAF)
• Monitoring Service: $20-50/mo
• SSL Monitoring: $0-20/mo

Recommended (Minimal):
• Domain: $8-15/year
• SSL: FREE
• DNS: FREE
TOTAL: $8-15/year (minimal)
```

---

## 🚨 Troubleshooting Flowchart

```
PROBLEM: "Certificate not trusted"
├─ Check expiry: openssl x509 -noout -dates -in cert.pem
├─ Check domain match: openssl x509 -noout -subject
└─ Solution: Renew or re-issue certificate

PROBLEM: "ERR_TOO_MANY_REDIRECTS"
├─ Check X-Forwarded-Proto handling
├─ Verify Cloudflare SSL mode
└─ Solution: Fix redirect logic in middleware

PROBLEM: "MIXED CONTENT" warning
├─ Check external API endpoints (use HTTPS)
├─ Check CDN URLs (use HTTPS)
└─ Solution: Update all resource URLs to HTTPS

PROBLEM: "DNS not resolving"
├─ Check nameserver configuration
├─ Wait for propagation (24-48h)
├─ Test with different resolver
└─ Solution: Run: dig fafaaccess.com

PROBLEM: "Certificate expired"
├─ Check expiry: certbot certificates
├─ Renew: certbot renew --force-renewal
└─ Solution: Check auto-renewal is set up
```

---

## 📚 Documentation Index

| Document | Pages | Purpose |
|----------|-------|---------|
| DOMAIN_AND_SSL_SETUP.md | 35KB | Complete guide, 10 sections |
| DOMAIN_AND_SSL_CHECKLIST.md | 8KB | Implementation checklist |
| DNS_RECORDS_CONFIG.txt | 6KB | DNS reference |
| DOMAIN_SSL_IMPLEMENTATION_SUMMARY.md | 10KB | Overview |
| **This document** | 1 page | Quick reference |

---

## 🎯 Next Steps

1. **Immediate (Today)**
   - [ ] Choose SSL provider (Cloudflare recommended)
   - [ ] Read DOMAIN_AND_SSL_SETUP.md section 1-2
   - [ ] Register domain

2. **Short-term (This week)**
   - [ ] Configure DNS records
   - [ ] Obtain SSL certificate
   - [ ] Update Express server
   - [ ] Test HTTPS

3. **Medium-term (This month)**
   - [ ] Deploy to staging
   - [ ] Run full security audit
   - [ ] Monitor auto-renewal
   - [ ] Train team

4. **Long-term (Ongoing)**
   - [ ] Monthly certificate checks
   - [ ] Quarterly security audits
   - [ ] Annual domain renewal
   - [ ] Monitoring refinement

---

## 💡 Pro Tips

✅ **Use Cloudflare** - Simplest, includes DDoS protection  
✅ **Enable HSTS** - Force browsers to use HTTPS  
✅ **Add CAA records** - Control certificate issuance  
✅ **Monitor expiry** - Set alerts for 30 days before  
✅ **Test redirects** - Use curl to verify chains  
✅ **Use SSL Labs** - Free security rating (ssllabs.com)  
✅ **Keep backups** - Backup certificate files  
✅ **Document process** - Make renewal runbook  

❌ **Don't use HTTP** in production  
❌ **Don't ignore warnings** - Act on alerts  
❌ **Don't use self-signed** in production  
❌ **Don't hardcode certs** - Use environment variables  
❌ **Don't skip monitoring** - Automate checks  
❌ **Don't forget renewal** - Test regularly  

---

## 🤝 Getting Help

**Documentation:**
1. Read: DOMAIN_AND_SSL_SETUP.md
2. Check: DOMAIN_AND_SSL_CHECKLIST.md
3. Reference: DNS_RECORDS_CONFIG.txt

**Tools:**
- SSL Labs: https://www.ssllabs.com/
- Observatory: https://observatory.mozilla.org/
- MXToolbox: https://mxtoolbox.com/
- What's My DNS: https://www.whatsmydns.net/

**Commands:**
```bash
# Full diagnostic
./scripts/check-ssl-expiry.sh check fafaaccess.com 30
./scripts/check-ssl-expiry.sh details fafaaccess.com

# Run setup wizard (Windows)
powershell scripts/setup-ssl.ps1
```

---

## 📞 Support Contacts

**Cloudflare Support:** https://support.cloudflare.com/  
**Let's Encrypt Community:** https://community.letsencrypt.org/  
**Mozilla Observatory:** https://observatory.mozilla.org/  
**OWASP Guide:** https://owasp.org/www-project-secure-headers/

---

**Last Updated:** January 2026  
**Status:** ✅ Production Ready  
**Version:** 1.0 Complete  
**Maintenance:** Quarterly review recommended

---

## Quick Links

- [📖 Setup Guide](./DOMAIN_AND_SSL_SETUP.md)
- [✅ Checklist](./DOMAIN_AND_SSL_CHECKLIST.md)  
- [📝 DNS Config](./DNS_RECORDS_CONFIG.txt)
- [🔧 Implementation](./DOMAIN_SSL_IMPLEMENTATION_SUMMARY.md)
- [🚀 Middleware](./src/middleware/httpsRedirect.js)
- [⚙️ Nginx Config](./scripts/nginx-fafaaccess.conf)

