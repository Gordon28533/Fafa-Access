// apiResponse.js
// Standard API response helper

/**
 * Standard API response format
 * @param {Object} options
 * @param {boolean} options.success
 * @param {string} [options.message]
 * @param {Object|null} [options.data]
 * @param {Array|null} [options.errors]
 * @returns {Object}
 */
export function apiResponse({ success, message = '', data = null, errors = null }) {
  return {
    success,
    message,
    data,
    errors,
  };
}

// Usage in controllers:
// return res.json(apiResponse({ success: true, message: 'Created', data: { ... } }));
// return res.status(400).json(apiResponse({ success: false, message: 'Validation failed', errors: [...] }));
