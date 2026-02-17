/**
 * Laptop Validation Service
 * 
 * Comprehensive validation for laptop product management
 * Enforces:
 * - Prices in GHS (Ghana Cedis)
 * - Stock >= 0
 * - Active status required for student visibility
 * - Serial number uniqueness
 * - Spec requirements
 */

const CONSTANTS = {
  CURRENCY: 'GHS', // Ghana Cedis
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
  MIN_STOCK: 0,
  MAX_STOCK: 10000,
  MIN_BRAND_LENGTH: 2,
  MAX_BRAND_LENGTH: 100,
  MIN_MODEL_LENGTH: 1,
  MAX_MODEL_LENGTH: 100,
};

/**
 * Validate laptop creation request
 * 
 * @param {Object} data - Laptop data
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateLaptopCreation(data) {
  const errors = [];

  // Required fields
  if (!data.brand || typeof data.brand !== 'string') {
    errors.push('Brand is required and must be a string');
  } else if (data.brand.length < CONSTANTS.MIN_BRAND_LENGTH || data.brand.length > CONSTANTS.MAX_BRAND_LENGTH) {
    errors.push(`Brand must be between ${CONSTANTS.MIN_BRAND_LENGTH} and ${CONSTANTS.MAX_BRAND_LENGTH} characters`);
  }

  if (!data.model || typeof data.model !== 'string') {
    errors.push('Model is required and must be a string');
  } else if (data.model.length < CONSTANTS.MIN_MODEL_LENGTH || data.model.length > CONSTANTS.MAX_MODEL_LENGTH) {
    errors.push(`Model must be between ${CONSTANTS.MIN_MODEL_LENGTH} and ${CONSTANTS.MAX_MODEL_LENGTH} characters`);
  }

  if (!data.serialNumber || typeof data.serialNumber !== 'string') {
    errors.push('Serial number is required and must be a string');
  } else if (data.serialNumber.trim().length === 0) {
    errors.push('Serial number cannot be empty');
  }

  // Pricing validation
  if (data.originalPrice === undefined || data.originalPrice === null) {
    errors.push('Original price is required');
  } else if (typeof data.originalPrice !== 'number') {
    errors.push('Original price must be a number (GHS)');
  } else if (data.originalPrice < CONSTANTS.MIN_PRICE || data.originalPrice > CONSTANTS.MAX_PRICE) {
    errors.push(`Original price must be between ${CONSTANTS.MIN_PRICE} and ${CONSTANTS.MAX_PRICE} GHS`);
  }

  if (data.discountedPrice === undefined || data.discountedPrice === null) {
    errors.push('Discounted price is required');
  } else if (typeof data.discountedPrice !== 'number') {
    errors.push('Discounted price must be a number (GHS)');
  } else if (data.discountedPrice < CONSTANTS.MIN_PRICE || data.discountedPrice > CONSTANTS.MAX_PRICE) {
    errors.push(`Discounted price must be between ${CONSTANTS.MIN_PRICE} and ${CONSTANTS.MAX_PRICE} GHS`);
  }

  // Price relationship validation
  if (data.originalPrice !== undefined && data.discountedPrice !== undefined) {
    if (data.discountedPrice > data.originalPrice) {
      errors.push('Discounted price cannot exceed original price');
    }
    
    // Warn if discount is too large (>90%)
    const discountPercent = ((data.originalPrice - data.discountedPrice) / data.originalPrice) * 100;
    if (discountPercent > 90) {
      errors.push('Discount appears unusually high (>90%). Please verify pricing.');
    }
  }

  // Stock validation
  if (data.stockQuantity !== undefined && data.stockQuantity !== null) {
    if (!Number.isInteger(data.stockQuantity)) {
      errors.push('Stock quantity must be an integer');
    } else if (data.stockQuantity < CONSTANTS.MIN_STOCK || data.stockQuantity > CONSTANTS.MAX_STOCK) {
      errors.push(`Stock quantity must be between ${CONSTANTS.MIN_STOCK} and ${CONSTANTS.MAX_STOCK}`);
    }
  }

  // Optional specs validation
  if (data.processor && typeof data.processor !== 'string') {
    errors.push('Processor must be a string');
  }

  if (data.ram && typeof data.ram !== 'string') {
    errors.push('RAM must be a string');
  }

  if (data.storage && typeof data.storage !== 'string') {
    errors.push('Storage must be a string');
  }

  if (data.screen && typeof data.screen !== 'string') {
    errors.push('Screen size must be a string');
  }

  if (data.imageUrl && typeof data.imageUrl !== 'string') {
    errors.push('Image URL must be a string');
  } else if (data.imageUrl && !isValidImageUrl(data.imageUrl)) {
    errors.push('Image URL does not appear to be valid');
  }
  
    if (data.universityId !== undefined && data.universityId !== null && typeof data.universityId !== 'string') {
      errors.push('University ID must be a string');
    }
  
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate laptop update request
 * 
 * @param {Object} data - Laptop data to update
 * @param {Object} existingLaptop - Current laptop data
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateLaptopUpdate(data, existingLaptop) {
  const errors = [];

  // Only validate fields that are being updated
  if (data.brand !== undefined) {
    if (typeof data.brand !== 'string') {
      errors.push('Brand must be a string');
    } else if (data.brand.length < CONSTANTS.MIN_BRAND_LENGTH || data.brand.length > CONSTANTS.MAX_BRAND_LENGTH) {
      errors.push(`Brand must be between ${CONSTANTS.MIN_BRAND_LENGTH} and ${CONSTANTS.MAX_BRAND_LENGTH} characters`);
    }
  }

  if (data.model !== undefined) {
    if (typeof data.model !== 'string') {
      errors.push('Model must be a string');
    } else if (data.model.length < CONSTANTS.MIN_MODEL_LENGTH || data.model.length > CONSTANTS.MAX_MODEL_LENGTH) {
      errors.push(`Model must be between ${CONSTANTS.MIN_MODEL_LENGTH} and ${CONSTANTS.MAX_MODEL_LENGTH} characters`);
    }
  }

  if (data.serialNumber !== undefined) {
    if (typeof data.serialNumber !== 'string') {
      errors.push('Serial number must be a string');
    } else if (data.serialNumber.trim().length === 0) {
      errors.push('Serial number cannot be empty');
    }
  }

  // Pricing validation for updates
  const originalPrice = data.originalPrice !== undefined ? data.originalPrice : existingLaptop.originalPrice;
  const discountedPrice = data.discountedPrice !== undefined ? data.discountedPrice : existingLaptop.discountedPrice;

  if (data.originalPrice !== undefined) {
    if (typeof data.originalPrice !== 'number') {
      errors.push('Original price must be a number (GHS)');
    } else if (data.originalPrice < CONSTANTS.MIN_PRICE || data.originalPrice > CONSTANTS.MAX_PRICE) {
      errors.push(`Original price must be between ${CONSTANTS.MIN_PRICE} and ${CONSTANTS.MAX_PRICE} GHS`);
    }
  }

  if (data.discountedPrice !== undefined) {
    if (typeof data.discountedPrice !== 'number') {
      errors.push('Discounted price must be a number (GHS)');
    } else if (data.discountedPrice < CONSTANTS.MIN_PRICE || data.discountedPrice > CONSTANTS.MAX_PRICE) {
      errors.push(`Discounted price must be between ${CONSTANTS.MIN_PRICE} and ${CONSTANTS.MAX_PRICE} GHS`);
    }
  }

  if (discountedPrice > originalPrice) {
    errors.push('Discounted price cannot exceed original price');
  }

  // Stock validation
  if (data.stockQuantity !== undefined) {
    if (!Number.isInteger(data.stockQuantity)) {
      errors.push('Stock quantity must be an integer');
    } else if (data.stockQuantity < CONSTANTS.MIN_STOCK || data.stockQuantity > CONSTANTS.MAX_STOCK) {
      errors.push(`Stock quantity must be between ${CONSTANTS.MIN_STOCK} and ${CONSTANTS.MAX_STOCK}`);
    }
  }

  // Optional specs
  if (data.processor !== undefined && data.processor && typeof data.processor !== 'string') {
    errors.push('Processor must be a string');
  }

  if (data.ram !== undefined && data.ram && typeof data.ram !== 'string') {
    errors.push('RAM must be a string');
  }

  if (data.storage !== undefined && data.storage && typeof data.storage !== 'string') {
    errors.push('Storage must be a string');
  }

  if (data.screen !== undefined && data.screen && typeof data.screen !== 'string') {
    errors.push('Screen size must be a string');
  }

  if (data.imageUrl !== undefined && data.imageUrl && typeof data.imageUrl !== 'string') {
    errors.push('Image URL must be a string');
  } else if (data.imageUrl && !isValidImageUrl(data.imageUrl)) {
    errors.push('Image URL does not appear to be valid');
  }

  if (data.universityId !== undefined && data.universityId !== null && typeof data.universityId !== 'string') {
    errors.push('University ID must be a string');
  }

  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.push('isActive must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate stock adjustment
 * 
 * @param {number} currentStock - Current stock quantity
 * @param {number} adjustment - Adjustment amount (can be negative)
 * @returns {Object} - { valid: boolean, error?: string, newStock?: number }
 */
export function validateStockAdjustment(currentStock, adjustment) {
  if (!Number.isInteger(adjustment)) {
    return {
      valid: false,
      error: 'Adjustment must be an integer'
    };
  }

  const newStock = currentStock + adjustment;

  if (newStock < CONSTANTS.MIN_STOCK) {
    return {
      valid: false,
      error: `Cannot adjust stock below ${CONSTANTS.MIN_STOCK}. Current: ${currentStock}, Adjustment: ${adjustment}, Result: ${newStock}`
    };
  }

  if (newStock > CONSTANTS.MAX_STOCK) {
    return {
      valid: false,
      error: `Cannot adjust stock above ${CONSTANTS.MAX_STOCK}. Current: ${currentStock}, Adjustment: ${adjustment}, Result: ${newStock}`
    };
  }

  return {
    valid: true,
    newStock
  };
}

/**
 * Check if laptop is available for purchase
 * Must be: active AND has stock
 * 
 * @param {Object} laptop - Laptop object
 * @returns {Object} - { available: boolean, reason?: string }
 */
export function isLaptopAvailable(laptop) {
  if (!laptop) {
    return { available: false, reason: 'Laptop not found' };
  }

  if (!laptop.isActive) {
    return { available: false, reason: 'Laptop is no longer available' };
  }

  if ((laptop.stockQuantity || 0) <= 0) {
    return { available: false, reason: 'Out of stock' };
  }

  return { available: true };
}

/**
 * Validate image URL format
 * 
 * @param {string} url - Image URL
 * @returns {boolean} - True if valid URL
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // Allow data URLs for uploaded previews
  if (url.startsWith('data:image/')) {
    return /^data:image\/(png|jpe?g|gif|webp);base64,/.test(url);
  }

  try {
    const urlObj = new URL(url);
    // Ensure it's http or https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    // Ensure common image extensions
    const path = urlObj.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return validExtensions.some(ext => path.endsWith(ext));
  } catch (e) {
    return false;
  }
}

/**
 * Get human-readable laptop description
 * 
 * @param {Object} laptop - Laptop object
 * @returns {string} - Description like "Dell XPS 13"
 */
export function getLaptopDescription(laptop) {
  if (!laptop) return 'Unknown Laptop';
  
  const parts = [laptop.brand, laptop.model];
  
  if (laptop.processor) {
    parts.push(`(${laptop.processor})`);
  }
  
  return parts.filter(Boolean).join(' ');
}

/**
 * Format price in GHS
 * 
 * @param {number} price - Price in GHS
 * @returns {string} - Formatted price like "GHS 1,234.50"
 */
export function formatPrice(price) {
  if (typeof price !== 'number') return 'Invalid Price';
  return `GHS ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Calculate discount percentage
 * 
 * @param {number} originalPrice - Original price
 * @param {number} discountedPrice - Discounted price
 * @returns {number} - Discount percentage (0-100)
 */
export function calculateDiscountPercent(originalPrice, discountedPrice) {
  if (!originalPrice || originalPrice <= 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

export default {
  validateLaptopCreation,
  validateLaptopUpdate,
  validateStockAdjustment,
  isLaptopAvailable,
  getLaptopDescription,
  formatPrice,
  calculateDiscountPercent,
  CONSTANTS
};
