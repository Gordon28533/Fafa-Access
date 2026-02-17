import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { supportTickets, supportTicketMessages } from '../db/schema/index.js';
import { logger } from '../observability.js';

const ISSUE_TYPES = ['VERIFICATION', 'PAYMENT', 'DELIVERY', 'OTHER'];
const STAFF_ROLES = ['ADMIN', 'SRC'];

const sanitizeAttachments = (attachments) => {
  if (!attachments) return [];
  if (!Array.isArray(attachments)) return [];
  return attachments
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : undefined,
      url: typeof item.url === 'string' ? item.url : undefined,
    }))
    .filter((item) => item.url);
};

const ensureTicketAccess = (ticket, user) => {
  const isStaff = STAFF_ROLES.includes(user.role);
  if (isStaff) return true;
  return ticket.userId === user.userId;
};

export const createSupportTicket = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { issueType, subject, description, attachments } = req.body || {};

    if (!ISSUE_TYPES.includes(issueType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue type',
        errors: ['issueType must be one of VERIFICATION, PAYMENT, DELIVERY, OTHER'],
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required',
        errors: ['subject is required'],
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
        errors: ['description is required'],
      });
    }

    const now = new Date();
    const ticketInsert = await db
      .insert(supportTickets)
      .values({
        userId,
        issueType,
        subject: subject.trim(),
        description: description.trim(),
        status: 'OPEN',
        lastMessageAt: now,
        updatedAt: now,
      })
      .returning();

    const ticket = ticketInsert[0];

    const messageInsert = await db
      .insert(supportTicketMessages)
      .values({
        ticketId: ticket.id,
        senderId: userId,
        senderRole: req.user.role,
        message: description.trim(),
        attachments: sanitizeAttachments(attachments),
      })
      .returning();

    logger.info({ ticketId: ticket.id, userId }, 'Created support ticket');

    return res.status(201).json({
      success: true,
      message: 'Support ticket created',
      data: {
        ticket,
        messages: messageInsert,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to create support ticket');
    return res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      errors: [error.message],
    });
  }
};

export const listMyTickets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(desc(supportTickets.lastMessageAt));

    return res.json({
      success: true,
      message: 'Tickets retrieved',
      data: tickets,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list tickets');
    return res.status(500).json({
      success: false,
      message: 'Failed to list tickets',
      errors: [error.message],
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const isStaff = STAFF_ROLES.includes(req.user.role);

    const ticketRows = await db
      .select()
      .from(supportTickets)
      .where(isStaff ? eq(supportTickets.id, ticketId) : and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, req.user.userId)))
      .limit(1);

    if (!ticketRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        errors: ['Ticket not found or access denied'],
      });
    }

    const ticket = ticketRows[0];
    if (!ensureTicketAccess(ticket, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(supportTicketMessages.createdAt);

    return res.json({
      success: true,
      message: 'Ticket retrieved',
      data: { ticket, messages },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch ticket');
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      errors: [error.message],
    });
  }
};

export const replyToTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { message, attachments } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        errors: ['message is required'],
      });
    }

    const ticketRows = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticketRows.length) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const ticket = ticketRows[0];
    if (!ensureTicketAccess(ticket, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Ticket is closed and read-only' });
    }

    const now = new Date();
    const sanitizedAttachments = sanitizeAttachments(attachments);

    const messageInsert = await db
      .insert(supportTicketMessages)
      .values({
        ticketId,
        senderId: req.user.userId,
        senderRole: req.user.role,
        message: message.trim(),
        attachments: sanitizedAttachments,
      })
      .returning();

    const nextStatus = STAFF_ROLES.includes(req.user.role) ? 'IN_PROGRESS' : ticket.status;

    const updatedTicket = await db
      .update(supportTickets)
      .set({
        status: nextStatus === 'CLOSED' ? ticket.status : nextStatus,
        lastMessageAt: now,
        updatedAt: now,
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    logger.info({ ticketId, userId: req.user.userId }, 'Added ticket reply');

    return res.json({
      success: true,
      message: 'Reply added',
      data: { ticket: updatedTicket[0], messages: messageInsert },
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to add ticket reply');
    return res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      errors: [error.message],
    });
  }
};

export const closeTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticketRows = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticketRows.length) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const ticket = ticketRows[0];
    if (!ensureTicketAccess(ticket, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (ticket.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Ticket already closed' });
    }

    const now = new Date();
    const updated = await db
      .update(supportTickets)
      .set({ status: 'CLOSED', closedAt: now, updatedAt: now })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    logger.info({ ticketId, userId: req.user.userId }, 'Closed support ticket');

    return res.json({ success: true, message: 'Ticket closed', data: updated[0] });
  } catch (error) {
    logger.error({ err: error }, 'Failed to close ticket');
    return res.status(500).json({ success: false, message: 'Failed to close ticket', errors: [error.message] });
  }
};
