import express from 'express';
import { getEarningsPerUniversity, setCommissionRate, setPayoutFreeze } from '../controllers/adminCommissionController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { adminValidator } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));
router.use(adminValidator);

router.get('/commission/earnings', getEarningsPerUniversity);
router.post('/commission/rate', setCommissionRate);
router.post('/commission/freeze', setPayoutFreeze);

export default router;
