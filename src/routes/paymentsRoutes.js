import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { getMyPaymentStatus, initiatePaystack, verifyPaystack } from '../controllers/paymentsController.js';

const router = express.Router();

router.get('/status/my', authenticate, requireRole('STUDENT'), getMyPaymentStatus);
router.post('/paystack/initiate', authenticate, requireRole('STUDENT'), initiatePaystack);
router.post('/paystack/verify', authenticate, requireRole('STUDENT'), verifyPaystack);

export default router;
