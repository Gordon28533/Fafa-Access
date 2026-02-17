// commissionController.js
// Handles SRC commission management endpoints

import { prisma } from '../utils/prismaClient.js';
import { 
  getUnpaidCommissions, 
  markCommissionAsPaid, 
  createPayout, 
  processPayout,
  markCommissionsReady 
} from '../utils/commissionCalculator.js';
import { 
  manualCommissionTrigger, 
  getCommissionStatus 
} from '../services/commissionTriggerService.js';
import { logAudit } from '../utils/auditLogger.js';
import * as adminNotifications from '../services/adminNotificationTriggers.js';

async function resolveScopedUniversityId(req) {
  if (req.user.role === 'ADMIN') {
    return req.query.universityId || null;
  }
  if (req.user.role === 'SRC') {
    const srcOfficer = await prisma.sRCOfficer.findUnique({
      where: { userId: req.user.userId }
    });
    return srcOfficer?.universityId || null;
  }
  return null;
}

// GET /commissions/unpaid/:universityId
// Get all unpaid commissions for a university (Admin or SRC access)
export async function getUnpaidCommissionsForUniversity(req, res) {
  const { universityId } = req.params;
  
  // Authorization: Admin or SRC from the same university
  if (req.user.role !== 'ADMIN') {
    if (req.user.role !== 'SRC') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Verify SRC is from this university
    const srcOfficer = await prisma.sRCOfficer.findUnique({
      where: { userId: req.user.userId }
    });
    if (!srcOfficer || srcOfficer.universityId !== universityId) {
      return res.status(403).json({ error: 'Forbidden: Not authorized for this university' });
    }
  }

  const result = await getUnpaidCommissions(universityId);
  return res.json({
    success: true,
    data: result
  });
}

// GET /commissions/summary
// Get commission summary for SRC officer's university
export async function getMyCommissionSummary(req, res) {
  if (req.user.role !== 'SRC') {
    return res.status(403).json({ error: 'Forbidden: SRC access only' });
  }

  const srcOfficer = await prisma.sRCOfficer.findUnique({
    where: { userId: req.user.userId },
    include: { university: true }
  });

  if (!srcOfficer) {
    return res.status(404).json({ error: 'SRC officer profile not found' });
  }

  const unpaid = await getUnpaidCommissions(srcOfficer.universityId);
  
  // Get paid commissions
  const paidApplications = await prisma.application.findMany({
    where: {
      student: { universityId: srcOfficer.universityId },
      commissionEarned: { gt: 0 },
      commissionPaid: true
    }
  });

  const totalPaid = paidApplications.reduce((sum, app) => sum + app.commissionEarned, 0);

  return res.json({
    success: true,
    data: {
      university: {
        id: srcOfficer.university.id,
        name: srcOfficer.university.name,
        commissionRate: srcOfficer.university.commissionRate
      },
      unpaid: {
        total: unpaid.totalCommission,
        count: unpaid.applicationCount,
        applications: unpaid.applications
      },
      paid: {
        total: totalPaid,
        count: paidApplications.length
      },
      overall: {
        totalEarned: unpaid.totalCommission + totalPaid,
        totalApplications: unpaid.applicationCount + paidApplications.length
      }
    }
  });
}

// POST /commissions/mark-paid/:applicationId
// Mark commission as paid (Admin only)
export async function markCommissionPaid(req, res) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }

  const { applicationId } = req.params;

  const application = await prisma.application.findUnique({
    where: { id: applicationId }
  });

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (application.commissionEarned <= 0) {
    return res.status(400).json({ error: 'No commission earned for this application' });
  }

  if (application.commissionPaid) {
    return res.status(400).json({ error: 'Commission already marked as paid' });
  }

  const success = await markCommissionAsPaid({ applicationId });

  if (success) {
    return res.json({
      success: true,
      message: 'Commission marked as paid',
      data: {
        applicationId,
        commissionAmount: application.commissionEarned
      }
    });
  } else {
    return res.status(500).json({ error: 'Failed to mark commission as paid' });
  }
}

// POST /commissions/ready - Admin marks commissions READY_FOR_PAYOUT (batch)
export async function markCommissionsReadyForPayout(req, res) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }

  const { commissionRecordIds, note } = req.body;

  const result = await markCommissionsReady(commissionRecordIds, req.user.userId, note);

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.message });
  }

  return res.json({
    success: true,
    message: 'Commissions marked READY_FOR_PAYOUT',
    data: result
  });
}

// GET /commissions/report
// Get comprehensive commission report (Admin only)
export async function getCommissionReport(req, res) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }

  const universities = await prisma.university.findMany({
    include: {
      students: {
        include: {
          applications: {
            where: {
              commissionEarned: { gt: 0 }
            }
          }
        }
      }
    }
  });

  const report = universities.map(university => {
    const allApplications = university.students.flatMap(student => student.applications);
    const unpaid = allApplications.filter(app => !app.commissionPaid);
    const paid = allApplications.filter(app => app.commissionPaid);

    return {
      universityId: university.id,
      universityName: university.name,
      commissionRate: university.commissionRate,
      unpaid: {
        total: unpaid.reduce((sum, app) => sum + app.commissionEarned, 0),
        count: unpaid.length
      },
      paid: {
        total: paid.reduce((sum, app) => sum + app.commissionEarned, 0),
        count: paid.length
      },
      overall: {
        total: allApplications.reduce((sum, app) => sum + app.commissionEarned, 0),
        count: allApplications.length
      }
    };
  });

  return res.json({
    success: true,
    data: {
      universities: report,
      summary: {
        totalUnpaid: report.reduce((sum, uni) => sum + uni.unpaid.total, 0),
        totalPaid: report.reduce((sum, uni) => sum + uni.paid.total, 0),
        totalEarned: report.reduce((sum, uni) => sum + uni.overall.total, 0)
      }
    }
  });
}

// POST /commissions/payout/create
// Create a payout batch (Admin only)
export async function createPayoutBatch(req, res) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }

  const { universityId, commissionRecordIds, payoutDetails } = req.body;

  if (!universityId || !commissionRecordIds || commissionRecordIds.length === 0) {
    return res.status(400).json({ error: 'University ID and commission record IDs required' });
  }

  const payout = await createPayout(universityId, commissionRecordIds, payoutDetails);

  if (payout) {
    return res.status(201).json({
      success: true,
      message: 'Payout batch created',
      data: payout
    });
  } else {
    return res.status(500).json({ error: 'Failed to create payout' });
  }
}

// POST /commissions/payout/process/:payoutId
// Process a payout (mark as completed) (Admin only)
export async function processPayoutBatch(req, res) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }

  const { payoutId } = req.params;
  const { paymentReference } = req.body;

  if (!paymentReference) {
    return res.status(400).json({ error: 'Payment reference required' });
  }

  const success = await processPayout(payoutId, req.user.userId, paymentReference);

  if (success) {
    // Send notification about payout
    try {
      const payout = await prisma.sRCPayout.findUnique({
        where: { id: payoutId },
        include: { 
          commissionRecords: {
            include: { application: true }
          },
          university: true
        }
      });

      if (payout && payout.commissionRecords.length > 0) {
        const totalAmount = payout.commissionRecords.reduce((sum, r) => sum + r.commissionAmount, 0);
        
        // Send one notification per application in this payout batch
        for (const record of payout.commissionRecords.slice(0, 1)) {
          if (record.application) {
            await adminNotifications.notifyAdminPayoutCompleted({
              studentName: record.application.name,
              applicationRef: record.application.reference,
              amount: `GHS ${totalAmount.toFixed(2)}`,
              method: payout.paymentMethod || 'Bank Transfer',
            });
          }
        }
      }
    } catch (notifyError) {
      console.error('[COMMISSION] Payout notification error:', notifyError);
    }

    return res.json({
      success: true,
      message: 'Payout processed successfully'
    });
  } else {
    return res.status(500).json({ error: 'Failed to process payout' });
  }
}

// GET /commissions/wallet/:universityId
// Get university wallet details (Admin or SRC access)
export async function getUniversityWallet(req, res) {
  const { universityId } = req.params;

  // Authorization: Admin or SRC from the same university
  if (req.user.role !== 'ADMIN') {
    if (req.user.role !== 'SRC') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const srcOfficer = await prisma.sRCOfficer.findUnique({
      where: { userId: req.user.userId }
    });
    if (!srcOfficer || srcOfficer.universityId !== universityId) {
      return res.status(403).json({ error: 'Forbidden: Not authorized for this university' });
    }
  }

  const wallet = await prisma.universityWallet.findUnique({
    where: { universityId },
    include: {
      university: {
        select: {
          id: true,
          name: true,
          commissionRate: true
        }
      }
    }
  });

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  return res.json({
    success: true,
    data: wallet
  });
}

// GET /commissions/payouts/:universityId
// Get all payouts for a university (Admin or SRC access)
export async function getUniversityPayouts(req, res) {
  const { universityId } = req.params;

  // Authorization: Admin or SRC from the same university
  if (req.user.role !== 'ADMIN') {
    if (req.user.role !== 'SRC') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const srcOfficer = await prisma.sRCOfficer.findUnique({
      where: { userId: req.user.userId }
    });
    if (!srcOfficer || srcOfficer.universityId !== universityId) {
      return res.status(403).json({ error: 'Forbidden: Not authorized for this university' });
    }
  }

  const payouts = await prisma.sRCPayout.findMany({
    where: { universityId },
    include: {
      commissionRecords: {
        select: {
          id: true,
          applicationRef: true,
          commissionAmount: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json({
    success: true,
    data: payouts
  });
}

// POST /commissions/trigger/:applicationId - Manually trigger commission calculation (Admin only)
export async function triggerCommissionManually(req, res) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access only' });
  }

  const { applicationId } = req.params;
  const { reason } = req.body;

  const result = await manualCommissionTrigger(
    applicationId, 
    req.user.userId,
    reason || 'Manual trigger by admin'
  );

  if (result.success) {
    return res.json({
      success: true,
      message: result.message,
      data: result.commission
    });
  } else {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }
}

// GET /commissions/status/:applicationId - Get commission status for an application
export async function getCommissionStatusForApplication(req, res) {
  const { applicationId } = req.params;

  // Authorization check
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SRC') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const status = await getCommissionStatus(applicationId);

  if (!status.found) {
    return res.status(404).json({ error: 'Application not found' });
  }

  return res.json({
    success: true,
    data: status
  });
}

// GET /commissions/export/csv - Export commission records with delivery/payment transparency
export async function exportCommissionsCSV(req, res) {
  // Admin can export all; SRC limited to their university
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SRC') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const universityId = await resolveScopedUniversityId(req);

  const records = await prisma.sRCCommissionRecord.findMany({
    where: universityId ? { universityId } : {},
    include: {
      application: {
        include: {
          delivery: true,
          payments: {
            where: { type: 'INITIAL_70' }
          }
        }
      }
    },
    orderBy: { earnedAt: 'desc' }
  });

  const headers = [
    'applicationRef',
    'commissionAmount',
    'commissionRate',
    'status',
    'earnedAt',
    'paidAt',
    'deliveryConfirmed',
    'paymentCollected',
    'universityId'
  ];

  const csvRows = [headers.join(',')];
  for (const r of records) {
    const deliveryConfirmed = r.application?.delivery?.delivered ? 'yes' : 'no';
    const paymentCollected = (r.application?.delivery?.paymentConfirmed || (r.application?.payments?.[0]?.status === 'COLLECTED')) ? 'yes' : 'no';
    const row = [
      r.applicationRef,
      r.commissionAmount,
      r.commissionRate,
      r.status,
      r.earnedAt ? new Date(r.earnedAt).toISOString() : '',
      r.paidAt ? new Date(r.paidAt).toISOString() : '',
      deliveryConfirmed,
      paymentCollected,
      r.universityId
    ].map(v => typeof v === 'string' ? `"${String(v).replace(/"/g, '""')}"` : v);
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="commissions.csv"');

  // Audit export for traceability
  await logAudit({
    action: 'COMMISSIONS_EXPORTED_CSV',
    actorId: req.user.userId,
    actorRole: req.user.role,
    applicationId: null,
    oldStatus: 'N/A',
    newStatus: 'N/A',
    details: `CSV export count=${records.length} scopedUniversity=${universityId || 'ALL'}`
  });

  return res.send(csv);
}

// GET /commissions/export/pdf - Placeholder/stub for PDF export
export async function exportCommissionsPDF(req, res) {
  // Placeholder: Provide data; PDF rendering can be added with a lib (e.g., pdfkit)
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SRC') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const universityId = await resolveScopedUniversityId(req);
  const records = await prisma.sRCCommissionRecord.findMany({
    where: universityId ? { universityId } : {},
    include: {
      application: {
        include: {
          delivery: true,
          payments: {
            where: { type: 'INITIAL_70' }
          }
        }
      }
    },
    orderBy: { earnedAt: 'desc' }
  });

  await logAudit({
    action: 'COMMISSIONS_EXPORTED_PDF_STUB',
    actorId: req.user.userId,
    actorRole: req.user.role,
    applicationId: null,
    oldStatus: 'N/A',
    newStatus: 'N/A',
    details: `PDF export stub count=${records.length} scopedUniversity=${universityId || 'ALL'}`
  });

  return res.json({
    success: true,
    message: 'PDF export not implemented; returning data payload',
    data: records
  });
}
