import express from 'express';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';
import {
  closeTicket,
  createSupportTicket,
  getTicketById,
  listMyTickets,
  replyToTicket,
} from '../controllers/supportTicketController.js';

const router = express.Router();

// Student: create ticket
router.post('/tickets', authenticate, requireRole('STUDENT'), createSupportTicket);

// Student: list own tickets
router.get('/tickets', authenticate, requireRole('STUDENT'), listMyTickets);

// Shared: view a ticket (student owner, SRC, ADMIN)
router.get('/tickets/:id', authenticate, requireRole('STUDENT', 'SRC', 'ADMIN'), getTicketById);

// Shared: reply to ticket (student owner, SRC, ADMIN)
router.post('/tickets/:id/replies', authenticate, requireRole('STUDENT', 'SRC', 'ADMIN'), replyToTicket);

// Shared: close ticket (student owner, SRC, ADMIN)
router.post('/tickets/:id/close', authenticate, requireRole('STUDENT', 'SRC', 'ADMIN'), closeTicket);

export default router;
