/**
 * University Service
 * 
 * Business logic for managing universities.
 * Handles CRUD operations, validation, and business rules.
 * 
 * FEATURES:
 * - Create universities with validation
 * - Retrieve universities (active and inactive)
 * - Update university information
 * - Activate/deactivate universities
 * - Get universities by status
 * - Check if university is accepting applications
 * 
 * Created: February 8, 2024
 */

import { db } from '../db/connection.js';
import { universities } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

class UniversityService {
  /**
   * Create a new university
   * 
   * @param {Object} data - University data
   * @param {string} data.name - University name (required)
   * @param {string} data.code - University code/abbreviation (required, unique)
   * @param {string} data.email - University email (required)
   * @param {string} data.phone - University phone (required)
   * @param {string} data.address - University address (optional)
   * @param {boolean} data.active - Active status (default: true)
   * 
   * @returns {Object} Created university record
   * @throws {Error} If validation fails or university already exists
   */
  async createUniversity(data) {
    try {
      // Validation
      if (!data.name || !data.code || !data.email || !data.phone) {
        throw new Error('NAME, CODE, EMAIL, and PHONE are required');
      }

      // Check if code already exists
      const existingCode = await db
        .select()
        .from(universities)
        .where(eq(universities.code, data.code.toUpperCase()));

      if (existingCode.length > 0) {
        throw new Error(`University code '${data.code}' already exists`);
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(universities)
        .where(eq(universities.email, data.email));

      if (existingEmail.length > 0) {
        throw new Error(`Email '${data.email}' is already registered`);
      }

      // Create university
      const [university] = await db
        .insert(universities)
        .values({
          name: data.name.trim(),
          code: data.code.toUpperCase().trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
          address: data.address ? data.address.trim() : null,
          active: data.active !== false, // Default to true
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();

      return university;
    } catch (error) {
      console.error('Error creating university:', error);
      throw error;
    }
  }

  /**
   * Get all universities
   * 
   * @param {Object} options - Options
   * @param {boolean} options.activeOnly - Return only active universities (default: false)
   * @param {string} options.sortBy - Sort field (name, created_at) (default: name)
   * @param {string} options.sortOrder - Sort order (asc, desc) (default: asc)
   * 
   * @returns {Array} Array of university records
   */
  async getAllUniversities(options = {}) {
    try {
      const { activeOnly = false, sortBy = 'name', sortOrder = 'asc' } = options;

      let query = db.select().from(universities);

      if (activeOnly) {
        query = query.where(eq(universities.active, true));
      }

      // Apply sorting
      if (sortBy === 'created_at') {
        if (sortOrder === 'desc') {
          query = query.orderBy(universities.created_at);
        } else {
          query = query.orderBy(universities.created_at);
        }
      } else {
        if (sortOrder === 'desc') {
          query = query.orderBy(universities.name);
        } else {
          query = query.orderBy(universities.name);
        }
      }

      const unis = await query;
      return unis;
    } catch (error) {
      console.error('Error fetching universities:', error);
      throw error;
    }
  }

  /**
   * Get university by ID
   * 
   * @param {string} id - University ID
   * @returns {Object} University record
   * @throws {Error} If university not found
   */
  async getUniversityById(id) {
    try {
      const [university] = await db
        .select()
        .from(universities)
        .where(eq(universities.id, id));

      if (!university) {
        throw new Error(`University with ID '${id}' not found`);
      }

      return university;
    } catch (error) {
      console.error('Error fetching university:', error);
      throw error;
    }
  }

  /**
   * Get university by code
   * 
   * @param {string} code - University code
   * @returns {Object} University record
   */
  async getUniversityByCode(code) {
    try {
      const [university] = await db
        .select()
        .from(universities)
        .where(eq(universities.code, code.toUpperCase()));

      return university || null;
    } catch (error) {
      console.error('Error fetching university by code:', error);
      throw error;
    }
  }

  /**
   * Update university information
   * 
   * @param {string} id - University ID
   * @param {Object} data - Data to update
   * @returns {Object} Updated university record
   * @throws {Error} If university not found or validation fails
   */
  async updateUniversity(id, data) {
    try {
      // Verify university exists
      await this.getUniversityById(id);

      // If code is being changed, check for duplicates
      if (data.code) {
        const existing = await db
          .select()
          .from(universities)
          .where(
            and(
              eq(universities.code, data.code.toUpperCase()),
              eq(universities.id, id) // Exclude current university
            )
          );

        if (existing.length > 0) {
          throw new Error(`University code '${data.code}' already exists`);
        }
      }

      // If email is being changed, check for duplicates
      if (data.email) {
        const existingEmail = await db
          .select()
          .from(universities)
          .where(
            and(
              eq(universities.email, data.email.toLowerCase()),
              eq(universities.id, id)
            )
          );

        if (existingEmail.length > 0) {
          throw new Error(`Email '${data.email}' is already registered`);
        }
      }

      // Update university
      const updateData = {};
      if (data.name) updateData.name = data.name.trim();
      if (data.code) updateData.code = data.code.toUpperCase().trim();
      if (data.email) updateData.email = data.email.trim().toLowerCase();
      if (data.phone) updateData.phone = data.phone.trim();
      if (data.address !== undefined) updateData.address = data.address ? data.address.trim() : null;
      if (data.active !== undefined) updateData.active = data.active;
      updateData.updated_at = new Date();

      const [university] = await db
        .update(universities)
        .set(updateData)
        .where(eq(universities.id, id))
        .returning();

      return university;
    } catch (error) {
      console.error('Error updating university:', error);
      throw error;
    }
  }

  /**
   * Activate/Deactivate university
   * 
   * @param {string} id - University ID
   * @param {boolean} active - Active status
   * @returns {Object} Updated university record
   */
  async setUniversityStatus(id, active) {
    try {
      const [university] = await db
        .update(universities)
        .set({
          active,
          updated_at: new Date()
        })
        .where(eq(universities.id, id))
        .returning();

      return university;
    } catch (error) {
      console.error('Error setting university status:', error);
      throw error;
    }
  }

  /**
   * Delete university
   * 
   * @param {string} id - University ID
   * @returns {boolean} True if deleted
   */
  async deleteUniversity(id) {
    try {
      await this.getUniversityById(id); // Verify exists

      await db.delete(universities).where(eq(universities.id, id));

      return true;
    } catch (error) {
      console.error('Error deleting university:', error);
      throw error;
    }
  }

  /**
   * Check if university is accepting applications
   * 
   * @param {string} universityId - University ID
   * @returns {boolean} True if accepting applications
   */
  async isAcceptingApplications(universityId) {
    try {
      const university = await this.getUniversityById(universityId);
      return university && university.active === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get universities available for applications
   * 
   * @returns {Array} Active universities only
   */
  async getActiveUniversities() {
    return this.getAllUniversities({ activeOnly: true });
  }

  /**
   * Get university statistics
   * 
   * @returns {Object} Statistics
   */
  async getUniversityStats() {
    try {
      const allUniversities = await this.getAllUniversities();
      const activeUniversities = await this.getActiveUniversities();

      return {
        total: allUniversities.length,
        active: activeUniversities.length,
        inactive: allUniversities.length - activeUniversities.length,
        percentageActive: allUniversities.length > 0
          ? Math.round((activeUniversities.length / allUniversities.length) * 100)
          : 0
      };
    } catch (error) {
      console.error('Error getting university stats:', error);
      throw error;
    }
  }
}

export default new UniversityService();
