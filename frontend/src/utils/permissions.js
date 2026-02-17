/**
 * Permission Utilities
 * 
 * Centralized permission checking for UI rendering
 * IMPORTANT: These are for UI/UX only. Backend always validates.
 */

/**
 * Application status that allows editing
 */
const EDITABLE_STATUSES = ['PENDING_SRC'];

/**
 * Application status that allows withdrawal
 */
const WITHDRAWABLE_STATUSES = ['PENDING_SRC', 'SRC_APPROVED'];

/**
 * Check if user can edit an application
 * 
 * @param {Object} application - Application object
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can edit
 */
export function canEditApplication(application, user) {
  if (!application || !user) return false;
  
  // Students can only edit their own PENDING_SRC applications
  if (user.role === 'STUDENT') {
    return (
      application.studentId === user.id &&
      EDITABLE_STATUSES.includes(application.status)
    );
  }
  
  return false;
}

/**
 * Check if user can withdraw an application
 * 
 * @param {Object} application - Application object
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can withdraw
 */
export function canWithdrawApplication(application, user) {
  if (!application || !user) return false;
  
  // Students can withdraw their own applications before admin approval
  if (user.role === 'STUDENT') {
    return (
      application.studentId === user.id &&
      WITHDRAWABLE_STATUSES.includes(application.status)
    );
  }
  
  return false;
}

/**
 * Check if user can approve/reject application at SRC level
 * 
 * @param {Object} application - Application object
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can make SRC decision
 */
export function canMakeSRCDecision(application, user) {
  if (!application || !user) return false;
  
  // Only SRC can make SRC decisions on PENDING_SRC applications
  if (user.role === 'SRC') {
    return application.status === 'PENDING_SRC';
  }
  
  return false;
}

/**
 * Check if user can approve/reject application at Admin level
 * 
 * @param {Object} application - Application object
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can make admin decision
 */
export function canMakeAdminDecision(application, user) {
  if (!application || !user) return false;
  
  // Only ADMIN can make admin decisions on SRC_APPROVED applications
  if (user.role === 'ADMIN') {
    return application.status === 'SRC_APPROVED';
  }
  
  return false;
}

/**
 * Check if user can assign delivery
 * 
 * @param {Object} application - Application object
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can assign delivery
 */
export function canAssignDelivery(application, user) {
  if (!application || !user) return false;
  
  // Only ADMIN can assign delivery for ADMIN_APPROVED applications
  if (user.role === 'ADMIN') {
    return application.status === 'ADMIN_APPROVED';
  }
  
  return false;
}

/**
 * Check if user can confirm payment
 * 
 * @param {Object} application - Application object
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can confirm payment
 */
export function canConfirmPayment(application, user) {
  if (!application || !user) return false;
  
  // ADMIN and DELIVERY can confirm payments
  if (user.role === 'ADMIN' || user.role === 'DELIVERY') {
    return (
      application.status === 'ADMIN_APPROVED' ||
      application.status === 'PAYMENT_PENDING'
    );
  }
  
  return false;
}

/**
 * Check if user can mark as delivered
 * 
 * @param {Object} application - Application object
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can mark as delivered
 */
export function canMarkDelivered(application, user) {
  if (!application || !user) return false;
  
  // DELIVERY can mark paid applications as delivered
  if (user.role === 'DELIVERY') {
    return application.status === 'PAID';
  }
  
  return false;
}

/**
 * Check if user can view application details
 * 
 * @param {Object} application - Application object
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can view
 */
export function canViewApplication(application, user) {
  if (!application || !user) return false;
  
  // Students can view their own applications
  if (user.role === 'STUDENT') {
    return application.studentId === user.id;
  }
  
  // SRC can view applications from their university
  if (user.role === 'SRC') {
    // Backend validates university access
    return true; // Rely on backend filtering
  }
  
  // ADMIN and DELIVERY can view all applications
  if (user.role === 'ADMIN' || user.role === 'DELIVERY') {
    return true;
  }
  
  return false;
}

/**
 * Check if user can access admin features
 * 
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user has admin access
 */
export function isAdmin(user) {
  return user?.role === 'ADMIN';
}

/**
 * Check if user can access SRC features
 * 
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user has SRC access
 */
export function isSRC(user) {
  return user?.role === 'SRC';
}

/**
 * Check if user can access student features
 * 
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user has student access
 */
export function isStudent(user) {
  return user?.role === 'STUDENT';
}

/**
 * Check if user can access delivery features
 * 
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user has delivery access
 */
export function isDelivery(user) {
  return user?.role === 'DELIVERY';
}

/**
 * Get user's home path based on role
 * 
 * @param {Object} user - Current user object
 * @returns {string} - Home path
 */
export function getUserHomePath(user) {
  if (!user) return '/login';
  
  const roleHomePaths = {
    STUDENT: '/dashboard',
    SRC: '/src/dashboard',
    ADMIN: '/admin',
    DELIVERY: '/delivery/queue'
  };
  
  return roleHomePaths[user.role] || '/';
}

/**
 * Check if action requires specific role
 * 
 * @param {string} action - Action name
 * @param {Object} user - Current user object
 * @returns {boolean} - True if user can perform action
 */
export function canPerformAction(action, user) {
  if (!user) return false;
  
  const actionPermissions = {
    'view_all_applications': ['ADMIN', 'SRC'],
    'manage_laptops': ['ADMIN'],
    'assign_delivery': ['ADMIN'],
    'confirm_payment': ['ADMIN', 'DELIVERY'],
    'mark_delivered': ['DELIVERY'],
    'approve_src': ['SRC'],
    'approve_admin': ['ADMIN'],
    'submit_application': ['STUDENT'],
    'view_own_application': ['STUDENT', 'SRC', 'ADMIN', 'DELIVERY']
  };
  
  const allowedRoles = actionPermissions[action];
  return allowedRoles ? allowedRoles.includes(user.role) : false;
}

export default {
  canEditApplication,
  canWithdrawApplication,
  canMakeSRCDecision,
  canMakeAdminDecision,
  canAssignDelivery,
  canConfirmPayment,
  canMarkDelivered,
  canViewApplication,
  isAdmin,
  isSRC,
  isStudent,
  isDelivery,
  getUserHomePath,
  canPerformAction,
  EDITABLE_STATUSES,
  WITHDRAWABLE_STATUSES
};
