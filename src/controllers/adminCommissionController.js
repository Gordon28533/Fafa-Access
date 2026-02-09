// adminCommissionController.js
// Admin oversight for SRC commission settings and payout controls

import { prisma } from '../utils/prismaClient.js';
import { logAudit } from '../utils/auditLogger.js';

// GET /admin/commission/earnings
// Admin: view SRC earnings per university optionally filter by universityId)
export async function getEarningsPerUniversity(req, res) {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const { universityId } = req.query;

  try {
    const wallets = await prisma.universityWallet.findMany({
      where: universityId ? { universityId } : {},
      include: {
        university: true
      }
    });

    // Aggregate commission records for quick counts
    const commissions = await prisma.sRCCommissionRecord.groupBy({
      by: ['universityId', 'status'],
      _sum: { commissionAmount: true },
      _count: { commissionAmount: true },
      where: universityId ? { universityId } : {}
    });

    const buildStats = (uniId) => {
      const filtered = commissions.filter(c => c.universityId === uniId);
      const sumByStatus = (status) => filtered
        .filter(f => f.status === status)
        .reduce((s, f) => s + (f._sum.commissionAmount || 0), 0);
      const countByStatus = (status) => filtered
        .filter(f => f.status === status)
        .reduce((s, f) => s + (f._count.commissionAmount || 0), 0);
      return {
        totalEarned: sumByStatus('EARNED') + sumByStatus('PAID'),
        paid: sumByStatus('PAID'),
        pending: sumByStatus('PENDING') + sumByStatus('EARNED'),
        recordCounts: {
          paid: countByStatus('PAID'),
          earned: countByStatus('EARNED'),
          pending: countByStatus('PENDING'),
          cancelled: countByStatus('CANCELLED')
        }
      };
    };

    const data = wallets.map(w => ({
      universityId: w.universityId,
      universityName: w.university.name,
      commissionRate: w.university.commissionRate,
      balance: w.balance,
      totalEarned: w.totalEarned,
      totalPaid: w.totalPaid,
      earnedCommissions: w.earnedCommissions,
      pendingCommissions: w.pendingCommissions,
      payoutsFrozen: w.payoutsFrozen,
      freezeReason: w.freezeReason,
      frozenAt: w.frozenAt,
      stats: buildStats(w.universityId)
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('[ADMIN COMMISSION] Error fetching earnings:', error);
    return res.status(500).json({ error: 'Failed to fetch earnings' });
  }
}

// POST /admin/commission/rate
// Admin: set a new commission rate (future-only). Does not alter historical data.
export async function setCommissionRate(req, res) {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const { universityId, commissionRate, effectiveFrom } = req.body;
  if (!universityId) return res.status(400).json({ error: 'universityId is required' });
  if (commissionRate === undefined || commissionRate === null) return res.status(400).json({ error: 'commissionRate is required' });

  const rate = Number(commissionRate);
  if (Number.isNaN(rate) || rate < 0 || rate > 0.5) {
    return res.status(400).json({ error: 'commissionRate must be between 0 and 0.5 (0% - 50%)' });
  }

  const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();
  const now = new Date();
  if (Number.isNaN(effectiveDate.getTime()) || effectiveDate < new Date(now.getTime() - 60_000)) {
    return res.status(400).json({ error: 'effectiveFrom must be now or a future time' });
  }

  try {
    // Verify university exists
    const uni = await prisma.university.findUnique({ where: { id: universityId } });
    if (!uni) return res.status(404).json({ error: 'University not found' });

    await prisma.$transaction(async (tx) => {
      // Close existing active configs
      await tx.sRCCommissionConfig.updateMany({
        where: { universityId, isActive: true, effectiveTo: null },
        data: { isActive: false, effectiveTo: effectiveDate }
      });

      // Insert new config (future-only)
      await tx.sRCCommissionConfig.create({
        data: {
          universityId,
          commissionRate: rate,
          isActive: true,
          effectiveFrom: effectiveDate,
          notes: 'Admin rate update'
        }
      });

      // Update university base rate for future calculations
      await tx.university.update({
        where: { id: universityId },
        data: { commissionRate: rate }
      });
    });

    // Audit log (historical data unaffected)
    await logAudit({
      action: 'ADMIN_COMMISSION_RATE_UPDATE',
      actorId: req.user.userId,
      actorRole: 'ADMIN',
      applicationId: null,
      oldStatus: 'N/A',
      newStatus: 'N/A',
      details: `Rate set to ${(rate * 100).toFixed(2)}% effective ${effectiveDate.toISOString()} for university ${universityId}`
    });

    return res.status(201).json({
      success: true,
      message: 'Commission rate scheduled',
      data: {
        universityId,
        commissionRate: rate,
        effectiveFrom: effectiveDate
      }
    });
  } catch (error) {
    console.error('[ADMIN COMMISSION] Error setting rate:', error);
    return res.status(500).json({ error: 'Failed to set commission rate' });
  }
}

// POST /admin/commission/freeze
// Admin: freeze or unfreeze payouts for a university (fraud investigation)
export async function setPayoutFreeze(req, res) {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const { universityId, freeze, reason } = req.body;
  if (!universityId) return res.status(400).json({ error: 'universityId is required' });
  if (typeof freeze !== 'boolean') return res.status(400).json({ error: 'freeze must be boolean' });

  try {
    const wallet = await prisma.universityWallet.findUnique({ where: { universityId } });
    if (!wallet) return res.status(404).json({ error: 'University wallet not found' });

    const updateData = freeze
      ? { payoutsFrozen: true, freezeReason: reason || 'Fraud review', frozenAt: new Date() }
      : { payoutsFrozen: false, freezeReason: null, frozenAt: null };

    await prisma.universityWallet.update({
      where: { universityId },
      data: updateData
    });

    await logAudit({
      action: freeze ? 'PAYOUTS_FROZEN' : 'PAYOUTS_UNFROZEN',
      actorId: req.user.userId,
      actorRole: 'ADMIN',
      applicationId: null,
      oldStatus: freeze ? 'ACTIVE' : 'FROZEN',
      newStatus: freeze ? 'FROZEN' : 'ACTIVE',
      details: `University ${universityId} payouts ${freeze ? 'frozen' : 'unfrozen'}${reason ? `: ${reason}` : ''}`
    });

    return res.json({
      success: true,
      message: freeze ? 'Payouts frozen' : 'Payouts unfrozen',
      data: { universityId, payoutsFrozen: freeze, freezeReason: updateData.freezeReason, frozenAt: updateData.frozenAt }
    });
  } catch (error) {
    console.error('[ADMIN COMMISSION] Error freezing payouts:', error);
    return res.status(500).json({ error: 'Failed to update payout freeze status' });
  }
}
