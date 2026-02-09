/**
 * Payment Helper Utilities
 * Helper functions for payment-related operations and formatting
 */

/**
 * Calculate 30% installment amount
 * @param {number} totalPrice - Total laptop price
 * @returns {number} 30% of total price, rounded to 2 decimals
 */
export const calculateInstallmentAmount = (totalPrice) => {
  if (!totalPrice || totalPrice <= 0) return 0;
  return Math.round(totalPrice * 0.30 * 100) / 100;
};

/**
 * Format currency as GHS
 * @param {number} amount - Amount in GHS
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return `GHS ${Number(amount).toFixed(2)}`;
};

/**
 * Format payment status for display
 * @param {string} status - Payment status from database
 * @returns {object} status display with icon and description
 */
export const getStatusDisplay = (status) => {
  const statusMap = {
    PENDING: {
      icon: '⏳',
      label: 'Pending',
      color: 'warning',
      description: 'Awaiting payment confirmation',
    },
    COMPLETED: {
      icon: '✅',
      label: 'Completed',
      color: 'success',
      description: 'Payment confirmed',
    },
    FAILED: {
      icon: '❌',
      label: 'Failed',
      color: 'danger',
      description: 'Payment was not successful',
    },
    CANCELLED: {
      icon: '🚫',
      label: 'Cancelled',
      color: 'secondary',
      description: 'Payment was cancelled',
    },
  };

  return statusMap[status] || {
    icon: '❓',
    label: status,
    color: 'dark',
    description: 'Unknown status',
  };
};

/**
 * Check if payment is eligible to be initiated
 * @param {object} application - Application object
 * @returns {object} {eligible: boolean, reason?: string}
 */
export const checkPaymentEligibility = (application) => {
  if (!application) {
    return { eligible: false, reason: 'Application not found' };
  }

  if (application.status !== 'APPROVED') {
    return {
      eligible: false,
      reason: `Application must be APPROVED. Current status: ${application.status}`,
    };
  }

  return { eligible: true };
};

/**
 * Generate payment success URL with reference
 * @param {string} reference - Payment reference
 * @param {string} accessCode - Paystack access code
 * @returns {string} Success URL
 */
export const getPaymentSuccessUrl = (reference, accessCode = null) => {
  const params = new URLSearchParams({ reference });
  if (accessCode) params.append('access_code', accessCode);
  return `/payment/success?${params.toString()}`;
};

/**
 * Generate payment failed URL
 * @returns {string} Failed URL
 */
export const getPaymentFailedUrl = () => {
  return '/payment/failed';
};

/**
 * Parse payment error response
 * @param {object} error - Error object from API
 * @returns {object} Parsed error with user-friendly message
 */
export const parsePaymentError = (error) => {
  if (!error) {
    return {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      displayMessage: 'Payment failed. Please try again.',
    };
  }

  const errorMap = {
    APPLICATION_NOT_FOUND: {
      message: 'The application could not be found',
      displayMessage: 'Application not found. Please refresh and try again.',
    },
    APPLICATION_NOT_APPROVED: {
      message: 'The application has not been approved yet',
      displayMessage: 'Your application must be approved before you can pay. Please wait for approval.',
    },
    OWNERSHIP_MISMATCH: {
      message: 'You are not authorized to pay for this application',
      displayMessage: 'You can only pay for your own applications.',
    },
    DUPLICATE_PAYMENT: {
      message: 'A payment for this application has already been completed',
      displayMessage: 'You have already completed payment for this application.',
    },
    NETWORK_ERROR: {
      message: 'Could not reach payment server',
      displayMessage: 'Network error. Please check your connection and try again.',
    },
    PAYMENT_CANCELLED: {
      message: 'Payment was cancelled or not completed',
      displayMessage: 'Your payment was not completed. Please try again.',
    },
  };

  const mapped = errorMap[error.code];
  return {
    message: error.message || mapped?.message || 'Payment error',
    code: error.code || 'UNKNOWN_ERROR',
    displayMessage: mapped?.displayMessage || error.message || 'Payment failed',
    originalError: error,
  };
};

/**
 * Check if payment reference is valid format
 * @param {string} reference - Payment reference to validate
 * @returns {boolean} True if valid format
 */
export const isValidPaymentReference = (reference) => {
  // Format: INST/INIT-APP123456-123456789-ABCD1234
  const pattern = /^INST\/INIT-[A-Z0-9]+-\d+-[A-F0-9]+$/i;
  return pattern.test(reference);
};

/**
 * Get payment context for UI display
 * @param {string} status - Application status
 * @returns {object} Context with display info
 */
export const getApplicationPaymentContext = (status) => {
  const contexts = {
    PENDING: {
      canPay: false,
      message: 'Your application is under review. Payment will be available once approved.',
      icon: '⏳',
      color: 'info',
    },
    APPROVED: {
      canPay: true,
      message: 'Your application has been approved. Click below to pay your 30% installment.',
      icon: '✅',
      color: 'success',
    },
    REJECTED: {
      canPay: false,
      message: 'Unfortunately, your application was not approved at this time.',
      icon: '❌',
      color: 'danger',
    },
    SCHEDULED_FOR_DELIVERY: {
      canPay: false,
      message: 'Payment received. Your laptop delivery is being scheduled.',
      icon: '📦',
      color: 'info',
    },
    DELIVERED: {
      canPay: false,
      message: 'Your laptop has been delivered. Thank you for completing the application process.',
      icon: '🎉',
      color: 'success',
    },
  };

  return contexts[status] || {
    canPay: false,
    message: `Application status: ${status}`,
    icon: '❓',
    color: 'secondary',
  };
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format datetime for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted datetime
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
};

/**
 * Generate payment summary for email/receipt
 * @param {object} paymentData - Payment data object
 * @returns {string} Formatted payment summary
 */
export const generatePaymentSummary = (paymentData) => {
  if (!paymentData) return '';

  return `
Amount: ${formatCurrency(paymentData.amount)}
Reference: ${paymentData.reference}
Status: ${paymentData.status}
Date: ${formatDateTime(paymentData.completedAt || paymentData.initiatedAt)}
  `.trim();
};

export default {
  calculateInstallmentAmount,
  formatCurrency,
  getStatusDisplay,
  checkPaymentEligibility,
  getPaymentSuccessUrl,
  getPaymentFailedUrl,
  parsePaymentError,
  isValidPaymentReference,
  getApplicationPaymentContext,
  formatDate,
  formatDateTime,
  generatePaymentSummary,
};
