// Stock utility functions
// Business logic for determining stock status

/**
 * Stock status constants
 */
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock'
}

/**
 * Low stock threshold
 */
const LOW_STOCK_THRESHOLD = 3

/**
 * Determines the stock status based on quantity
 * @param {number} stockQuantity - Current stock quantity
 * @returns {string} Stock status (in_stock, low_stock, or out_of_stock)
 */
export const getStockStatus = (stockQuantity) => {
  if (stockQuantity === 0) {
    return STOCK_STATUS.OUT_OF_STOCK
  }
  
  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return STOCK_STATUS.LOW_STOCK
  }
  
  return STOCK_STATUS.IN_STOCK
}

/**
 * Checks if a laptop is available for application
 * @param {number} stockQuantity - Current stock quantity
 * @returns {boolean} True if available, false otherwise
 */
export const isAvailable = (stockQuantity) => {
  return stockQuantity > 0
}

/**
 * Checks if a laptop is available for application (active + stock)
 * @param {Object} laptop - Laptop object
 * @returns {boolean} True if active and in stock
 */
export const isLaptopAvailable = (laptop) => {
  if (!laptop) return false
  return Boolean(laptop.isActive) && isAvailable(laptop.stockQuantity)
}

/**
 * Gets the display label for stock status
 * @param {string} status - Stock status
 * @returns {string} Display label
 */
export const getStockLabel = (status) => {
  const labels = {
    [STOCK_STATUS.IN_STOCK]: 'In Stock',
    [STOCK_STATUS.LOW_STOCK]: 'Low Stock',
    [STOCK_STATUS.OUT_OF_STOCK]: 'Out of Stock'
  }
  
  return labels[status] || 'Unknown'
}
