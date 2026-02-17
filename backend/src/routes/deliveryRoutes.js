import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import { confirmDelivery, confirmPayment } from '../controllers/deliveryController.js';

const router = express.Router();

// POST /delivery/confirm - Delivery staff confirms delivery
router.post(
  '/confirm',
  authenticate,
  requireRole('DELIVERY'),
  confirmDelivery
);

// POST /delivery/confirm-payment - Delivery staff confirms payment
router.post(
  '/confirm-payment',
  authenticate,
  requireRole('DELIVERY'),
  confirmPayment
);

export default router;
