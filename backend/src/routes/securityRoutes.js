import express from 'express';
import {
  changePassword,
  getLoginSessions,
  logoutAllDevices,
  toggle2FA,
  getSecuritySettings
} from '../controllers/securityController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// All security routes require authentication
router.use(authenticate);

// GET /api/security/settings - Get current security settings
router.get('/settings', asyncHandler(getSecuritySettings));

// POST /api/security/change-password - Change password
router.post('/change-password', asyncHandler(changePassword));

// GET /api/security/sessions - Get login sessions
router.get('/sessions', asyncHandler(getLoginSessions));

// POST /api/security/logout-all - Logout from all devices
router.post('/logout-all', asyncHandler(logoutAllDevices));

// POST /api/security/toggle-2fa - Toggle 2FA
router.post('/toggle-2fa', asyncHandler(toggle2FA));

export default router;
