/**
 * Admin Payment Controller
 * 
 * Provides read-only access to payment data for administrators.
 * Allows admins to view payment states, references, dates, and statistics.
 * 
 * ENDPOINTS:
 * - GET /api/admin/payments - List all payments with filters
 * - GET /api/admin/payments/:id - Get specific payment details
 * - GET /api/admin/payments/summary - Get payment statistics
 * - GET /api/admin/payments/application/:applicationId - Get payments for specific application
 * 
 * SECURITY:
 * - All endpoints require admin role verification
 * - Read-only access (no create/update/delete)
 * - JWT authentication required
 * 
 * Created: February 8, 2024
 */

import process from 'process';
import { db } from '../db/connection.js';
import { payments, applications, users } from '../db/schema/index.js';
import { eq, desc, asc, and, or, gte, lte, sql, count } from 'drizzle-orm';

/**
 * Get all payments with filtering and pagination
 * 
 * Query Parameters:
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 20, max: 100)
 * - status (string): Filter by payment status (PENDING, COMPLETED, FAILED)
 * - type (string): Filter by payment type (INSTALLMENT, FULL_PAYMENT)
 * - search (string): Search by payment reference or application reference
 * - startDate (string): Filter payments from this date (ISO format)
 * - endDate (string): Filter payments until this date (ISO format)
 * - sortBy (string): Sort field (initiated_at, completed_at, amount) (default: initiated_at)
 * - sortOrder (string): Sort order (asc, desc) (default: desc)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllPayments(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      search,
      startDate,
      endDate,
      sortBy = 'initiated_at',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(payments.status, status.toUpperCase()));
    }

    if (type) {
      conditions.push(eq(payments.type, type.toUpperCase()));
    }

    if (search) {
      conditions.push(
        or(
          sql`${payments.payment_reference} ILIKE ${`%${search}%`}`,
          sql`${payments.paystack_reference} ILIKE ${`%${search}%`}`
        )
      );
    }

    if (startDate) {
      conditions.push(gte(payments.initiated_at, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(payments.initiated_at, new Date(endDate)));
    }

    // Build query with joins to get application and student data
    const query = db
      .select({
        // Payment fields
        id: payments.id,
        applicationId: payments.application_id,
        type: payments.type,
        amount: payments.amount,
        currency: payments.currency,
        paymentReference: payments.payment_reference,
        paystackReference: payments.paystack_reference,
        status: payments.status,
        initiatedAt: payments.initiated_at,
        completedAt: payments.completed_at,
        createdAt: payments.created_at,
        
        // Application fields
        applicationReference: applications.reference,
        applicationStatus: applications.status,
        
        // Student fields
        studentId: users.id,
        studentName: sql`CONCAT(${users.first_name}, ' ', ${users.last_name})`,
        studentEmail: users.email,
        studentPhone: users.phone,
      })
      .from(payments)
      .leftJoin(applications, eq(payments.application_id, applications.id))
      .leftJoin(users, eq(applications.student_id, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limitNum)
      .offset(offset);

    // Apply sorting
    const sortColumn = {
      'initiated_at': payments.initiated_at,
      'completed_at': payments.completed_at,
      'amount': payments.amount,
      'status': payments.status
    }[sortBy] || payments.initiated_at;

    if (sortOrder === 'asc') {
      query.orderBy(asc(sortColumn));
    } else {
      query.orderBy(desc(sortColumn));
    }

    // Execute query
    const paymentsData = await query;

    // Get total count for pagination
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalPages = Math.ceil(totalCount / limitNum);

    // Format response
    res.status(200).json({
      message: 'Payments retrieved successfully',
      data: {
        payments: paymentsData.map(payment => ({
          id: payment.id,
          applicationId: payment.applicationId,
          applicationReference: payment.applicationReference,
          type: payment.type,
          amount: Number(payment.amount),
          currency: payment.currency,
          paymentReference: payment.paymentReference,
          paystackReference: payment.paystackReference,
          status: payment.status,
          initiatedAt: payment.initiatedAt,
          completedAt: payment.completedAt,
          createdAt: payment.createdAt,
          student: {
            id: payment.studentId,
            name: payment.studentName,
            email: payment.studentEmail,
            phone: payment.studentPhone
          },
          application: {
            reference: payment.applicationReference,
            status: payment.applicationStatus
          }
        })),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1
        },
        filters: {
          status,
          type,
          search,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payments for admin:', error);
    res.status(500).json({
      error: 'PAYMENTS_FETCH_FAILED',
      message: 'Failed to retrieve payments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get payment statistics and summary
 * 
 * Returns aggregate data about payments:
 * - Total payments count
 * - Total amount collected
 * - Breakdown by status (pending, completed, failed)
 * - Breakdown by type (installment, full payment)
 * - Recent activity trends
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPaymentSummary(req, res) {
  try {
    // Get total count by status
    const statusCounts = await db
      .select({
        status: payments.status,
        count: count(),
        totalAmount: sql`SUM(${payments.amount})::numeric`
      })
      .from(payments)
      .groupBy(payments.status);

    // Get total count by type
    const typeCounts = await db
      .select({
        type: payments.type,
        count: count(),
        totalAmount: sql`SUM(${payments.amount})::numeric`
      })
      .from(payments)
      .groupBy(payments.type);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPayments = await db
      .select({
        date: sql`DATE(${payments.initiated_at})`,
        count: count(),
        amount: sql`SUM(${payments.amount})::numeric`
      })
      .from(payments)
      .where(gte(payments.initiated_at, sevenDaysAgo))
      .groupBy(sql`DATE(${payments.initiated_at})`)
      .orderBy(sql`DATE(${payments.initiated_at})`);

    // Get overall totals
    const [overallTotals] = await db
      .select({
        totalPayments: count(),
        totalAmount: sql`SUM(${payments.amount})::numeric`,
        completedAmount: sql`SUM(CASE WHEN ${payments.status} = 'COMPLETED' THEN ${payments.amount} ELSE 0 END)::numeric`,
        pendingAmount: sql`SUM(CASE WHEN ${payments.status} = 'PENDING' THEN ${payments.amount} ELSE 0 END)::numeric`
      })
      .from(payments);

    // Format response
    res.status(200).json({
      message: 'Payment summary retrieved successfully',
      data: {
        overview: {
          totalPayments: overallTotals.totalPayments || 0,
          totalAmount: Number(overallTotals.totalAmount || 0),
          completedAmount: Number(overallTotals.completedAmount || 0),
          pendingAmount: Number(overallTotals.pendingAmount || 0),
          currency: 'GHS'
        },
        byStatus: statusCounts.map(item => ({
          status: item.status,
          count: item.count || 0,
          totalAmount: Number(item.totalAmount || 0)
        })),
        byType: typeCounts.map(item => ({
          type: item.type,
          count: item.count || 0,
          totalAmount: Number(item.totalAmount || 0)
        })),
        recentActivity: recentPayments.map(item => ({
          date: item.date,
          count: item.count || 0,
          amount: Number(item.amount || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({
      error: 'SUMMARY_FETCH_FAILED',
      message: 'Failed to retrieve payment summary',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get specific payment details by ID
 * 
 * Returns full payment record with associated application and student data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPaymentById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Payment ID is required'
      });
    }

    // Fetch payment with joins
    const [payment] = await db
      .select({
        // Payment fields
        id: payments.id,
        applicationId: payments.application_id,
        type: payments.type,
        amount: payments.amount,
        currency: payments.currency,
        paymentReference: payments.payment_reference,
        paystackReference: payments.paystack_reference,
        status: payments.status,
        initiatedAt: payments.initiated_at,
        completedAt: payments.completed_at,
        verificationResult: payments.verification_result,
        createdAt: payments.created_at,
        updatedAt: payments.updated_at,
        
        // Application fields
        applicationReference: applications.reference,
        applicationStatus: applications.status,
        laptopBrand: applications.laptop_brand,
        laptopModel: applications.laptop_model,
        laptopPrice: applications.laptop_price,
        
        // Student fields
        studentId: users.id,
        studentFirstName: users.first_name,
        studentLastName: users.last_name,
        studentEmail: users.email,
        studentPhone: users.phone,
        studentIndexNumber: users.index_number
      })
      .from(payments)
      .leftJoin(applications, eq(payments.application_id, applications.id))
      .leftJoin(users, eq(applications.student_id, users.id))
      .where(eq(payments.id, id));

    if (!payment) {
      return res.status(404).json({
        error: 'PAYMENT_NOT_FOUND',
        message: 'Payment record not found'
      });
    }

    // Format response
    res.status(200).json({
      message: 'Payment details retrieved successfully',
      data: {
        id: payment.id,
        applicationId: payment.applicationId,
        type: payment.type,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentReference: payment.paymentReference,
        paystackReference: payment.paystackReference,
        status: payment.status,
        initiatedAt: payment.initiatedAt,
        completedAt: payment.completedAt,
        verificationResult: payment.verificationResult,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        student: {
          id: payment.studentId,
          firstName: payment.studentFirstName,
          lastName: payment.studentLastName,
          fullName: `${payment.studentFirstName} ${payment.studentLastName}`,
          email: payment.studentEmail,
          phone: payment.studentPhone,
          indexNumber: payment.studentIndexNumber
        },
        application: {
          reference: payment.applicationReference,
          status: payment.applicationStatus,
          laptop: {
            brand: payment.laptopBrand,
            model: payment.laptopModel,
            price: Number(payment.laptopPrice)
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      error: 'PAYMENT_FETCH_FAILED',
      message: 'Failed to retrieve payment details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get all payments for a specific application
 * 
 * Returns all payment records associated with an application
 * Useful for viewing payment history
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPaymentsByApplication(req, res) {
  try {
    const { applicationId } = req.params;

    if (!applicationId) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Application ID is required'
      });
    }

    // Fetch application to verify it exists
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!application) {
      return res.status(404).json({
        error: 'APPLICATION_NOT_FOUND',
        message: 'Application not found'
      });
    }

    // Fetch all payments for this application
    const paymentsData = await db
      .select({
        id: payments.id,
        type: payments.type,
        amount: payments.amount,
        currency: payments.currency,
        paymentReference: payments.payment_reference,
        paystackReference: payments.paystack_reference,
        status: payments.status,
        initiatedAt: payments.initiated_at,
        completedAt: payments.completed_at,
        createdAt: payments.created_at
      })
      .from(payments)
      .where(eq(payments.application_id, applicationId))
      .orderBy(desc(payments.initiated_at));

    res.status(200).json({
      message: 'Application payments retrieved successfully',
      data: {
        applicationId,
        applicationReference: application.reference,
        payments: paymentsData.map(p => ({
          id: p.id,
          type: p.type,
          amount: Number(p.amount),
          currency: p.currency,
          paymentReference: p.paymentReference,
          paystackReference: p.paystackReference,
          status: p.status,
          initiatedAt: p.initiatedAt,
          completedAt: p.completedAt,
          createdAt: p.createdAt
        })),
        totalPayments: paymentsData.length
      }
    });
  } catch (error) {
    console.error('Error fetching application payments:', error);
    res.status(500).json({
      error: 'PAYMENTS_FETCH_FAILED',
      message: 'Failed to retrieve application payments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export {
  getAllPayments,
  getPaymentSummary,
  getPaymentById,
  getPaymentsByApplication
};
