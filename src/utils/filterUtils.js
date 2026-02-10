import { getStockStatus, STOCK_STATUS } from './stockUtils'

/**
 * Filter utility functions
 * All filtering and sorting logic lives here
 */

/**
 * Sort options constants
 */
export const SORT_OPTIONS = {
  PRICE_LOW_TO_HIGH: 'price_low_to_high',
  PRICE_HIGH_TO_LOW: 'price_high_to_low'
}

/**
 * Default filter state
 */
export const getDefaultFilters = () => ({
  brands: [],
  ramSizes: [],
  storageTypes: [],
  stockStatuses: []
})

/**
 * Filters laptops based on provided filter criteria
 * @param {Array} laptops - Array of laptop objects
 * @param {Object} filters - Filter object with brands, ramSizes, storageTypes, stockStatuses
 * @returns {Array} Filtered array of laptops
 */
export const filterLaptops = (laptops, filters) => {
  if (!laptops || laptops.length === 0) {
    return []
  }

  return laptops.filter((laptop) => {
    // Filter by brand
    if (filters.brands.length > 0 && !filters.brands.includes(laptop.brand)) {
      return false
    }

    // Filter by RAM size
    if (filters.ramSizes.length > 0) {
      if (!laptop.specs || !laptop.specs.ram) {
        return false
      }
      const laptopRam = laptop.specs.ram
      // Extract numeric value from RAM string (e.g., "16GB" -> 16)
      const ramMatch = laptopRam.match(/(\d+)/)
      const laptopRamValue = ramMatch ? ramMatch[1] : null
      
      if (!laptopRamValue || !filters.ramSizes.includes(laptopRamValue)) {
        return false
      }
    }

    // Filter by storage type
    if (filters.storageTypes.length > 0) {
      if (!laptop.specs || !laptop.specs.storage) {
        return false
      }
      const laptopStorage = laptop.specs.storage.toLowerCase()
      const matchesStorage = filters.storageTypes.some((storageFilter) => {
        // Check if storage type matches (SSD, HDD, etc.)
        return laptopStorage.includes(storageFilter.toLowerCase())
      })
      if (!matchesStorage) {
        return false
      }
    }

    // Filter by stock status
    if (filters.stockStatuses.length > 0) {
      const laptopStockStatus = getStockStatus(laptop.stockQuantity)
      if (!filters.stockStatuses.includes(laptopStockStatus)) {
        return false
      }
    }

    return true
  })
}

/**
 * Sorts laptops based on the provided sort option
 * @param {Array} laptops - Array of laptop objects
 * @param {string} sortOption - Sort option from SORT_OPTIONS
 * @returns {Array} Sorted array of laptops
 */
export const sortLaptops = (laptops, sortOption) => {
  if (!laptops || laptops.length === 0) {
    return []
  }

  // Create a copy to avoid mutating the original array
  const sortedLaptops = [...laptops]

  switch (sortOption) {
    case SORT_OPTIONS.PRICE_LOW_TO_HIGH:
      return sortedLaptops.sort((a, b) => a.discountedPrice - b.discountedPrice)
    
    case SORT_OPTIONS.PRICE_HIGH_TO_LOW:
      return sortedLaptops.sort((a, b) => b.discountedPrice - a.discountedPrice)
    
    default:
      return sortedLaptops
  }
}

/**
 * Applies both filtering and sorting to laptops
 * @param {Array} laptops - Array of laptop objects
 * @param {Object} filters - Filter object
 * @param {string} sortOption - Sort option
 * @returns {Array} Filtered and sorted array of laptops
 */
export const applyFiltersAndSort = (laptops, filters, sortOption) => {
  const filtered = filterLaptops(laptops, filters)
  return sortLaptops(filtered, sortOption)
}

/**
 * Extracts unique values from laptop array for filter options
 * @param {Array} laptops - Array of laptop objects
 * @returns {Object} Object with unique brands, ramSizes, storageTypes
 */
export const getFilterOptions = (laptops) => {
  if (!laptops || laptops.length === 0) {
    return {
      brands: [],
      ramSizes: [],
      storageTypes: []
    }
  }

  const brands = [...new Set(laptops.map(l => l.brand).filter(Boolean))].sort()
  
  // Extract RAM sizes (e.g., "16GB" -> "16")
  const ramSizes = [...new Set(laptops.map(l => {
    if (!l.specs || !l.specs.ram) return null
    const ramMatch = l.specs.ram.match(/(\d+)/)
    return ramMatch ? ramMatch[1] : null
  }).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b))
  
  // Extract storage types (SSD, HDD, etc.)
  const storageTypes = [...new Set(laptops.map(l => {
    if (!l.specs || !l.specs.storage) return null
    const storage = l.specs.storage.toLowerCase()
    if (storage.includes('ssd')) return 'SSD'
    if (storage.includes('hdd')) return 'HDD'
    return null
  }).filter(Boolean))].sort()

  return {
    brands,
    ramSizes,
    storageTypes
  }
}
