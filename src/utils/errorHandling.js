/**
 * Error Handling Utilities
 * 
 * Centralized error handling for consistent behavior across frontend
 */

/**
 * Check if error is authorization-related (401/403)
 * These errors are handled by AuthContext with automatic redirect
 * 
 * @param {Error} error - Error object
 * @returns {boolean} - True if auth-related error
 */
export function isAuthError(error) {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('session expired') ||
    message.includes('unauthorized') ||
    message.includes('permission') ||
    message.includes('forbidden') ||
    message.includes('401') ||
    message.includes('403')
  );
}

/**
 * Extract user-friendly error message from API error
 * 
 * @param {Error} error - Error object
 * @param {string} fallback - Fallback message
 * @returns {string} - User-friendly error message
 */
export function getErrorMessage(error, fallback = 'An error occurred') {
  if (!error) return fallback;
  
  // If it's an auth error, don't show it (AuthContext handles it)
  if (isAuthError(error)) {
    return null;
  }
  
  // Extract message from various error formats
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  if (error.error) {
    return typeof error.error === 'string' ? error.error : error.error.message;
  }
  
  return fallback;
}

/**
 * Check if user should see this error
 * Auth errors are handled by AuthContext, so we don't show them
 * 
 * @param {Error} error - Error object
 * @returns {boolean} - True if error should be displayed to user
 */
export function shouldDisplayError(error) {
  return !isAuthError(error);
}

/**
 * Enhanced error handler for async operations
 * Automatically filters auth errors and extracts user-friendly messages
 * 
 * @param {Error} error - Error object
 * @param {Function} setError - State setter for error message
 * @param {string} fallback - Fallback error message
 */
export function handleApiError(error, setError, fallback = 'An error occurred') {
  console.error('API Error:', error);
  
  const message = getErrorMessage(error, fallback);
  
  // Only set error if it's not auth-related (auth errors trigger redirect)
  if (message && shouldDisplayError(error)) {
    setError(message);
  }
}

/**
 * Parse backend validation errors
 * 
 * @param {Object} errorResponse - Error response from backend
 * @returns {string} - Formatted error message
 */
export function parseValidationErrors(errorResponse) {
  if (!errorResponse) return 'Validation failed';
  
  // Handle array of error messages
  if (Array.isArray(errorResponse.errors)) {
    return errorResponse.errors.join(', ');
  }
  
  // Handle single error message
  if (errorResponse.message) {
    return errorResponse.message;
  }
  
  if (errorResponse.error) {
    return errorResponse.error;
  }
  
  return 'Validation failed';
}

/**
 * Enhanced fetch wrapper with better error extraction
 * 
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} - Parsed JSON data
 * @throws {Error} - Error with user-friendly message
 */
export async function parseApiResponse(response) {
  // Try to parse JSON response
  let data;
  try {
    data = await response.json();
  } catch (e) {
    // If JSON parse fails, throw generic error
    throw new Error(response.statusText || 'Request failed');
  }
  
  // If response is OK, return data
  if (response.ok) {
    return data;
  }
  
  // Extract error message from response
  const errorMessage = 
    data.message || 
    data.error || 
    parseValidationErrors(data) ||
    response.statusText ||
    'Request failed';
  
  throw new Error(errorMessage);
}

export default {
  isAuthError,
  getErrorMessage,
  shouldDisplayError,
  handleApiError,
  parseValidationErrors,
  parseApiResponse
};
