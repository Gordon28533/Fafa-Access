/**
 * Custom request type for audit context
 * Represents Express Request-like objects with audit-relevant properties
 */
interface AuditRequest {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
  user?: { id?: string; role?: string; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * Extract client IP address from request
 * Handles proxies, load balancers, and direct connections
 */
export function getClientIp(req: AuditRequest): string {
  // Check for various proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }

  // Check for Cloudflare Client IP
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    return typeof cfIp === 'string' ? cfIp : cfIp[0];
  }

  // Check for AWS ALB
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return typeof realIp === 'string' ? realIp : realIp[0];
  }

  // Fallback to socket connection
  return req.socket?.remoteAddress || req.ip || '0.0.0.0';
}

/**
 * Sanitize IP address (remove IPv6 wrapper)
 */
export function sanitizeIp(ip: string): string {
  // Remove IPv6 wrapper
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  return ip;
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: AuditRequest): string {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : (Array.isArray(ua) ? ua[0] : 'Unknown');
}

/**
 * Create audit context from Express request
 */
export function createAuditContext(req: AuditRequest) {
  return {
    userId: req.user?.id,
    userRole: req.user?.role || 'ANONYMOUS',
    ipAddress: sanitizeIp(getClientIp(req)),
    userAgent: getUserAgent(req),
  };
}
