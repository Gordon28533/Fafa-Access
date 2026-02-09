/**
 * Application Controller
 * Handles student laptop application submission and management
 */

import process from 'process';
import { db } from '../db/connection.js';
import { 
  applications, 
  applicationStatusHistory,
  verificationStatuses,
  laptops
} from '../db/schema/applications.js';
import { studentProfiles, srcOfficers } from '../db/schema/universities.js';
import { users } from '../db/schema/users.js';
import { payments, deliveries } from '../db/schema/payments.js';
import { eq, and, desc, gte } from 'drizzle-orm';
import { logger } from '../observability.js';
import { auditLogService } from '../services/auditLogAdapter.js';
import { logApplicationStatusChange, logDelivery } from '../utils/auditLogger.js';
import { 
  sendApplicationSubmittedEmail, 
  sendApplicationApprovedEmail, 
  sendApplicationRejectedEmail,
  sendDeliveryScheduledEmail
} from '../services/emailNotifications.js';
import {
  verifySRCApplicationAccess,
  verifyStudentApplicationAccess,
  validateStatusTransition,
  logStatusTransition
} from '../middleware/authorizationHelpers.js';
import {
  validateAdminApproval,
  validateApplicationUpdate,
  validateWithdrawalEligibility,
  reserveLaptopStock,
  releaseLaptopStock
} from '../services/applicationBusinessRules.js';

/**
 * Generate unique application reference
 * Format: APP-YYYY-XXXX
 */
const generateApplicationReference = async () => {
  const year = new Date().getFullYear();
  
  // Get count of applications this year
  const yearStart = new Date(year, 0, 1);
  const result = await db
    .select()
    .from(applications)
    .where(gte(applications.createdAt, yearStart))
    .execute();
  
  const count = result.length + 1;
  const reference = `APP-${year}-${String(count).padStart(4, '0')}`;
  
  return reference;
};

/**
 * POST /api/applications
 * Student submits a new laptop application
 */
export const createApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only STUDENT role can apply for laptops
    if (userRole !== 'STUDENT') {
      logger.warn({ userId, userRole }, 'Non-student attempted to create application');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['Only students can apply for laptops']
      });
    }

    const {
      name,
      level,
      course,
      address,
      phoneNumber,
      ghanaCardNumber,
      ghanaCardFrontHash,
      ghanaCardBackHash,
      selfieHash,
      admissionLetterRef,
      laptopId
    } = req.body;

    logger.info({ userId, body: req.body }, 'Creating new application');

    // Validate required fields
    if (!name || !level || !course || !address || !phoneNumber || !ghanaCardNumber || !laptopId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: ['name, level, course, address, phoneNumber, ghanaCardNumber, and laptopId are required']
      });
    }

    // Validate Ghana Card documents
    if (!ghanaCardFrontHash || !ghanaCardBackHash || !selfieHash) {
      return res.status(400).json({
        success: false,
        message: 'Missing document uploads',
        errors: ['Ghana Card front, back, and selfie are required']
      });
    }

    // Get student profile
    const studentProfile = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    if (!studentProfile || studentProfile.length === 0) {
      logger.error({ userId }, 'Student profile not found');
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please complete your profile first.',
        errors: ['No student profile']
      });
    }

    const profile = studentProfile[0];

    // Check for existing pending applications
    const existingApplications = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.studentId, profile.id),
          eq(applications.status, 'PENDING_SRC')
        )
      );

    if (existingApplications.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending application',
        errors: ['Complete or withdraw your existing application first']
      });
    }

    // Validate laptop availability (active + in stock)
    const laptopResult = await db
      .select()
      .from(laptops)
      .where(eq(laptops.id, laptopId))
      .limit(1);

    if (!laptopResult.length) {
      return res.status(404).json({
        success: false,
        message: 'Laptop not found',
        errors: ['Selected laptop does not exist']
      });
    }

    const selectedLaptop = laptopResult[0];

    if (!selectedLaptop.isActive) {
      return res.status(409).json({
        success: false,
        message: 'Laptop unavailable',
        errors: ['Selected laptop is no longer available']
      });
    }

    if ((selectedLaptop.stockQuantity || 0) <= 0) {
      return res.status(409).json({
        success: false,
        message: 'Out of stock',
        errors: ['Selected laptop is currently out of stock']
      });
    }

    // Generate unique reference
    const reference = await generateApplicationReference();

    // Pricing from selected laptop
    const laptopPrice = Number(selectedLaptop.discountedPrice || selectedLaptop.originalPrice || 0);
    const commissionRate = 0.10; // 10%
    const commissionAmount = laptopPrice * commissionRate;
    const totalPrice = laptopPrice;

    // Create application in transaction
    const result = await db.transaction(async (tx) => {
      // Insert application
      const [newApplication] = await tx
        .insert(applications)
        .values({
          studentId: profile.id,
          laptopId,
          reference,
          name,
          level,
          course,
          address,
          phoneNumber,
          ghanaCardRef: ghanaCardNumber,
          admissionLetterRef: admissionLetterRef || null,
          totalPrice,
          commissionEarned: commissionAmount,
          status: 'PENDING_SRC',
        })
        .returning();

      // Create verification status
      await tx
        .insert(verificationStatuses)
        .values({
          applicationId: newApplication.id,
          ghanaCardNumber,
          frontImageHash: ghanaCardFrontHash,
          backImageHash: ghanaCardBackHash,
          selfieHash,
          status: 'PENDING',
        });

      // Create status history entry
      await tx
        .insert(applicationStatusHistory)
        .values({
          applicationId: newApplication.id,
          status: 'PENDING_SRC',
          changedBy: userId,
        });

      return newApplication;
    });

    logger.info(
      { applicationId: result.id, reference: result.reference },
      'Application created successfully'
    );

    // Audit log: Application submitted
    await auditLogService.logApplicationSubmitted(
      userId,
      result.id,
      result.reference,
      req.ip || req.connection.remoteAddress
    );

    // Send application submitted email (non-blocking)
    const studentUser = await db.select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (studentUser.length > 0) {
      sendApplicationSubmittedEmail(studentUser[0].email, {
        name,
        applicationRef: result.reference,
        submissionDate: new Date().toLocaleDateString('en-GB'),
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
      }).catch(error => {
        logger.error({ err: error, applicationId: result.id }, 'Failed to send application submitted email');
      });
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application: {
          id: result.id,
          reference: result.reference,
          status: result.status,
          totalPrice: result.totalPrice,
          createdAt: result.createdAt,
        }
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error creating application');
    res.status(500).json({
      success: false,
      message: 'Failed to create application',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/applications/my
 * Get all applications for the authenticated student
 */
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get student profile
    const studentProfile = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    if (!studentProfile || studentProfile.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        errors: ['No student profile']
      });
    }

    const profile = studentProfile[0];

    // Get all applications for this student with payment and delivery info
    const studentApplications = await db
      .select({
        id: applications.id,
        reference: applications.reference,
        status: applications.status,
        name: applications.name,
        level: applications.level,
        course: applications.course,
        totalPrice: applications.totalPrice,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        delivery: deliveries,
      })
      .from(applications)
      .leftJoin(deliveries, eq(deliveries.applicationId, applications.id))
      .where(eq(applications.studentId, profile.id))
      .orderBy(desc(applications.createdAt));

    // Get payments for all applications
    const applicationIds = studentApplications.map(app => app.id);
    const allPayments = applicationIds.length > 0 
      ? await db
          .select()
          .from(payments)
          .where(eq(payments.applicationId, applicationIds[0]))
      : [];

    // Map payments to applications
    const applicationsWithPayments = studentApplications.map(app => {
      const appPayments = allPayments.filter(p => p.applicationId === app.id);
      const initial70 = appPayments.find(p => p.type === 'INITIAL_70');
      const final30 = appPayments.find(p => p.type === 'FINAL_30');
      
      return {
        ...app,
        payments: {
          initial70: initial70 || null,
          final30: final30 || null
        }
      };
    });

    logger.info(
      { userId, studentId: profile.id, count: applicationsWithPayments.length },
      'Retrieved student applications'
    );

    res.json({
      success: true,
      message: 'Applications retrieved successfully',
      data: {
        applications: applicationsWithPayments,
        total: applicationsWithPayments.length
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching applications');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/applications/:id
 * Get a specific application by ID
 */
export const getApplicationById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Get student profile
    const studentProfile = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    if (!studentProfile || studentProfile.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
        errors: ['No student profile']
      });
    }

    const profile = studentProfile[0];

    // ✅ AUTHORIZATION: Verify student owns this application
    const access = await verifyStudentApplicationAccess(profile.id, id);
    if (!access.allowed) {
      logger.warn({ userId, applicationId: id }, 'Student unauthorized application access attempt');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: [access.error]
      });
    }

    // Get application with verification status, payments, and delivery
    const application = await db
      .select({
        application: applications,
        verification: verificationStatuses,
        delivery: deliveries,
      })
      .from(applications)
      .leftJoin(
        verificationStatuses,
        eq(verificationStatuses.applicationId, applications.id)
      )
      .leftJoin(
        deliveries,
        eq(deliveries.applicationId, applications.id)
      )
      .where(
        and(
          eq(applications.id, id),
          eq(applications.studentId, profile.id)
        )
      )
      .limit(1);

    if (!application || application.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        errors: ['Application does not exist or you do not have access']
      });
    }

    // Get payments for this application
    const appPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.applicationId, id));

    const initial70 = appPayments.find(p => p.type === 'INITIAL_70');
    const final30 = appPayments.find(p => p.type === 'FINAL_30');

    // Get status history
    const history = await db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, id))
      .orderBy(desc(applicationStatusHistory.timestamp));

    logger.info({ userId, applicationId: id }, 'Retrieved application details');

    res.json({
      success: true,
      message: 'Application retrieved successfully',
      data: {
        ...application[0].application,
        verification: application[0].verification,
        delivery: application[0].delivery,
        payments: {
          initial70: initial70 || null,
          final30: final30 || null
        },
        history
      }
    });
  } catch (error) {
    logger.error({ err: error, applicationId: req.params.id }, 'Error fetching application');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve application',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/applications/src/pending
 * SRC gets pending applications for their university
 */
export const getSRCPendingApplications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get SRC officer profile to find university
    const srcOfficer = await db
      .select()
      .from(srcOfficers)
      .where(eq(srcOfficers.userId, userId))
      .limit(1);

    if (!srcOfficer || srcOfficer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'SRC officer profile not found',
        errors: ['No SRC profile']
      });
    }

    const universityId = srcOfficer[0].universityId;

    // Get pending applications for this university
    const pendingApplications = await db
      .select({
        application: applications,
        student: studentProfiles,
        user: users,
      })
      .from(applications)
      .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .where(
        and(
          eq(studentProfiles.universityId, universityId),
          eq(applications.status, 'PENDING_SRC')
        )
      )
      .orderBy(desc(applications.createdAt));

    res.json({
      success: true,
      message: 'Pending applications retrieved',
      data: {
        applications: pendingApplications,
        total: pendingApplications.length
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching SRC pending applications');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      errors: [error.message]
    });
  }
};

/**
 * PUT /api/applications/:id/src-decision
 * SRC approves or rejects an application
 */
export const srcDecision = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { decision, notes = '' } = req.body; // decision: 'approve' or 'reject', notes: optional

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision',
        errors: ['Decision must be "approve" or "reject"']
      });
    }

    // ✅ AUTHORIZATION: Verify SRC can access this application (university-level check)
    const access = await verifySRCApplicationAccess(userId, id);
    if (!access.allowed) {
      logger.warn({ userId, applicationId: id }, 'SRC unauthorized application access attempt');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: [access.error]
      });
    }

    const newStatus = decision === 'approve' ? 'SRC_APPROVED' : 'SRC_REJECTED';

    // ✅ AUTHORIZATION: Validate status transition
    const currentApp = await db.select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);
    
    if (!currentApp.length) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        errors: ['Application does not exist']
      });
    }

    const validation = validateStatusTransition(currentApp[0].status, newStatus, req.user.role);
    if (!validation.valid) {
      logger.warn({ userId, applicationId: id, newStatus }, 'Invalid status transition attempt');
      return res.status(400).json({
        success: false,
        message: 'Invalid status transition',
        errors: [validation.error]
      });
    }

    // Update application status
    await db.update(applications)
      .set({ 
        status: newStatus,
        srcDecision: decision,
        srcDecidedBy: userId,
        srcDecisionDate: new Date()
      })
      .where(eq(applications.id, id));

    // Log the status transition
    await logStatusTransition(
      id,
      currentApp[0].status,
      newStatus,
      userId,
      { decision, role: req.user.role }
    );

    // Audit log: SRC decision
    await auditLogService.logSrcDecision(
      userId,
      id,
      currentApp[0].reference,
      decision === 'approve',
      notes,
      req.ip || req.connection.remoteAddress
    );

    // New comprehensive audit logging
    await logApplicationStatusChange({
      actorId: userId,
      actorRole: 'SRC',
      applicationId: id,
      oldStatus: currentApp[0].status,
      newStatus: newStatus,
      comment: notes,
    });

    // Send email notification to student (non-blocking)
    const studentWithUser = await db.select({ 
      studentEmail: users.email,
      studentName: studentProfiles.fullName 
    })
      .from(applications)
      .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .leftJoin(users, eq(studentProfiles.userId, users.id))
      .where(eq(applications.id, id))
      .limit(1);
    
    if (studentWithUser.length > 0 && studentWithUser[0].studentEmail) {
      if (decision === 'approve') {
        sendApplicationApprovedEmail(studentWithUser[0].studentEmail, {
          name: studentWithUser[0].studentName || 'Student',
          applicationRef: currentApp[0].reference,
          approvalDate: new Date().toLocaleDateString('en-GB'),
          laptopModel: 'Your selected laptop',
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
        }).catch(error => {
          logger.error({ err: error, applicationId: id }, 'Failed to send SRC approval email');
        });
      } else {
        sendApplicationRejectedEmail(studentWithUser[0].studentEmail, {
          name: studentWithUser[0].studentName || 'Student',
          applicationRef: currentApp[0].reference,
          decisionDate: new Date().toLocaleDateString('en-GB'),
          rejectionReason: notes || 'Your application did not meet SRC requirements.'
        }).catch(error => {
          logger.error({ err: error, applicationId: id }, 'Failed to send SRC rejection email');
        });
      }
    }

    logger.info(
      { userId, applicationId: id, decision: newStatus },
      'SRC decision recorded'
    );

    res.json({
      success: true,
      message: `Application ${decision}d successfully`,
      data: { status: newStatus }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error processing SRC decision');
    res.status(500).json({
      success: false,
      message: 'Failed to process decision',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/applications/admin/pending
 * Admin gets all SRC-approved applications pending admin review
 */
export const getAdminPendingApplications = async (req, res) => {
  try {
    const pendingApplications = await db
      .select({
        application: applications,
        student: studentProfiles,
        user: users,
        verification: verificationStatuses,
      })
      .from(applications)
      .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .leftJoin(verificationStatuses, eq(verificationStatuses.applicationId, applications.id))
      .where(eq(applications.status, 'SRC_APPROVED'))
      .orderBy(desc(applications.createdAt));

    res.json({
      success: true,
      message: 'Admin pending applications retrieved',
      data: {
        applications: pendingApplications,
        total: pendingApplications.length
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching admin pending applications');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      errors: [error.message]
    });
  }
};

/**
 * GET /api/applications/admin/all
 * Admin gets all applications with filters
 */
export const getAllApplications = async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;

    let query = db
      .select({
        application: applications,
        student: studentProfiles,
        user: users,
      })
      .from(applications)
      .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .innerJoin(users, eq(studentProfiles.userId, users.id))
      .orderBy(desc(applications.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (status) {
      query = query.where(eq(applications.status, status));
    }

    const allApplications = await query;

    res.json({
      success: true,
      message: 'All applications retrieved',
      data: {
        applications: allApplications,
        total: allApplications.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching all applications');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      errors: [error.message]
    });
  }
};

/**
 * PUT /api/applications/:id/admin-decision
 * Admin approves or rejects an application
 */
export const adminDecision = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { decision } = req.body; // decision: 'approve' or 'reject'

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid decision',
        errors: ['Decision must be "approve" or "reject"']
      });
    }

    const newStatus = decision === 'approve' ? 'ADMIN_APPROVED' : 'ADMIN_REJECTED';

    // ✅ BUSINESS RULE: Validate admin approval (includes SRC prerequisite + stock check)
    if (decision === 'approve') {
      const businessValidation = await validateAdminApproval(id);
      if (!businessValidation.valid) {
        logger.warn({ userId, applicationId: id, error: businessValidation.error }, 'Admin approval validation failed');
        return res.status(400).json({
          success: false,
          message: 'Cannot approve application',
          errors: [businessValidation.error]
        });
      }

      // Reserve laptop stock upon approval
      if (businessValidation.application.laptopId) {
        const stockReservation = await reserveLaptopStock(
          businessValidation.application.laptopId,
          id
        );
        if (!stockReservation.valid) {
          return res.status(400).json({
            success: false,
            message: 'Failed to reserve laptop stock',
            errors: [stockReservation.error]
          });
        }
        logger.info(
          { laptopId: businessValidation.application.laptopId, applicationId: id },
          'Laptop stock reserved for application'
        );
      }
    }

    // ✅ AUTHORIZATION: Validate status transition
    const currentApp = await db.select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);
    
    if (!currentApp.length) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        errors: ['Application does not exist']
      });
    }

    const validation = validateStatusTransition(currentApp[0].status, newStatus, req.user.role);
    if (!validation.valid) {
      logger.warn({ userId, applicationId: id, newStatus }, 'Invalid admin status transition');
      return res.status(400).json({
        success: false,
        message: 'Invalid status transition',
        errors: [validation.error]
      });
    }

    // Release stock if rejecting
    if (decision === 'reject' && currentApp[0].laptopId) {
      await releaseLaptopStock(currentApp[0].laptopId, id);
    }

    // Update application status
    await db.update(applications)
      .set({ 
        status: newStatus,
        adminDecision: decision,
        adminDecidedBy: userId,
        adminDecisionDate: new Date()
      })
      .where(eq(applications.id, id));

    // Log the status transition
    await logStatusTransition(
      id,
      currentApp[0].status,
      newStatus,
      userId,
      { decision, role: req.user.role }
    );

    // Audit log: Admin decision
    await auditLogService.logAdminDecision(
      userId,
      id,
      currentApp[0].reference,
      decision === 'approve',
      req.body.notes,
      req.ip || req.connection.remoteAddress
    );

    // New comprehensive audit logging
    await logApplicationStatusChange({
      actorId: userId,
      actorRole: 'ADMIN',
      applicationId: id,
      oldStatus: currentApp[0].status,
      newStatus: newStatus,
      comment: req.body.notes,
    });

    // Send email notification to student (non-blocking)
    const studentWithUser = await db.select({ 
      studentEmail: users.email,
      studentName: studentProfiles.fullName,
      laptopModel: laptops.model
    })
      .from(applications)
      .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .leftJoin(users, eq(studentProfiles.userId, users.id))
      .leftJoin(laptops, eq(applications.laptopId, laptops.id))
      .where(eq(applications.id, id))
      .limit(1);
    
    if (studentWithUser.length > 0 && studentWithUser[0].studentEmail) {
      if (decision === 'approve') {
        sendApplicationApprovedEmail(studentWithUser[0].studentEmail, {
          name: studentWithUser[0].studentName || 'Student',
          applicationRef: currentApp[0].reference,
          approvalDate: new Date().toLocaleDateString('en-GB'),
          laptopModel: studentWithUser[0].laptopModel || 'Your selected laptop',
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
        }).catch(error => {
          logger.error({ err: error, applicationId: id }, 'Failed to send admin approval email');
        });
      } else {
        sendApplicationRejectedEmail(studentWithUser[0].studentEmail, {
          name: studentWithUser[0].studentName || 'Student',
          applicationRef: currentApp[0].reference,
          decisionDate: new Date().toLocaleDateString('en-GB'),
          rejectionReason: req.body.notes || 'Your application did not meet admin requirements.'
        }).catch(error => {
          logger.error({ err: error, applicationId: id }, 'Failed to send admin rejection email');
        });
      }
    }

    logger.info(
      { userId, applicationId: id, decision: newStatus },
      'Admin decision recorded'
    );

    // Fetch updated application
    const updatedApp = await db.select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    res.json({
      success: true,
      message: `Application ${decision}d successfully`,
      data: { application: updatedApp[0] }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error processing admin decision');
    res.status(500).json({
      success: false,
      message: 'Failed to process decision',
      errors: [error.message]
    });
  }
};

/**
 * PUT /api/applications/:id/verification
 * Admin updates verification status
 */
export const updateVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, flaggedFraud, fraudReason } = req.body;

    const validStatuses = ['PENDING', 'VERIFIED', 'FLAGGED', 'ESCALATED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification status',
        errors: ['Status must be one of: ' + validStatuses.join(', ')]
      });
    }

    await db
      .update(verificationStatuses)
      .set({
        status,
        flaggedFraud: flaggedFraud || false,
        fraudReason: fraudReason || null,
        reviewedBy: req.user.email,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationStatuses.applicationId, id));

    logger.info(
      { userId, applicationId: id, verificationStatus: status },
      'Verification status updated'
    );

    res.json({
      success: true,
      message: 'Verification status updated successfully',
      data: { status }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating verification status');
    res.status(500).json({
      success: false,
      message: 'Failed to update verification status',
      errors: [error.message]
    });
  }
};

/**
 * PATCH /api/applications/:id/laptop
 * Student updates laptop choice before SRC review
 */
export const updateApplicationLaptop = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { laptopId } = req.body;

    logger.info({ userId, applicationId: id, laptopId }, 'Updating application laptop');

    // Validate laptop ID
    if (!laptopId) {
      return res.status(400).json({
        success: false,
        message: 'Laptop ID is required',
        errors: ['laptopId is required']
      });
    }

    // Get the application
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .execute();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        errors: ['Application does not exist']
      });
    }

    // Check ownership
    const [studentProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .execute();

    if (!studentProfile || application.studentId !== studentProfile.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['You can only update your own applications']
      });
    }

    // ✅ BUSINESS RULE: Validate laptop can be changed (before admin approval)
    const updateValidation = await validateApplicationUpdate(id, req.user.role, 'laptop_change');
    if (!updateValidation.valid) {
      logger.warn({ userId, applicationId: id }, 'Laptop update validation failed');
      return res.status(400).json({
        success: false,
        message: 'Cannot update laptop',
        errors: [updateValidation.error]
      });
    }

    // Check if application is still PENDING_SRC (editable)
    if (updateValidation.application.status !== 'PENDING_SRC') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update laptop',
        errors: ['Application has already been reviewed and cannot be edited']
      });
    }

    // Update the application with new laptop
    await db
      .update(applications)
      .set({
        laptopId,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id));

    logger.info(
      { userId, applicationId: id, laptopId },
      'Application laptop updated successfully'
    );

    res.json({
      success: true,
      message: 'Laptop choice updated successfully',
      data: { laptopId }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating application laptop');
    res.status(500).json({
      success: false,
      message: 'Failed to update laptop choice',
      errors: [error.message]
    });
  }
};

/**
 * PATCH /api/applications/:id
 * Student updates their application (only allowed before SRC review)
 */
export const updateApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updates = req.body;

    // Get application
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .execute();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        errors: ['Application does not exist']
      });
    }

    // Check ownership
    const [studentProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .execute();

    if (!studentProfile || application.studentId !== studentProfile.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['You can only update your own applications']
      });
    }

    // ✅ BUSINESS RULE: Validate application can be edited (not locked)
    const updateValidation = await validateApplicationUpdate(id, req.user.role, 'personal_info');
    if (!updateValidation.valid) {
      logger.warn({ userId, applicationId: id }, 'Application update validation failed');
      return res.status(400).json({
        success: false,
        message: 'Cannot update application',
        errors: [updateValidation.error]
      });
    }

    // Check if application is still PENDING_SRC (editable)
    if (updateValidation.application.status !== 'PENDING_SRC') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update application',
        errors: ['Application can only be edited or withdrawn before SRC review starts']
      });
    }

    // Only allow updating specific fields
    const allowedFields = ['name', 'phoneNumber', 'address', 'level', 'course'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        errors: ['Provide at least one field to update']
      });
    }

    // Update the application
    updateData.updatedAt = new Date();
    
    await db
      .update(applications)
      .set(updateData)
      .where(eq(applications.id, id));

    // Get updated application
    const [updatedApplication] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .execute();

    logger.info(
      { userId, applicationId: id, updates: updateData },
      'Application updated successfully'
    );

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: { application: updatedApplication }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error updating application');
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      errors: [error.message]
    });
  }
};

/**
 * POST /api/applications/:id/withdraw
 * Student withdraws their application (only allowed before SRC review)
 */
export const withdrawApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { reason } = req.body;

    // Get application
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .execute();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        errors: ['Application does not exist']
      });
    }

    // Check ownership
    const [studentProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .execute();

    if (!studentProfile || application.studentId !== studentProfile.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        errors: ['You can only withdraw your own applications']
      });
    }

    // ✅ BUSINESS RULE: Validate withdrawal eligibility (not delivered)
    const withdrawalValidation = await validateWithdrawalEligibility(id);
    if (!withdrawalValidation.valid) {
      logger.warn({ userId, applicationId: id }, 'Withdrawal validation failed');
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application',
        errors: [withdrawalValidation.error]
      });
    }

    // Check if application is still PENDING_SRC (withdrawable)
    if (withdrawalValidation.application.status !== 'PENDING_SRC') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw application',
        errors: ['Application can only be edited or withdrawn before SRC review starts']
      });
    }

    // Update status to WITHDRAWN
    await db
      .update(applications)
      .set({
        status: 'WITHDRAWN',
        srcNotes: reason || 'Withdrawn by student',
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id));

    // Log status change
    await db.insert(applicationStatusHistory).values({
      applicationId: id,
      oldStatus: application.status,
      newStatus: 'WITHDRAWN',
      changedBy: userId,
      reason: reason || 'Withdrawn by student'
    });

    // Get updated application
    const [withdrawnApplication] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .execute();

    logger.info(
      { userId, applicationId: id, reason },
      'Application withdrawn successfully'
    );

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: { application: withdrawnApplication }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error withdrawing application');
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw application',
      errors: [error.message]
    });
  }
};

/**
 * POST /api/applications/:id/assign-delivery
 * Admin assigns delivery for an approved application
 */
export const assignDelivery = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { staffName, deliveryDate, location } = req.body;

    // Validate required fields
    if (!staffName || !deliveryDate || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        errors: ['staffName, deliveryDate, and location are required']
      });
    }

    // Get application and verify it's admin approved
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .execute();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        errors: ['Application does not exist']
      });
    }

    if (application.status !== 'ADMIN_APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign delivery',
        errors: ['Application must be admin approved before delivery assignment']
      });
    }

    // Check if delivery already assigned
    const existingDelivery = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.applicationId, id))
      .limit(1);

    if (existingDelivery.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Delivery already assigned',
        errors: ['This application already has a delivery assignment']
      });
    }

    // Create delivery assignment
    const [delivery] = await db
      .insert(deliveries)
      .values({
        applicationId: id,
        staffName,
        deliveryDate: new Date(deliveryDate),
        location,
        delivered: false,
        paymentConfirmed: false
      })
      .returning();

    // Update application status
    await db
      .update(applications)
      .set({ 
        status: 'DELIVERY_ASSIGNED',
        updatedAt: new Date()
      })
      .where(eq(applications.id, id));

    // Log status transition
    await logStatusTransition(
      id,
      application.status,
      'DELIVERY_ASSIGNED',
      userId,
      { staffName, deliveryDate, location }
    );

    // Audit log: Delivery assigned
    await auditLogService.logDeliveryAssignment(
      userId,
      id,
      application.reference,
      staffName,
      req.ip || req.connection.remoteAddress
    );

    // New comprehensive audit logging
    await logDelivery({
      actorId: userId,
      actorRole: 'ADMIN',
      applicationId: id,
      deliveredBy: staffName,
      status: 'ASSIGNED',
    });

    // Send delivery scheduled email to student (non-blocking)
    const studentWithUser = await db.select({ 
      studentEmail: users.email,
      studentName: studentProfiles.fullName 
    })
      .from(applications)
      .leftJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .leftJoin(users, eq(studentProfiles.userId, users.id))
      .where(eq(applications.id, id))
      .limit(1);
    
    if (studentWithUser.length > 0 && studentWithUser[0].studentEmail) {
      const deliveryDateObj = new Date(deliveryDate);
      sendDeliveryScheduledEmail(studentWithUser[0].studentEmail, {
        name: studentWithUser[0].studentName || 'Student',
        applicationRef: application.reference,
        deliveryDate: deliveryDateObj.toLocaleDateString('en-GB'),
        deliveryTimeWindow: '9:00 AM - 5:00 PM',
        agentName: staffName,
        location,
        agentPhone: process.env.DELIVERY_CONTACT_PHONE || 'Contact admin',
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`
      }).catch(error => {
        logger.error({ err: error, applicationId: id }, 'Failed to send delivery scheduled email');
      });
    }

    logger.info(
      { applicationId: id, deliveryId: delivery.id, staffName },
      'Delivery assigned successfully'
    );

    res.json({
      success: true,
      message: 'Delivery assigned successfully',
      data: { delivery }
    });
  } catch (error) {
    logger.error({ err: error }, 'Error assigning delivery');
    res.status(500).json({
      success: false,
      message: 'Failed to assign delivery',
      errors: [error.message]
    });
  }
};
