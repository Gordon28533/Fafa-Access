import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { getStudentProfile, updateStudentProfile, listUniversities } from '../controllers/studentProfileController.js';

const router = express.Router();

router.get('/profile', authenticate, requireRole('STUDENT'), getStudentProfile);
router.patch('/profile', authenticate, requireRole('STUDENT'), updateStudentProfile);
router.get('/universities', authenticate, requireRole('STUDENT'), listUniversities);

export default router;
