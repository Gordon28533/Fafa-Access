/**
 * HTTPS Redirect Middleware
 * Enforces HTTPS in production
 * Handles X-Forwarded-Proto header for load balancers/CDN (Cloudflare, ALB, etc.)
 */

import process from 'process';

export const httpsRedirect = (req, res, next) => {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check for HTTPS
  // X-Forwarded-Proto is set by Cloudflare, load balancers, reverse proxies
  const proto = req.header('x-forwarded-proto') || req.protocol;

  if (proto !== 'https') {
    // Redirect HTTP to HTTPS with 301 (permanent redirect)
    const host = req.header('host');
    const originalUrl = req.originalUrl;
    
    console.log(`🔒 Redirecting HTTP → HTTPS: ${host}${originalUrl}`);
    
    return res.redirect(301, `https://${host}${originalUrl}`);
  }

  // Already HTTPS, continue
  next();
};

/**
 * Canonical Domain Redirect
 * Redirects www → non-www (or vice versa)
 * Prevents duplicate content for SEO
 */

export const canonicalDomain = (preferWWW = false) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    const host = req.header('host');
    const protocol = req.header('x-forwarded-proto') || req.protocol;
    const originalUrl = req.originalUrl;
    const canonicalDomain = process.env.DOMAIN || 'fafaaccess.com';
    const wwwDomain = `www.${canonicalDomain}`;

    let shouldRedirect = false;
    let newHost = host;

    if (preferWWW) {
      // Redirect non-www → www
      if (host === canonicalDomain) {
        newHost = wwwDomain;
        shouldRedirect = true;
      }
    } else {
      // Redirect www → non-www
      if (host === wwwDomain) {
        newHost = canonicalDomain;
        shouldRedirect = true;
      }
    }

    if (shouldRedirect) {
      console.log(`📍 Canonical redirect: ${host} → ${newHost}`);
      return res.redirect(301, `${protocol}://${newHost}${originalUrl}`);
    }

    next();
  };
};

/**
 * Legacy URL Redirects
 * Maps old routes to new routes
 */

export const legacyRedirects = [
  // Application routes
  {
    from: '/old-application',
    to: '/apply',
  },
  {
    from: '/application-status/:id',
    to: '/dashboard/applications/:id',
  },
  // Admin routes
  {
    from: '/admin-dashboard',
    to: '/admin/dashboard',
  },
  {
    from: '/admin/applications/:id',
    to: '/admin/dashboard/applications/:id',
  },
  // Student routes
  {
    from: '/student-dashboard',
    to: '/dashboard',
  },
  {
    from: '/my-applications',
    to: '/dashboard/applications',
  },
  // SRC routes
  {
    from: '/src-dashboard',
    to: '/src/dashboard',
  },
  {
    from: '/pending-approvals',
    to: '/src/dashboard?tab=pending',
  },
];

/**
 * Create legacy redirect middleware
 * @param {Array} redirects - Array of redirect rules
 * @returns {Function} Express middleware
 */

export const createLegacyRedirectMiddleware = (redirects = legacyRedirects) => {
  return (req, res, next) => {
    const path = req.path;

    for (const redirect of redirects) {
      // Simple string matching
      if (path === redirect.from) {
        console.log(`🔄 Legacy redirect: ${redirect.from} → ${redirect.to}`);
        return res.redirect(301, redirect.to);
      }

      // Dynamic parameter matching (e.g., /applications/:id → /dashboard/applications/:id)
      const fromPattern = redirect.from.replace(/:[^\s/]+/g, '([^/]+)');
      const paramNames = [...redirect.from.matchAll(/:([^\s/]+)/g)].map((match) => match[1]);
      const regex = new RegExp(`^${fromPattern}$`);
      const match = path.match(regex);

      if (match) {
        let newPath = redirect.to;

        // Replace placeholders with matched segment values (no reliance on req.params here)
        match.slice(1).forEach((value, index) => {
          const paramName = paramNames[index];
          newPath = newPath.replace(`:${paramName}`, value);
        });

        console.log(`🔄 Legacy redirect: ${path} → ${newPath}`);
        return res.redirect(301, newPath);
      }
    }

    next();
  };
};
