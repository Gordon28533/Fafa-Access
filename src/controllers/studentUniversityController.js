/**
 * Student University Controller
 * 
 * API endpoints for students to fetch available universities.
 * Read-only endpoints - students can only view active universities.
 * 
 * ENDPOINTS:
 * - GET /api/universities - List active universities for application
 * - GET /api/universities/:id - Get specific university details
 * 
 * Created: February 8, 2024
 */

import process from 'process';
import UniversityService from '../services/UniversityService.js';

/**
 * Get available universities for student application
 * 
 * Returns only ACTIVE universities that are accepting applications
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getAvailableUniversities(req, res) {
  try {
    const { search = '' } = req.query;

    // Get all active universities
    const universities = await UniversityService.getActiveUniversities();

    // Filter by search if provided
    let filtered = universities;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = universities.filter(
        u =>
          u.name.toLowerCase().includes(searchLower) ||
          u.code.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      message: 'Available universities retrieved successfully',
      data: {
        universities: filtered.map(u => ({
          id: u.id,
          name: u.name,
          code: u.code,
          // Don't expose internal contact info to students
          address: u.address
        })),
        count: filtered.length,
        search: search || undefined
      }
    });
  } catch (error) {
    console.error('Error fetching available universities:', error);
    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve available universities',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get specific university details for application
 * 
 * Returns only if university is ACTIVE and accepting applications
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
async function getUniversityForApplication(req, res) {
  try {
    const { id } = req.params;

    const university = await UniversityService.getUniversityById(id);

    // Check if active (accepting applications)
    if (!university.active) {
      return res.status(410).json({
        error: 'UNIVERSITY_NOT_ACCEPTING',
        message: 'This university is not currently accepting applications'
      });
    }

    res.status(200).json({
      message: 'University details retrieved successfully',
      data: {
        id: university.id,
        name: university.name,
        code: university.code,
        address: university.address,
        acceptingApplications: university.active
      }
    });
  } catch (error) {
    console.error('Error fetching university details:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'University not found'
      });
    }

    res.status(500).json({
      error: 'FETCH_FAILED',
      message: 'Failed to retrieve university details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export {
  getAvailableUniversities,
  getUniversityForApplication
};
