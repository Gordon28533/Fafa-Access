/**
 * Simple in-memory cache for frequently accessed static data
 * Reduces redundant API calls for data that doesn't change often
 */

class DataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * Get data from cache if available and not expired
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key, ttl = 5 * 60 * 1000) {
    const data = this.cache.get(key);
    const timestamp = this.timestamps.get(key);

    if (!data || !timestamp) {
      return null;
    }

    const now = Date.now();
    if (now - timestamp > ttl) {
      // Cache expired
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return data;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Clear specific cache entry or entire cache
   * @param {string} [key] - Cache key to clear, or clear all if not provided
   */
  clear(key) {
    if (key) {
      this.cache.delete(key);
      this.timestamps.delete(key);
    } else {
      this.cache.clear();
      this.timestamps.clear();
    }
  }

  /**
   * Check if cache has valid entry
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in milliseconds
   * @returns {boolean} True if cache has valid entry
   */
  has(key, ttl = 5 * 60 * 1000) {
    return this.get(key, ttl) !== null;
  }
}

// Export singleton instance
export const dataCache = new DataCache();

// Cache keys
export const CACHE_KEYS = {
  LAPTOPS: 'laptops',
  UNIVERSITIES: 'universities', // Reserved for future use
  USER_PROFILE: 'user_profile', // Reserved for future use
};
