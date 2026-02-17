/**
 * Laptop Service Layer
 * Handles all API calls for laptop CRUD operations
 */

export class LaptopService {
  constructor(authFetch) {
    this.authFetch = authFetch;
  }

  /**
   * Get all active laptops (student view)
   */
  async getActiveLaptops() {
    const response = await this.authFetch('/api/laptops');
    if (!response.ok) {
      throw new Error('Failed to fetch active laptops');
    }
    return response.json();
  }

  /**
   * Get all laptops including inactive (admin view)
   */
  async getAllLaptops() {
    const response = await this.authFetch('/api/laptops/admin/all');
    if (!response.ok) {
      throw new Error('Failed to fetch all laptops');
    }
    return response.json();
  }

  /**
   * Get inventory summary statistics
   */
  async getInventorySummary() {
    const response = await this.authFetch('/api/laptops/admin/summary');
    if (!response.ok) {
      throw new Error('Failed to fetch inventory summary');
    }
    return response.json();
  }

  /**
   * Create a new laptop
   */
  async createLaptop(laptopData) {
    const response = await this.authFetch('/api/laptops/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(laptopData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create laptop');
    }
    return response.json();
  }

  /**
   * Update an existing laptop
   */
  async updateLaptop(laptopId, laptopData) {
    const response = await this.authFetch(`/api/laptops/admin/${laptopId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(laptopData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update laptop');
    }
    return response.json();
  }

  /**
   * Deactivate a laptop (soft delete)
   */
  async deactivateLaptop(laptopId) {
    const response = await this.authFetch(`/api/laptops/admin/${laptopId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to deactivate laptop');
    }
    return response.json();
  }

  /**
   * Reactivate a laptop
   */
  async activateLaptop(laptopId) {
    const response = await this.authFetch(
      `/api/laptops/admin/${laptopId}/activate`,
      { method: 'POST' }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to activate laptop');
    }
    return response.json();
  }

  /**
   * Adjust stock quantity
   */
  async adjustStock(laptopId, quantity, reason = 'Manual adjustment') {
    const response = await this.authFetch(
      `/api/laptops/admin/${laptopId}/adjust-stock`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, reason }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to adjust stock');
    }
    return response.json();
  }
}

/**
 * Create and export a service instance
 */
export const createLaptopService = (authFetch) => {
  return new LaptopService(authFetch);
};
