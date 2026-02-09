/**
 * Admin Authorization Middleware
 * 
 * Ensures that only users with admin role can access protected routes.
 * Works in conjunction with JWT authentication middleware.
 * 
 * USAGE:
 * Apply this middleware AFTER authentication middleware:
 * router.get('/admin/payments', authenticate, requireAdmin, controller)
 * 
 * SECURITY:
 * - Checks user.role from JWT payload
 * - Returns 403 Forbidden if not admin
 * - Logs unauthorized access attempts
 * 
 * Created: February 8, 2024
 */

/**
 * Check if authenticated user has admin role
 * 
 * This middleware must be used AFTER authentication middleware
 * that sets req.user from JWT token.
 * 
 * @param {Object} req - Express request object (expects req.user to be set)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireAdmin(req, res, next) {
  try {
    // Check if user is authenticated (should be set by auth middleware)
    if (!req.user) {
      console.warn('Admin middleware called without authentication');
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required. Please log in.'
      });
    }

    // Check if user has admin role
    if (!req.user.role || req.user.role !== 'ADMIN') {
      // Log unauthorized access attempt
      console.warn(`Unauthorized admin access attempt by user ${req.user.id} (${req.user.email})`);
      
      return res.status(403).json({
        error: 'ADMIN_ACCESS_REQUIRED',
        message: 'This resource requires administrator privileges',
        code: 'FORBIDDEN'
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Error in admin authorization middleware:', error);
    res.status(500).json({
      error: 'AUTHORIZATION_ERROR',
      message: 'Failed to verify admin privileges'
    });
  }
}

/**
 * Check if user has admin OR staff role
 * 
 * More permissive than requireAdmin - allows staff members too
 * Useful for read-only admin endpoints
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireAdminOrStaff(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required. Please log in.'
      });
    }

    const allowedRoles = ['ADMIN', 'STAFF'];
    
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      console.warn(`Unauthorized staff access attempt by user ${req.user.id} (${req.user.email})`);
      
      return res.status(403).json({
        error: 'STAFF_ACCESS_REQUIRED',
        message: 'This resource requires administrator or staff privileges',
        code: 'FORBIDDEN'
      });
    }

    next();
  } catch (error) {
    console.error('Error in admin/staff authorization middleware:', error);
    res.status(500).json({
      error: 'AUTHORIZATION_ERROR',
      message: 'Failed to verify privileges'
    });
  }
}

/**
 * Attach admin info to request for logging/audit
 * 
 * Optional middleware to enhance admin action logging
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function attachAdminContext(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    req.adminContext = {
      adminId: req.user.id,
      adminEmail: req.user.email,
      adminName: req.user.name || `${req.user.first_name} ${req.user.last_name}`,
      timestamp: new Date().toISOString(),
      action: `${req.method} ${req.path}`
    };
  }
  next();
}

export { requireAdmin, requireAdminOrStaff, attachAdminContext };
