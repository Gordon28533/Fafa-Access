/**
 * Admin University Controller
 * 
 * API endpoints for admin to manage universities.
 * All endpoints require ADMIN role authorization.
 * 
 * ENDPOINTS:
 * - POST /api/admin/universities - Create university
 * - GET /api/admin/universities - List all universities
 * - GET /api/admin/universities/:id - Get specific university
 * - PUT /api/admin/universities/:id - Update university
 * - PATCH /api/admin/universities/:id/activate - Activate university
 * - PATCH /api/admin/universities/:id/deactivate - Deactivate university
 * - DELETE /api/admin/universities/:id - Delete university
 * - GET /api/admin/universities/stats - University statistics
 * 
 * Created: February 8, 2024
 */

import process from 'process';
import UniversityService from '../services/UniversityService.js';
import { logAdminAction } from '../utils/auditLogger.js';

/**
 * Create a new university
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function createUniversity(req, res) {
  try {
    const { name, code, email, phone, address, active } = req.body;

    // Validate required fields
    if (!name || !code || !email || !phone) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Name, code, email, and phone are required',
        required: ['name', 'code', 'email', 'phone']
      });
    }

    // Validate email format
    // Add length check to prevent ReDoS attacks
    if (email.length > 254) {
      return res.status(400).json({
        error: 'INVALID_EMAIL',
        message: 'Email address is too long'
      });
    }
    
    // Use safer regex without catastrophic backtracking
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'INVALID_EMAIL',
        message: 'Please provide a valid email address'
      });
    }

    // Validate phone format (basic)
    if (!/^[\d\s\-+()]{7,}$/.test(phone)) {
      return res.status(400).json({
        error: 'INVALID_PHONE',
        message: 'Please provide a valid phone number'
      });
    }

    // Create university
    const university = await UniversityService.createUniversity({
      name,
      code,
      email,
      phone,
      address,
      active: active !== false
    });

    // Audit log: University created
    await logAdminAction({
      actorId: req.user?.userId || req.user?.id,
      actorRole: 'ADMIN',
      targetId: university.id,
      targetType: 'university',
      action: 'created',
      details: { name, code, email, phone, address, active: university.active },
    });

    res.status(201).json({
      message: 'University created successfully',
      data: {
        id: university.id,
        name: university.name,
        code: university.code,
        email: university.email,
        phone: university.phone,
        address: university.address,
        active: university.active,
        createdAt: university.created_at
      }
    });
  } catch (error) {
    console.error('Error creating university:', error);

    // Handle duplicate code/email errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'DUPLICATE_ENTRY',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'CREATION_FAILED',
      message: 'Failed to create university',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all universities
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getAllUniversities(req, res) {
  try {
    const { activeOnly = false, sortBy = 'name', sortOrder = 'asc' } = req.query;

    const universities = await UniversityService.getAllUniversities({
      activeOnly: activeOnly === 'true' || activeOnly === true,
      sortBy,
      sortOrder
    });

    res.status(200).json({
      message: 'Universities retrieved successfully',
      data: {
        universities: universities.map(u => ({
          id: u.id,
          name: u.name,
          code: u.code,
          email: u.email,
          phone: u.phone,
          address: u.address,
          active: u.active,
          createdAt: u.created_at,
          updatedAt: u.updated_at
        })),
        count: universities.length,
        filters: {
          activeOnly,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve universities',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get specific university
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getUniversity(req, res) {
  try {
    const { id } = req.params;

    const university = await UniversityService.getUniversityById(id);

    res.status(200).json({
      message: 'University retrieved successfully',
      data: {
        id: university.id,
        name: university.name,
        code: university.code,
        email: university.email,
        phone: university.phone,
        address: university.address,
        active: university.active,
        createdAt: university.created_at,
        updatedAt: university.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching university:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve university',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Update university
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function updateUniversity(req, res) {
  try {
    const { id } = req.params;
    const { name, code, email, phone, address, active } = req.body;

    // At least one field must be provided
    if (!name && !code && !email && !phone && address === undefined && active === undefined) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'At least one field must be provided for update'
      });
    }

    // Validate email if provided
    if (email) {
      // Add length check to prevent ReDoS attacks
      if (email.length > 254) {
        return res.status(400).json({
          error: 'INVALID_EMAIL',
          message: 'Email address is too long'
        });
      }
      
      // Use safer regex without catastrophic backtracking
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address'
        });
      }
    }

    const university = await UniversityService.updateUniversity(id, {
      name,
      code,
      email,
      phone,
      address,
      active
    });

    // Audit log: University updated
    await logAdminAction({
      actorId: req.user?.userId || req.user?.id,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'university',
      action: 'updated',
      details: { name, code, email, phone, address, active },
    });

    res.status(200).json({
      message: 'University updated successfully',
      data: {
        id: university.id,
        name: university.name,
        code: university.code,
        email: university.email,
        phone: university.phone,
        address: university.address,
        active: university.active,
        createdAt: university.created_at,
        updatedAt: university.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating university:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: 'DUPLICATE_ENTRY',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'UPDATE_FAILED',
      message: 'Failed to update university',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Activate university
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function activateUniversity(req, res) {
  try {
    const { id } = req.params;

    const university = await UniversityService.setUniversityStatus(id, true);

    // Audit log: University activated
    await logAdminAction({
      actorId: req.user?.userId || req.user?.id,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'university',
      action: 'activated',
      details: { name: university.name, active: true },
    });

    res.status(200).json({
      message: 'University activated successfully',
      data: {
        id: university.id,
        name: university.name,
        code: university.code,
        active: university.active,
        status: 'ACTIVATED'
      }
    });
  } catch (error) {
    console.error('Error activating university:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'ACTIVATION_FAILED',
      message: 'Failed to activate university',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Deactivate university
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function deactivateUniversity(req, res) {
  try {
    const { id } = req.params;

    const university = await UniversityService.setUniversityStatus(id, false);

    // Audit log: University deactivated
    await logAdminAction({
      actorId: req.user?.userId || req.user?.id,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'university',
      action: 'deactivated',
      details: { name: university.name, active: false },
    });

    res.status(200).json({
      message: 'University deactivated successfully',
      data: {
        id: university.id,
        name: university.name,
        code: university.code,
        active: university.active,
        status: 'DEACTIVATED'
      }
    });
  } catch (error) {
    console.error('Error deactivating university:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'DEACTIVATION_FAILED',
      message: 'Failed to deactivate university',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Delete university
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function deleteUniversity(req, res) {
  try {
    const { id } = req.params;

    const university = await UniversityService.getUniversityById(id); // Get name before delete

    await UniversityService.deleteUniversity(id);

    // Audit log: University deleted
    await logAdminAction({
      actorId: req.user?.userId || req.user?.id,
      actorRole: 'ADMIN',
      targetId: id,
      targetType: 'university',
      action: 'deleted',
      details: { name: university.name },
    });

    res.status(200).json({
      message: 'University deleted successfully',
      data: {
        id,
        name: university.name,
        deleted: true
      }
    });
  } catch (error) {
    console.error('Error deleting university:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'DELETION_FAILED',
      message: 'Failed to delete university',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get university statistics
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getUniversityStats(req, res) {
  try {
    const stats = await UniversityService.getUniversityStats();

    res.status(200).json({
      message: 'University statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error fetching university stats:', error);
    res.status(500).json({
      error: 'STATS_FETCH_FAILED',
      message: 'Failed to retrieve statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export {
  createUniversity,
  getAllUniversities,
  getUniversity,
  updateUniversity,
  activateUniversity,
  deactivateUniversity,
  deleteUniversity,
  getUniversityStats
};
