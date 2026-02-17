import { verifyAccessToken } from '../services/authService.js';
import { logAuthFailure, logger } from '../observability.js';

// Authentication middleware - verifies JWT token
export function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Authorization token required',
        message: 'No authentication token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      logAuthFailure({ reason: 'invalid_token', path: req.path });
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token',
        message: 'Your session has expired. Please log in again.'
      });
    }
    
    // Check account status
    if (decoded.status !== 'ACTIVE') {
      logAuthFailure({ 
        userId: decoded.userId, 
        reason: 'inactive_account', 
        status: decoded.status,
        path: req.path 
      });
      return res.status(403).json({ 
        success: false,
        error: 'Account is not active',
        message: `Your account status is ${decoded.status}. Please contact support.`,
        accountStatus: decoded.status
      });
    }
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error({ err: error, path: req.path }, 'Authentication error');
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Role-based authorization middleware
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logAuthFailure({
        userId: req.user.userId,
        reason: 'insufficient_permissions',
        required: allowedRoles,
        actual: req.user.role,
        path: req.path,
      });
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      
      if (decoded && decoded.status === 'ACTIVE') {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
