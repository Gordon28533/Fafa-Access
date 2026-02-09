// srcRevenueController.js
// SRC revenue visibility endpoints

import { prisma } from '../utils/prismaClient.js';
import { verifySRCUniversityAccess } from '../middleware/authorizationHelpers.js';

/**
 * GET /src/revenue/summary
 * Get revenue summary for SRC's university or all universities (admin)
 * 
 * Access Control:
 * - SRC: sees only their university (enforced via authorizationHelpers)
 * - Admin: sees all universities or specific university via query param
 */
export async function getRevenueSummary(req, res) {
  try {
    let universityId = null;

    // Access control: SRC sees only their university
    if (req.user.role === 'SRC') {
      const srcOfficer = await prisma.sRCOfficer.findUnique({
        where: { userId: req.user.userId },
        include: { university: true }
      });

      if (!srcOfficer) {
        return res.status(404).json({ error: 'SRC officer profile not found' });
      }

      universityId = srcOfficer.universityId;

      // ✅ AUTHORIZATION: If query param provided, validate SRC can access it
      if (req.query.universityId && req.query.universityId !== universityId) {
        const access = await verifySRCUniversityAccess(req.user.userId, req.query.universityId);
        if (!access.allowed) {
          return res.status(403).json({ 
            error: access.error || 'Not authorized to access this university' 
          });
        }
      }
    } else if (req.user.role === 'ADMIN') {
      // Admin can filter by universityId query param
      universityId = req.query.universityId || null;
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch wallet data
    const wallets = universityId 
      ? await prisma.universityWallet.findMany({
          where: { universityId },
          include: { university: true }
        })
      : await prisma.universityWallet.findMany({
          include: { university: true }
        });

    // Fetch commission records for detailed stats
    const commissionRecords = universityId
      ? await prisma.sRCCommissionRecord.findMany({
          where: { universityId }
        })
      : await prisma.sRCCommissionRecord.findMany();

    // Calculate summary statistics
    const summary = {
      universities: wallets.map(wallet => ({
        universityId: wallet.universityId,
        universityName: wallet.university.name,
        commissionRate: wallet.university.commissionRate,
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalPaid: wallet.totalPaid,
        earnedCommissions: wallet.earnedCommissions,
        pendingCommissions: wallet.pendingCommissions,
        lastPayoutDate: wallet.lastPayoutDate,
        lastPayoutAmount: wallet.lastPayoutAmount
      })),
      overall: {
        totalEarned: wallets.reduce((sum, w) => sum + w.totalEarned, 0),
        totalPaid: wallets.reduce((sum, w) => sum + w.totalPaid, 0),
        earnedCommissions: wallets.reduce((sum, w) => sum + w.earnedCommissions, 0),
        pendingCommissions: wallets.reduce((sum, w) => sum + w.pendingCommissions, 0),
        totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0)
      },
      commissionStats: {
        totalRecords: commissionRecords.length,
        pending: commissionRecords.filter(r => r.status === 'PENDING').length,
        earned: commissionRecords.filter(r => r.status === 'EARNED').length,
        paid: commissionRecords.filter(r => r.status === 'PAID').length,
        cancelled: commissionRecords.filter(r => r.status === 'CANCELLED').length
      }
    };

    return res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('[SRC REVENUE] Error fetching summary:', error);
    return res.status(500).json({ error: 'Failed to fetch revenue summary' });
  }
}

/**
 * GET /src/revenue/applications
 * Get per-application commission breakdown
 * 
 * Access Control:
 * - SRC: sees only their university's applications
 * - Admin: sees all or filtered by universityId
 */
export async function getRevenueApplications(req, res) {
  try {
    let universityId = null;

    // Access control: SRC sees only their university
    if (req.user.role === 'SRC') {
      const srcOfficer = await prisma.sRCOfficer.findUnique({
        where: { userId: req.user.userId }
      });

      if (!srcOfficer) {
        return res.status(404).json({ error: 'SRC officer profile not found' });
      }

      universityId = srcOfficer.universityId;
    } else if (req.user.role === 'ADMIN') {
      universityId = req.query.universityId || null;
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Query parameters for filtering
    const { status, limit, offset } = req.query;
    const limitNum = parseInt(limit) || 50;
    const offsetNum = parseInt(offset) || 0;

    // Build where clause
    const where = universityId ? { universityId } : {};
    if (status) {
      where.status = status;
    }

    // Fetch commission records with application details
    const commissionRecords = await prisma.sRCCommissionRecord.findMany({
      where,
      include: {
        application: {
          include: {
            student: {
              select: {
                fullName: true,
                phoneNumber: true
              }
            },
            delivery: {
              select: {
                deliveryDate: true,
                staffName: true,
                location: true
              }
            }
          }
        },
        srcOfficer: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        },
        university: {
          select: {
            name: true,
            commissionRate: true
          }
        }
      },
      orderBy: { earnedAt: 'desc' },
      take: limitNum,
      skip: offsetNum
    });

    // Get total count for pagination
    const totalCount = await prisma.sRCCommissionRecord.count({ where });

    // Format response
    const applications = commissionRecords.map(record => ({
      id: record.id,
      applicationId: record.applicationId,
      applicationRef: record.applicationRef,
      studentName: record.application?.name || 'N/A',
      studentPhone: record.application?.student?.phoneNumber || 'N/A',
      universityName: record.university.name,
      srcOfficer: record.srcOfficer ? {
        email: record.srcOfficer.user.email,
        position: record.srcOfficer.position
      } : null,
      laptopPrice: record.laptopPrice,
      commissionRate: record.commissionRate,
      commissionAmount: record.commissionAmount,
      status: record.status,
      earnedAt: record.earnedAt,
      paidAt: record.paidAt,
      deliveryInfo: record.application?.delivery ? {
        date: record.application.delivery.deliveryDate,
        location: record.application.delivery.location,
        staff: record.application.delivery.staffName
      } : null,
      notes: record.notes
    }));

    return res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total: totalCount,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < totalCount
        }
      }
    });

  } catch (error) {
    console.error('[SRC REVENUE] Error fetching applications:', error);
    return res.status(500).json({ error: 'Failed to fetch revenue applications' });
  }
}

/**
 * GET /src/revenue/payouts
 * Get payout history for SRC's university
 * 
 * Access Control:
 * - SRC: sees only their university's payouts
 * - Admin: sees all or filtered by universityId
 */
export async function getRevenuePayouts(req, res) {
  try {
    let universityId = null;

    // Access control: SRC sees only their university
    if (req.user.role === 'SRC') {
      const srcOfficer = await prisma.sRCOfficer.findUnique({
        where: { userId: req.user.userId }
      });

      if (!srcOfficer) {
        return res.status(404).json({ error: 'SRC officer profile not found' });
      }

      universityId = srcOfficer.universityId;
    } else if (req.user.role === 'ADMIN') {
      universityId = req.query.universityId || null;
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Query parameters
    const { status, limit, offset } = req.query;
    const limitNum = parseInt(limit) || 20;
    const offsetNum = parseInt(offset) || 0;

    // Build where clause
    const where = universityId ? { universityId } : {};
    if (status) {
      where.status = status;
    }

    // Fetch payouts with details
    const payouts = await prisma.sRCPayout.findMany({
      where,
      include: {
        university: {
          select: {
            name: true,
            commissionRate: true
          }
        },
        commissionRecords: {
          select: {
            id: true,
            applicationRef: true,
            commissionAmount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: offsetNum
    });

    // Get total count
    const totalCount = await prisma.sRCPayout.count({ where });

    // Format response
    const payoutList = payouts.map(payout => ({
      id: payout.id,
      payoutRef: payout.payoutRef,
      universityName: payout.university.name,
      totalAmount: payout.totalAmount,
      commissionCount: payout.commissionCount,
      status: payout.status,
      paymentMethod: payout.paymentMethod,
      paymentReference: payout.paymentReference,
      scheduledDate: payout.scheduledDate,
      processedDate: payout.processedDate,
      processedBy: payout.processedBy,
      notes: payout.notes,
      createdAt: payout.createdAt,
      applications: payout.commissionRecords.map(r => ({
        ref: r.applicationRef,
        amount: r.commissionAmount
      }))
    }));

    return res.json({
      success: true,
      data: {
        payouts: payoutList,
        pagination: {
          total: totalCount,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < totalCount
        }
      }
    });

  } catch (error) {
    console.error('[SRC REVENUE] Error fetching payouts:', error);
    return res.status(500).json({ error: 'Failed to fetch revenue payouts' });
  }
}
