import { db } from '../db/connection.js';
import { applications, payments, deliveries, applicationStatusHistory, universities, studentProfiles, srcOfficers, users, laptops } from '../db/schema/index.js';
import { sql, gte, lte, eq, and, count } from 'drizzle-orm';
import { logger } from '../observability.js';

// Helper function to get date range (default: last 30 days)
function getDateRange(days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return { startDate, endDate };
}

// Helper function to format date for grouping
function formatDateGroup(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * GET /api/admin/analytics/overview
 * Get overview metrics (last 30 days)
 */
export async function getAnalyticsOverview(req, res) {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    logger.info({ startDate, endDate }, 'Fetching analytics overview');

    // Total applications in date range
    const totalAppsResult = await db
      .select({ count: count() })
      .from(applications)
      .where(
        and(
          gte(applications.createdAt, startDate),
          lte(applications.createdAt, endDate)
        )
      );
    const totalApplications = totalAppsResult[0]?.count || 0;

    // Applications by status
    const appsStatusResult = await db
      .select({
        status: applications.status,
        count: count(),
      })
      .from(applications)
      .where(
        and(
          gte(applications.createdAt, startDate),
          lte(applications.createdAt, endDate)
        )
      )
      .groupBy(applications.status);

    const statusBreakdown = {
      PENDING_SRC: 0,
      SRC_APPROVED: 0,
      SRC_REJECTED: 0,
      ADMIN_APPROVED: 0,
      ADMIN_REJECTED: 0,
      DELIVERY_ASSIGNED: 0,
      DELIVERED: 0,
      COMPLETED: 0,
    };

    appsStatusResult.forEach(({ status, count: cnt }) => {
      if (Object.prototype.hasOwnProperty.call(statusBreakdown, status)) {
        statusBreakdown[status] = cnt;
      }
    });

    // Total payments
    const paymentsResult = await db
      .select({
        status: payments.status,
        count: count(),
        total: sql`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      )
      .groupBy(payments.status);

    const paymentStats = {
      total: 0,
      collected: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      verified: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
    };

    paymentsResult.forEach((payment) => {
      const amount = parseFloat(payment.total) || 0;
      paymentStats.total += amount;

      switch (payment.status) {
        case 'COLLECTED':
          paymentStats.collected.count += payment.count;
          paymentStats.collected.amount += amount;
          break;
        case 'VERIFIED':
          paymentStats.verified.count += payment.count;
          paymentStats.verified.amount += amount;
          break;
        case 'PENDING':
          paymentStats.pending.count += payment.count;
          paymentStats.pending.amount += amount;
          break;
        case 'FAILED':
          paymentStats.failed.count += payment.count;
          paymentStats.failed.amount += amount;
          break;
      }
    });

    // Deliveries
    const deliveriesResult = await db
      .select({
        delivered: deliveries.delivered,
        count: count(),
      })
      .from(deliveries)
      .where(
        and(
          gte(deliveries.createdAt, startDate),
          lte(deliveries.createdAt, endDate)
        )
      )
      .groupBy(deliveries.delivered);

    const deliveryStats = {
      total: 0,
      completed: 0,
      pending: 0,
    };

    deliveriesResult.forEach(({ delivered, count: cnt }) => {
      deliveryStats.total += cnt;
      if (delivered) {
        deliveryStats.completed += cnt;
      } else {
        deliveryStats.pending += cnt;
      }
    });

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      applications: {
        total: totalApplications,
        byStatus: statusBreakdown,
        approvalRate:
          totalApplications > 0
            ? (
                ((statusBreakdown.ADMIN_APPROVED +
                  statusBreakdown.SRC_APPROVED) /
                  totalApplications) *
                100
              ).toFixed(2) + '%'
            : '0%',
        rejectionRate:
          totalApplications > 0
            ? (
                ((statusBreakdown.ADMIN_REJECTED +
                  statusBreakdown.SRC_REJECTED) /
                  totalApplications) *
                100
              ).toFixed(2) + '%'
            : '0%',
      },
      payments: {
        ...paymentStats,
        completionRate:
          paymentStats.total > 0
            ? (
                ((paymentStats.collected.amount +
                  paymentStats.verified.amount) /
                  paymentStats.total) *
                100
              ).toFixed(2) + '%'
            : '0%',
      },
      deliveries: {
        ...deliveryStats,
        completionRate:
          deliveryStats.total > 0
            ? ((deliveryStats.completed / deliveryStats.total) * 100).toFixed(
                2
              ) + '%'
            : '0%',
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Analytics overview error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics overview',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/analytics/trends
 * Get application trends by date (approval/rejection/pending)
 */
export async function getApplicationTrends(req, res) {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    logger.info(
      { startDate, endDate, days },
      'Fetching application trends'
    );

    // Get all applications in range with dates
    const appsResult = await db
      .select({
        date: sql`DATE(${applications.createdAt})`.as('date'),
        status: applications.status,
        count: count(),
      })
      .from(applications)
      .where(
        and(
          gte(applications.createdAt, startDate),
          lte(applications.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${applications.createdAt})`, applications.status)
      .orderBy(sql`DATE(${applications.createdAt})`);

    // Organize by date
    const trendsByDate = {};
    appsResult.forEach(({ date, status, count: cnt }) => {
      const dateStr = date instanceof Date ? formatDateGroup(date) : date;
      if (!trendsByDate[dateStr]) {
        trendsByDate[dateStr] = {
          date: dateStr,
          pending: 0,
          approved: 0,
          rejected: 0,
          total: 0,
        };
      }

      if (status === 'PENDING_SRC') {
        trendsByDate[dateStr].pending += cnt;
      } else if (
        status === 'SRC_APPROVED' ||
        status === 'ADMIN_APPROVED' ||
        status === 'DELIVERY_ASSIGNED' ||
        status === 'DELIVERED' ||
        status === 'COMPLETED'
      ) {
        trendsByDate[dateStr].approved += cnt;
      } else if (
        status === 'SRC_REJECTED' ||
        status === 'ADMIN_REJECTED'
      ) {
        trendsByDate[dateStr].rejected += cnt;
      }

      trendsByDate[dateStr].total += cnt;
    });

    // Convert to array and sort by date
    const trends = Object.values(trendsByDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      data: trends,
    });
  } catch (error) {
    logger.error({ err: error }, 'Application trends error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application trends',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/analytics/review-times
 * Calculate average review times for SRC and Admin
 */
export async function getReviewTimes(req, res) {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    logger.info(
      { startDate, endDate, days },
      'Fetching review times analytics'
    );

    // Calculate SRC review times
    const srcTimesResult = await db
      .select({
        applicationId: applications.id,
        createdAt: applications.createdAt,
        firstSrcAction: sql`MIN(CASE 
          WHEN ${applicationStatusHistory.status} IN ('SRC_APPROVED', 'SRC_REJECTED') 
          THEN ${applicationStatusHistory.timestamp} 
        END)`.as('firstSrcAction'),
      })
      .from(applications)
      .leftJoin(
        applicationStatusHistory,
        eq(
          applications.id,
          applicationStatusHistory.applicationId
        )
      )
      .where(
        and(
          gte(applications.createdAt, startDate),
          lte(applications.createdAt, endDate)
        )
      )
      .groupBy(applications.id);

    // Calculate admin review times
    const adminTimesResult = await db
      .select({
        applicationId: applications.id,
        createdAt: applications.createdAt,
        firstAdminAction: sql`MIN(CASE 
          WHEN ${applicationStatusHistory.status} IN ('ADMIN_APPROVED', 'ADMIN_REJECTED') 
          THEN ${applicationStatusHistory.timestamp} 
        END)`.as('firstAdminAction'),
      })
      .from(applications)
      .leftJoin(
        applicationStatusHistory,
        eq(
          applications.id,
          applicationStatusHistory.applicationId
        )
      )
      .where(
        and(
          gte(applications.createdAt, startDate),
          lte(applications.createdAt, endDate)
        )
      )
      .groupBy(applications.id);

    // Calculate averages
    let srcTotalTime = 0;
    let srcCount = 0;
    let adminTotalTime = 0;
    let adminCount = 0;

    srcTimesResult.forEach(({ createdAt, firstSrcAction }) => {
      if (firstSrcAction && createdAt) {
        const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
        const action = firstSrcAction instanceof Date ? firstSrcAction : new Date(firstSrcAction);
        const diffHours =
          (action.getTime() - created.getTime()) / (1000 * 60 * 60);
        srcTotalTime += diffHours;
        srcCount++;
      }
    });

    adminTimesResult.forEach(({ createdAt, firstAdminAction }) => {
      if (firstAdminAction && createdAt) {
        const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
        const action = firstAdminAction instanceof Date ? firstAdminAction : new Date(firstAdminAction);
        const diffHours =
          (action.getTime() - created.getTime()) / (1000 * 60 * 60);
        adminTotalTime += diffHours;
        adminCount++;
      }
    });

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      srcReview: {
        averageHours:
          srcCount > 0
            ? (srcTotalTime / srcCount).toFixed(2)
            : '0',
        averageDays:
          srcCount > 0
            ? (srcTotalTime / srcCount / 24).toFixed(2)
            : '0',
        applicationsReviewed: srcCount,
      },
      adminReview: {
        averageHours:
          adminCount > 0
            ? (adminTotalTime / adminCount).toFixed(2)
            : '0',
        averageDays:
          adminCount > 0
            ? (adminTotalTime / adminCount / 24).toFixed(2)
            : '0',
        applicationsReviewed: adminCount,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Review times error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review times analytics',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/analytics/payments
 * Get payment completion rates and trends
 */
export async function getPaymentAnalytics(req, res) {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    logger.info(
      { startDate, endDate, days },
      'Fetching payment analytics'
    );

    // Payment status breakdown
    const paymentStatusResult = await db
      .select({
        date: sql`DATE(${payments.createdAt})`.as('date'),
        status: payments.status,
        count: count(),
        total: sql`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${payments.createdAt})`, payments.status)
      .orderBy(sql`DATE(${payments.createdAt})`);

    // Organize by date
    const paymentsTrend = {};
    let totalCollected = 0;
    let totalVerified = 0;
    let totalPending = 0;
    let totalFailed = 0;
    let totalAmount = 0;

    paymentStatusResult.forEach(({ date, status, count: cnt, total }) => {
      const dateStr = date instanceof Date ? formatDateGroup(date) : date;
      const amount = parseFloat(total) || 0;

      if (!paymentsTrend[dateStr]) {
        paymentsTrend[dateStr] = {
          date: dateStr,
          collected: 0,
          verified: 0,
          pending: 0,
          failed: 0,
          total: 0,
        };
      }

      switch (status) {
        case 'COLLECTED':
          paymentsTrend[dateStr].collected += cnt;
          totalCollected += amount;
          break;
        case 'VERIFIED':
          paymentsTrend[dateStr].verified += cnt;
          totalVerified += amount;
          break;
        case 'PENDING':
          paymentsTrend[dateStr].pending += cnt;
          totalPending += amount;
          break;
        case 'FAILED':
          paymentsTrend[dateStr].failed += cnt;
          totalFailed += amount;
          break;
      }
      paymentsTrend[dateStr].total += cnt;
      totalAmount += amount;
    });

    const trends = Object.values(paymentsTrend).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      summary: {
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        collected: {
          amount: parseFloat(totalCollected.toFixed(2)),
          percentage: totalAmount > 0
            ? ((totalCollected / totalAmount) * 100).toFixed(2) + '%'
            : '0%',
        },
        verified: {
          amount: parseFloat(totalVerified.toFixed(2)),
          percentage: totalAmount > 0
            ? ((totalVerified / totalAmount) * 100).toFixed(2) + '%'
            : '0%',
        },
        pending: {
          amount: parseFloat(totalPending.toFixed(2)),
          percentage: totalAmount > 0
            ? ((totalPending / totalAmount) * 100).toFixed(2) + '%'
            : '0%',
        },
        failed: {
          amount: parseFloat(totalFailed.toFixed(2)),
          percentage: totalAmount > 0
            ? ((totalFailed / totalAmount) * 100).toFixed(2) + '%'
            : '0%',
        },
      },
      trends,
    });
  } catch (error) {
    logger.error({ err: error }, 'Payment analytics error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment analytics',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/analytics/deliveries
 * Get delivery completion rates and trend
 */
export async function getDeliveryAnalytics(req, res) {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    logger.info(
      { startDate, endDate, days },
      'Fetching delivery analytics'
    );

    // Delivery status by date
    const deliveryResult = await db
      .select({
        date: sql`DATE(${deliveries.createdAt})`.as('date'),
        delivered: deliveries.delivered,
        count: count(),
      })
      .from(deliveries)
      .where(
        and(
          gte(deliveries.createdAt, startDate),
          lte(deliveries.createdAt, endDate)
        )
      )
      .groupBy(
        sql`DATE(${deliveries.createdAt})`,
        deliveries.delivered
      )
      .orderBy(sql`DATE(${deliveries.createdAt})`);

    // Organize by date
    const deliveryTrend = {};
    let totalDeliveries = 0;
    let completedDeliveries = 0;

    deliveryResult.forEach(({ date, delivered, count: cnt }) => {
      const dateStr = date instanceof Date ? formatDateGroup(date) : date;

      if (!deliveryTrend[dateStr]) {
        deliveryTrend[dateStr] = {
          date: dateStr,
          completed: 0,
          pending: 0,
          total: 0,
        };
      }

      if (delivered) {
        deliveryTrend[dateStr].completed += cnt;
        completedDeliveries += cnt;
      } else {
        deliveryTrend[dateStr].pending += cnt;
      }
      deliveryTrend[dateStr].total += cnt;
      totalDeliveries += cnt;
    });

    const trends = Object.values(deliveryTrend).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      summary: {
        total: totalDeliveries,
        completed: completedDeliveries,
        pending: totalDeliveries - completedDeliveries,
        completionRate:
          totalDeliveries > 0
            ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2) + '%'
            : '0%',
      },
      trends,
    });
  } catch (error) {
    logger.error({ err: error }, 'Delivery analytics error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery analytics',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/analytics/universities
 * Get performance metrics for all universities
 */
export async function getUniversityPerformance(req, res) {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    logger.info({ startDate, endDate }, 'Fetching university performance metrics');

    // Get all universities
    const allUniversities = await db.select().from(universities);

    const universityMetrics = await Promise.all(
      allUniversities.map(async (uni) => {
        // Total applications from this university
        const totalApps = await db
          .select({ count: count() })
          .from(applications)
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.userId))
          .where(eq(studentProfiles.universityId, uni.id));

        // Applications by status from this university
        const appsByStatus = await db
          .select({
            status: applications.status,
            count: count(),
          })
          .from(applications)
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.userId))
          .where(eq(studentProfiles.universityId, uni.id))
          .groupBy(applications.status);

        // Calculate metrics
        const total = totalApps[0]?.count || 0;
        const statusMap = {};
        appsByStatus.forEach(({ status, count: cnt }) => {
          statusMap[status] = cnt;
        });

        const pending = statusMap['PENDING_SRC'] || 0;
        const srcApproved = statusMap['SRC_APPROVED'] || 0;
        const srcRejected = statusMap['SRC_REJECTED'] || 0;
        const adminApproved = statusMap['ADMIN_APPROVED'] || 0;
        const adminRejected = statusMap['ADMIN_REJECTED'] || 0;

        // Calculate approval and rejection ratios
        const approved = srcApproved + adminApproved;
        const rejected = srcRejected + adminRejected;
        const approvalRatio = total > 0 ? ((approved / total) * 100).toFixed(2) : 0;
        const rejectionRatio = total > 0 ? ((rejected / total) * 100).toFixed(2) : 0;
        const backlogPercentage = total > 0 ? ((pending / total) * 100).toFixed(2) : 0;

        // Calculate average SRC review time (from created to first SRC action)
        const reviewTimes = await db
          .select({
            appId: applications.id,
            createdAt: applications.createdAt,
            reviewedAt: applicationStatusHistory.timestamp,
          })
          .from(applications)
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.userId))
          .innerJoin(
            applicationStatusHistory,
            and(
              eq(applicationStatusHistory.applicationId, applications.id),
              sql`${applicationStatusHistory.status} IN ('SRC_APPROVED', 'SRC_REJECTED')`
            )
          )
          .where(eq(studentProfiles.universityId, uni.id));

        let avgReviewHours = 0;
        if (reviewTimes.length > 0) {
          const totalHours = reviewTimes.reduce((sum, review) => {
            const diffMs = new Date(review.reviewedAt) - new Date(review.createdAt);
            const hours = diffMs / (1000 * 60 * 60);
            return sum + hours;
          }, 0);
          avgReviewHours = (totalHours / reviewTimes.length).toFixed(2);
        }

        // Calculate performance score (0-100)
        const approvalScore = parseFloat(approvalRatio);
        const backlogScore = 100 - parseFloat(backlogPercentage);
        const reviewScore = Math.max(0, 100 - (parseFloat(avgReviewHours) / 2)); // Normalize by dividing by 2
        const performanceScore = (
          approvalScore * 0.4 +
          backlogScore * 0.35 +
          reviewScore * 0.25
        ).toFixed(2);

        // Identify if underperforming
        const isUnderperforming =
          parseFloat(backlogPercentage) > 30 && parseFloat(avgReviewHours) > 72 ||
          parseFloat(backlogPercentage) > 50;

        return {
          universityId: uni.id,
          universityName: uni.name,
          totalApplications: total,
          pendingCount: pending,
          approvedCount: approved,
          rejectedCount: rejected,
          approvalRatio: parseFloat(approvalRatio),
          rejectionRatio: parseFloat(rejectionRatio),
          backlogPercentage: parseFloat(backlogPercentage),
          avgSrcReviewHours: parseFloat(avgReviewHours),
          performanceScore: parseFloat(performanceScore),
          isUnderperforming,
        };
      })
    );

    // Sort by performance score (descending)
    const sorted = universityMetrics.sort(
      (a, b) => b.performanceScore - a.performanceScore
    );

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      summary: {
        totalUniversities: sorted.length,
        underperformingCount: sorted.filter((u) => u.isUnderperforming).length,
        averagePerformanceScore: (
          sorted.reduce((sum, u) => sum + u.performanceScore, 0) / sorted.length
        ).toFixed(2),
      },
      data: sorted,
    });
  } catch (error) {
    logger.error({ err: error }, 'University performance analytics error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch university performance analytics',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/analytics/universities/underperforming
 * Get universities with performance issues (slow reviews or high backlog)
 */
export async function getUnderperformingUniversities(req, res) {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    logger.info({ startDate, endDate }, 'Fetching underperforming universities');

    // Get all universities
    const allUniversities = await db.select().from(universities);

    const underperformers = await Promise.all(
      allUniversities.map(async (uni) => {
        // Get pending count
        const pendingApps = await db
          .select({ count: count() })
          .from(applications)
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.userId))
          .where(
            and(
              eq(studentProfiles.universityId, uni.id),
              eq(applications.status, 'PENDING_SRC')
            )
          );

        const pendingCount = pendingApps[0]?.count || 0;

        // Get total count
        const totalApps = await db
          .select({ count: count() })
          .from(applications)
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.userId))
          .where(eq(studentProfiles.universityId, uni.id));

        const total = totalApps[0]?.count || 0;
        const backlogPercentage = total > 0 ? (pendingCount / total) * 100 : 0;

        // Get average review time
        const reviewTimes = await db
          .select({
            appId: applications.id,
            createdAt: applications.createdAt,
            reviewedAt: applicationStatusHistory.timestamp,
          })
          .from(applications)
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.userId))
          .innerJoin(
            applicationStatusHistory,
            and(
              eq(applicationStatusHistory.applicationId, applications.id),
              sql`${applicationStatusHistory.status} IN ('SRC_APPROVED', 'SRC_REJECTED')`
            )
          )
          .where(eq(studentProfiles.universityId, uni.id));

        let avgReviewHours = 0;
        if (reviewTimes.length > 0) {
          const totalHours = reviewTimes.reduce((sum, review) => {
            const diffMs = new Date(review.reviewedAt) - new Date(review.createdAt);
            const hours = diffMs / (1000 * 60 * 60);
            return sum + hours;
          }, 0);
          avgReviewHours = totalHours / reviewTimes.length;
        }

        // Check if underperforming
        const isUnderperforming =
          (backlogPercentage > 30 && avgReviewHours > 72) || backlogPercentage > 50;

        if (isUnderperforming) {
          return {
            universityId: uni.id,
            universityName: uni.name,
            pendingCount,
            totalApplications: total,
            backlogPercentage: backlogPercentage.toFixed(2),
            avgSrcReviewHours: avgReviewHours.toFixed(2),
            issues: [
              backlogPercentage > 50 && 'High backlog (>50%)',
              backlogPercentage > 30 && avgReviewHours > 72 && 'Slow reviews (>72 hours)',
              avgReviewHours > 120 && 'Very slow reviews (>5 days)',
            ].filter(Boolean),
          };
        }
        return null;
      })
    );

    // Filter out nulls and sort by backlog
    const filtered = underperformers
      .filter((u) => u !== null)
      .sort((a, b) => parseFloat(b.backlogPercentage) - parseFloat(a.backlogPercentage));

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      summary: {
        totalUnderperforming: filtered.length,
        criticalBacklog: filtered.filter(
          (u) => parseFloat(u.backlogPercentage) > 50
        ).length,
        slowReviews: filtered.filter(
          (u) => parseFloat(u.avgSrcReviewHours) > 72
        ).length,
      },
      data: filtered,
    });
  } catch (error) {
    logger.error({ err: error }, 'Underperforming universities analytics error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch underperforming universities',
      message: error.message,
    });
  }
}


/**
 * GET /api/admin/analytics/universities
 * Get university performance metrics (aggregated)
 */
export async function getUniversityMetrics(req, res) {
  try {
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    logger.info({ startDate, endDate, days }, 'Fetching university performance metrics');

    // Get all universities with their application metrics
    const universityMetrics = await db
      .select({
        universityId: studentProfiles.universityId,
        universityName: universities.name,
        totalApplications: count(applications.id),
        srcPending: count(
          sql`CASE WHEN ${applications.status} = 'PENDING_SRC' THEN 1 END`
        ),
        srcApproved: count(
          sql`CASE WHEN ${applications.status} = 'SRC_APPROVED' THEN 1 END`
        ),
        srcRejected: count(
          sql`CASE WHEN ${applications.status} = 'SRC_REJECTED' THEN 1 END`
        ),
        adminApproved: count(
          sql`CASE WHEN ${applications.status} = 'ADMIN_APPROVED' THEN 1 END`
        ),
        adminRejected: count(
          sql`CASE WHEN ${applications.status} = 'ADMIN_REJECTED' THEN 1 END`
        ),
        delivered: count(
          sql`CASE WHEN ${applications.status} = 'DELIVERED' THEN 1 END`
        ),
      })
      .from(applications)
      .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .innerJoin(universities, eq(studentProfiles.universityId, universities.id))
      .where(
        and(
          gte(applications.createdAt, startDate),
          lte(applications.createdAt, endDate)
        )
      )
      .groupBy(studentProfiles.universityId, universities.id, universities.name);

    // Calculate derived metrics and performance scores
    const enrichedMetrics = universityMetrics.map((uni) => {
      const total = uni.totalApplications;
      const srcApprovalRate =
        uni.srcApproved + uni.srcRejected > 0
          ? ((uni.srcApproved / (uni.srcApproved + uni.srcRejected)) * 100).toFixed(1)
          : 0;
      const overallApprovalRate =
        total > 0
          ? (
              ((uni.srcApproved + uni.adminApproved) / total) *
              100
            ).toFixed(1)
          : 0;

      // Performance score: Higher = Better
      // Factors: Higher approval rate (50%), Lower backlog % (30%), Progress (20%)
      const backlogPercentage = total > 0 ? (uni.srcPending / total) * 100 : 0;
      const progressPercentage =
        total > 0
          ? (
              ((uni.srcApproved +
                uni.srcRejected +
                uni.adminApproved +
                uni.adminRejected +
                uni.delivered) /
                total) *
              100
            ).toFixed(1)
          : 0;

      const performanceScore = Math.round(
        parseFloat(overallApprovalRate) * 0.5 +
          (100 - backlogPercentage) * 0.3 +
          parseFloat(progressPercentage) * 0.2
      );

      // Performance tier classification
      let performanceTier = 'EXCELLENT';
      if (performanceScore < 60) performanceTier = 'CRITICAL';
      else if (performanceScore < 70) performanceTier = 'POOR';
      else if (performanceScore < 80) performanceTier = 'FAIR';
      else if (performanceScore < 90) performanceTier = 'GOOD';

      return {
        universityId: uni.universityId,
        universityName: uni.universityName,
        totalApplications: uni.totalApplications,
        srcPending: uni.srcPending,
        srcApproved: uni.srcApproved,
        srcRejected: uni.srcRejected,
        adminApproved: uni.adminApproved,
        adminRejected: uni.adminRejected,
        delivered: uni.delivered,
        srcApprovalRate: `${srcApprovalRate}%`,
        overallApprovalRate: `${overallApprovalRate}%`,
        backlogPercentage: backlogPercentage.toFixed(1),
        progressPercentage: `${progressPercentage}%`,
        performanceScore,
        performanceTier,
      };
    });

    // Sort by performance score (ascending = worst first)
    enrichedMetrics.sort((a, b) => a.performanceScore - b.performanceScore);

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      summary: {
        totalUniversities: enrichedMetrics.length,
        excellent: enrichedMetrics.filter((u) => u.performanceTier === 'EXCELLENT')
          .length,
        good: enrichedMetrics.filter((u) => u.performanceTier === 'GOOD').length,
        fair: enrichedMetrics.filter((u) => u.performanceTier === 'FAIR').length,
        poor: enrichedMetrics.filter((u) => u.performanceTier === 'POOR').length,
        critical: enrichedMetrics.filter((u) => u.performanceTier === 'CRITICAL')
          .length,
      },
      data: enrichedMetrics,
    });
  } catch (error) {
    logger.error({ err: error }, 'University metrics error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch university metrics',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/analytics/universities/:universityId
 * Get detailed metrics for a specific university
 */
export async function getUniversityDetail(req, res) {
  try {
    const { universityId } = req.params;
    const { days = 30 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);

    if (!universityId) {
      return res.status(400).json({
        success: false,
        error: 'University ID is required',
      });
    }

    logger.info(
      { universityId, startDate, endDate },
      'Fetching university detail metrics'
    );

    // Get university basic info and metrics
    const universityDetail = await db
      .select({
        universityId: universities.id,
        universityName: universities.name,
        totalApplications: count(applications.id),
        srcPending: count(
          sql`CASE WHEN ${applications.status} = 'PENDING_SRC' THEN 1 END`
        ),
        srcApproved: count(
          sql`CASE WHEN ${applications.status} = 'SRC_APPROVED' THEN 1 END`
        ),
        srcRejected: count(
          sql`CASE WHEN ${applications.status} = 'SRC_REJECTED' THEN 1 END`
        ),
        adminApproved: count(
          sql`CASE WHEN ${applications.status} = 'ADMIN_APPROVED' THEN 1 END`
        ),
        adminRejected: count(
          sql`CASE WHEN ${applications.status} = 'ADMIN_REJECTED' THEN 1 END`
        ),
        deliveryAssigned: count(
          sql`CASE WHEN ${applications.status} = 'DELIVERY_ASSIGNED' THEN 1 END`
        ),
        delivered: count(
          sql`CASE WHEN ${applications.status} = 'DELIVERED' THEN 1 END`
        ),
        completed: count(
          sql`CASE WHEN ${applications.status} = 'COMPLETED' THEN 1 END`
        ),
      })
      .from(applications)
      .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .innerJoin(universities, eq(studentProfiles.universityId, universities.id))
      .where(
        and(
          eq(universities.id, universityId),
          gte(applications.createdAt, startDate),
          lte(applications.createdAt, endDate)
        )
      )
      .groupBy(universities.id, universities.name);

    if (!universityDetail || universityDetail.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'University not found or no applications in period',
      });
    }

    const uni = universityDetail[0];
    const total = uni.totalApplications;

    // Calculate metrics
    const srcApprovalRate =
      uni.srcApproved + uni.srcRejected > 0
        ? ((uni.srcApproved / (uni.srcApproved + uni.srcRejected)) * 100).toFixed(1)
        : 0;
    const overallApprovalRate =
      total > 0
        ? (((uni.srcApproved + uni.adminApproved) / total) * 100).toFixed(1)
        : 0;
    const overallRejectionRate =
      total > 0
        ? (((uni.srcRejected + uni.adminRejected) / total) * 100).toFixed(1)
        : 0;

    const backlogPercentage = total > 0 ? (uni.srcPending / total) * 100 : 0;
    const completionPercentage =
      total > 0
        ? (
            ((uni.srcApproved +
              uni.adminApproved +
              uni.delivered +
              uni.completed) /
              total) *
            100
          ).toFixed(1)
        : 0;

    // Get daily breakdown (last 7 days or period)
    const dailyBreakdown = await db
      .select({
        date: sql`DATE(${applications.createdAt})`,
        dayCount: count(),
        dayApproved: count(
          sql`CASE WHEN ${applications.status} IN ('SRC_APPROVED', 'ADMIN_APPROVED') THEN 1 END`
        ),
        dayRejected: count(
          sql`CASE WHEN ${applications.status} IN ('SRC_REJECTED', 'ADMIN_REJECTED') THEN 1 END`
        ),
        dayPending: count(
          sql`CASE WHEN ${applications.status} = 'PENDING_SRC' THEN 1 END`
        ),
      })
      .from(applications)
      .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
      .where(
        and(
          eq(studentProfiles.universityId, universityId),
          gte(applications.createdAt, startDate),
          lte(applications.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${applications.createdAt})`)
      .orderBy(sql`DATE(${applications.createdAt})`);

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      detail: {
        universityId: uni.universityId,
        universityName: uni.universityName,
        totalApplications: total,
        byStatus: {
          srcPending: uni.srcPending,
          srcApproved: uni.srcApproved,
          srcRejected: uni.srcRejected,
          adminApproved: uni.adminApproved,
          adminRejected: uni.adminRejected,
          deliveryAssigned: uni.deliveryAssigned,
          delivered: uni.delivered,
          completed: uni.completed,
        },
        metrics: {
          srcApprovalRate: `${srcApprovalRate}%`,
          overallApprovalRate: `${overallApprovalRate}%`,
          overallRejectionRate: `${overallRejectionRate}%`,
          backlogPercentage: backlogPercentage.toFixed(1),
          completionPercentage: `${completionPercentage}%`,
        },
      },
      dailyBreakdown: dailyBreakdown.map((day) => ({
        date: day.date,
        totalSubmitted: day.dayCount,
        approved: day.dayApproved,
        rejected: day.dayRejected,
        pending: day.dayPending,
      })),
    });
  } catch (error) {
    logger.error({ err: error }, 'University detail error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch university detail',
      message: error.message,
    });
  }
}

/**
 * GET /api/admin/analytics/src-accountability
 * Get SRC officer performance and SLA compliance metrics
 */
export async function getSrcAccountability(req, res) {
  try {
    const { days = 30, slaHours = 72 } = req.query;
    const { startDate, endDate } = getDateRange(parseInt(days) || 30);
    const slaThreshold = new Date();
    slaThreshold.setHours(slaThreshold.getHours() - (parseInt(slaHours) || 72));

    logger.info(
      { startDate, endDate, slaHours: parseInt(slaHours) || 72 },
      'Fetching SRC accountability metrics'
    );

    const officers = await db
      .select({
        officerId: srcOfficers.id,
        userId: srcOfficers.userId,
        universityId: srcOfficers.universityId,
        position: srcOfficers.position,
        officerName: users.fullName,
        officerEmail: users.email,
        universityName: universities.name,
      })
      .from(srcOfficers)
      .innerJoin(users, eq(srcOfficers.userId, users.id))
      .innerJoin(universities, eq(srcOfficers.universityId, universities.id));

    const officerMetrics = await Promise.all(
      officers.map(async (officer) => {
        const pendingResult = await db
          .select({ count: count() })
          .from(applications)
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
          .where(
            and(
              eq(studentProfiles.universityId, officer.universityId),
              eq(applications.status, 'PENDING_SRC')
            )
          );

        const pendingCount = pendingResult[0]?.count || 0;

        const pendingSlaResult = await db
          .select({ count: count() })
          .from(applications)
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
          .where(
            and(
              eq(studentProfiles.universityId, officer.universityId),
              eq(applications.status, 'PENDING_SRC'),
              lte(applications.createdAt, slaThreshold)
            )
          );

        const pendingSlaBreaches = pendingSlaResult[0]?.count || 0;

        const reviewEntries = await db
          .select({
            applicationId: applicationStatusHistory.applicationId,
            createdAt: applications.createdAt,
            reviewedAt: applicationStatusHistory.timestamp,
          })
          .from(applicationStatusHistory)
          .innerJoin(applications, eq(applicationStatusHistory.applicationId, applications.id))
          .innerJoin(studentProfiles, eq(applications.studentId, studentProfiles.id))
          .where(
            and(
              eq(applicationStatusHistory.changedBy, officer.userId),
              sql`${applicationStatusHistory.status} IN ('SRC_APPROVED', 'SRC_REJECTED')`,
              gte(applicationStatusHistory.timestamp, startDate),
              lte(applicationStatusHistory.timestamp, endDate)
            )
          );

        let avgReviewHours = 0;
        let slaReviewBreaches = 0;
        if (reviewEntries.length > 0) {
          const totalHours = reviewEntries.reduce((sum, review) => {
            const diffMs = new Date(review.reviewedAt) - new Date(review.createdAt);
            const hours = diffMs / (1000 * 60 * 60);
            if (hours > (parseInt(slaHours) || 72)) {
              slaReviewBreaches += 1;
            }
            return sum + hours;
          }, 0);
          avgReviewHours = totalHours / reviewEntries.length;
        }

        const slaViolation = pendingSlaBreaches > 0 || slaReviewBreaches > 0;

        return {
          officerId: officer.officerId,
          userId: officer.userId,
          officerName: officer.officerName || officer.officerEmail,
          officerEmail: officer.officerEmail,
          universityId: officer.universityId,
          universityName: officer.universityName,
          position: officer.position,
          pendingCount,
          pendingSlaBreaches,
          reviewedCount: reviewEntries.length,
          avgReviewHours: parseFloat(avgReviewHours.toFixed(2)),
          avgReviewDays: parseFloat((avgReviewHours / 24).toFixed(2)),
          slaReviewBreaches,
          slaViolation,
        };
      })
    );

    const totals = officerMetrics.reduce(
      (acc, officer) => {
        acc.totalPending += officer.pendingCount;
        acc.totalPendingSlaBreaches += officer.pendingSlaBreaches;
        acc.totalReviewCount += officer.reviewedCount;
        acc.totalReviewHours += officer.avgReviewHours * officer.reviewedCount;
        if (officer.slaViolation) {
          acc.slaViolationCount += 1;
        }
        return acc;
      },
      {
        totalPending: 0,
        totalPendingSlaBreaches: 0,
        totalReviewCount: 0,
        totalReviewHours: 0,
        slaViolationCount: 0,
      }
    );

    const averageReviewHours =
      totals.totalReviewCount > 0
        ? parseFloat((totals.totalReviewHours / totals.totalReviewCount).toFixed(2))
        : 0;

    res.json({
      success: true,
      period: { startDate, endDate, days: parseInt(days) || 30 },
      summary: {
        totalOfficers: officerMetrics.length,
        totalPending: totals.totalPending,
        totalPendingSlaBreaches: totals.totalPendingSlaBreaches,
        totalReviewCount: totals.totalReviewCount,
        averageReviewHours,
        slaViolationCount: totals.slaViolationCount,
        slaHours: parseInt(slaHours) || 72,
      },
      data: officerMetrics,
    });
  } catch (error) {
    logger.error({ err: error }, 'SRC accountability analytics error');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SRC accountability analytics',
      message: error.message,
    });
  }
}

/**
 * Get Financial Analytics
 * 
 * Tracks all monetary flows in Ghana Cedis (GHS)
 * - Total revenue (all verified payments)
 * - 70% collected vs 30% outstanding
 * - Unpaid delivered laptops (delivered but no FINAL_30 payment)
 * - Revenue by university, product, date ranges
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function getFinancialAnalytics(req, res) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 7), 90);
    const universityId = req.query.universityId;
    const productId = req.query.productId; // laptop ID
    
    const { startDate, endDate } = getDateRange(days);

    // Build filters
    const filters = [
      gte(payments.createdAt, startDate),
      lte(payments.createdAt, endDate)
    ];

    if (universityId) {
      filters.push(eq(applications.universityId, universityId));
    }

    if (productId) {
      filters.push(eq(applications.laptopId, productId));
    }

    // 1. Get all VERIFIED payments (actual revenue)
    const verifiedPayments = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        type: payments.type,
        applicationId: payments.applicationId,
        createdAt: payments.createdAt,
        universityId: applications.universityId,
        universityName: universities.name,
        laptopId: applications.laptopId,
        laptopBrand: laptops.brand,
        laptopModel: laptops.model,
      })
      .from(payments)
      .innerJoin(applications, eq(payments.applicationId, applications.id))
      .leftJoin(universities, eq(applications.universityId, universities.id))
      .leftJoin(laptops, eq(applications.laptopId, laptops.id))
      .where(and(
        eq(payments.status, 'VERIFIED'),
        ...filters
      ));

    // 2. Calculate revenue totals
    let totalRevenue = 0;
    let initial70Total = 0;
    let final30Total = 0;

    verifiedPayments.forEach(payment => {
      const amount = parseFloat(payment.amount) || 0;
      totalRevenue += amount;
      
      if (payment.type === 'INITIAL_70') {
        initial70Total += amount;
      } else if (payment.type === 'FINAL_30') {
        final30Total += amount;
      }
    });

    // 3. Find delivered laptops without FINAL_30 payment (unpaid deliveries)
    const unpaidDeliveries = await db
      .select({
        applicationId: applications.id,
        studentId: applications.studentId,
        studentName: users.fullName,
        studentEmail: users.email,
        universityId: applications.universityId,
        universityName: universities.name,
        laptopId: applications.laptopId,
        laptopBrand: laptops.brand,
        laptopModel: laptops.model,
        laptopPrice: laptops.discountedPrice,
        deliveryId: deliveries.id,
        deliveredAt: deliveries.deliveredAt,
        outstandingAmount: sql`${laptops.discountedPrice} * 0.30`,
      })
      .from(deliveries)
      .innerJoin(applications, eq(deliveries.applicationId, applications.id))
      .innerJoin(users, eq(applications.studentId, users.id))
      .leftJoin(universities, eq(applications.universityId, universities.id))
      .leftJoin(laptops, eq(applications.laptopId, laptops.id))
      .where(and(
        eq(deliveries.status, 'DELIVERED'),
        gte(deliveries.deliveredAt, startDate),
        lte(deliveries.deliveredAt, endDate),
        universityId ? eq(applications.universityId, universityId) : sql`1=1`,
        productId ? eq(applications.laptopId, productId) : sql`1=1`
      ));

    // Filter to only include those without FINAL_30 payment
    const unpaidDeliveriesList = [];
    let totalOutstanding = 0;

    for (const delivery of unpaidDeliveries) {
      const hasFinal30 = verifiedPayments.some(
        p => p.applicationId === delivery.applicationId && p.type === 'FINAL_30'
      );

      if (!hasFinal30) {
        const outstanding = parseFloat(delivery.outstandingAmount) || 0;
        totalOutstanding += outstanding;
        unpaidDeliveriesList.push({
          applicationId: delivery.applicationId,
          studentName: delivery.studentName,
          studentEmail: delivery.studentEmail,
          universityName: delivery.universityName,
          laptopBrand: delivery.laptopBrand,
          laptopModel: delivery.laptopModel,
          laptopPrice: delivery.laptopPrice,
          outstandingAmount: outstanding,
          deliveredAt: delivery.deliveredAt,
          daysOverdue: Math.floor((new Date() - new Date(delivery.deliveredAt)) / (1000 * 60 * 60 * 24))
        });
      }
    }

    // 4. Revenue by university
    const revenueByUniversity = {};
    verifiedPayments.forEach(payment => {
      const uniName = payment.universityName || 'Unknown';
      if (!revenueByUniversity[uniName]) {
        revenueByUniversity[uniName] = {
          universityName: uniName,
          universityId: payment.universityId,
          totalRevenue: 0,
          initial70: 0,
          final30: 0,
          paymentCount: 0
        };
      }
      
      const amount = parseFloat(payment.amount) || 0;
      revenueByUniversity[uniName].totalRevenue += amount;
      revenueByUniversity[uniName].paymentCount++;
      
      if (payment.type === 'INITIAL_70') {
        revenueByUniversity[uniName].initial70 += amount;
      } else if (payment.type === 'FINAL_30') {
        revenueByUniversity[uniName].final30 += amount;
      }
    });

    // 5. Revenue by product (laptop model)
    const revenueByProduct = {};
    verifiedPayments.forEach(payment => {
      if (payment.laptopId) {
        const productKey = `${payment.laptopBrand} ${payment.laptopModel}`;
        if (!revenueByProduct[productKey]) {
          revenueByProduct[productKey] = {
            laptopId: payment.laptopId,
            brand: payment.laptopBrand,
            model: payment.laptopModel,
            totalRevenue: 0,
            initial70: 0,
            final30: 0,
            unitsSold: 0
          };
        }
        
        const amount = parseFloat(payment.amount) || 0;
        revenueByProduct[productKey].totalRevenue += amount;
        
        if (payment.type === 'INITIAL_70') {
          revenueByProduct[productKey].initial70 += amount;
          revenueByProduct[productKey].unitsSold++; // Count unique applications
        } else if (payment.type === 'FINAL_30') {
          revenueByProduct[productKey].final30 += amount;
        }
      }
    });

    // 6. Calculate payment completion rate
    const initial70Count = verifiedPayments.filter(p => p.type === 'INITIAL_70').length;
    const final30Count = verifiedPayments.filter(p => p.type === 'FINAL_30').length;
    const paymentCompletionRate = initial70Count > 0 
      ? ((final30Count / initial70Count) * 100).toFixed(2)
      : 0;

    // Calculate expected 30% outstanding (from all INITIAL_70 payments that haven't been completed)
    const expected30Outstanding = (initial70Total / 0.70) * 0.30 - final30Total;

    logger.info('Financial analytics retrieved successfully', {
      period: { startDate, endDate, days },
      totalRevenue,
      initial70Total,
      final30Total,
      unpaidCount: unpaidDeliveriesList.length
    });

    return res.status(200).json({
      success: true,
      period: {
        startDate,
        endDate,
        days
      },
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        initial70Total: parseFloat(initial70Total.toFixed(2)),
        final30Total: parseFloat(final30Total.toFixed(2)),
        initial70Percentage: totalRevenue > 0 ? ((initial70Total / totalRevenue) * 100).toFixed(2) : 0,
        final30Percentage: totalRevenue > 0 ? ((final30Total / totalRevenue) * 100).toFixed(2) : 0,
        totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
        expected30Outstanding: parseFloat(expected30Outstanding.toFixed(2)),
        unpaidDeliveriesCount: unpaidDeliveriesList.length,
        paymentCompletionRate: parseFloat(paymentCompletionRate),
        totalPayments: verifiedPayments.length,
        initial70Count,
        final30Count,
        currency: 'GHS'
      },
      unpaidDeliveries: unpaidDeliveriesList.sort((a, b) => b.daysOverdue - a.daysOverdue),
      revenueByUniversity: Object.values(revenueByUniversity).sort((a, b) => b.totalRevenue - a.totalRevenue),
      revenueByProduct: Object.values(revenueByProduct).sort((a, b) => b.totalRevenue - a.totalRevenue)
    });

  } catch (error) {
    logger.error('Error fetching financial analytics', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch financial analytics',
      message: error.message,
    });
  }
}

/**
 * Get Delivery Performance Analytics
 * 
 * Tracks delivery execution, payment collection, and operational risks
 * - Delivery status per application
 * - Unpaid deliveries (delivered but no final payment)
 * - Delivery staff performance metrics
 * - Operational risks (delays, missing payments, overdue items)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export async function getDeliveryPerformanceAnalytics(req, res) {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 7), 90);
    const { startDate, endDate } = getDateRange(days);

    // 1. Get all deliveries with application and payment data
    const deliveriesData = await db
      .select({
        deliveryId: deliveries.id,
        applicationId: deliveries.applicationId,
        studentName: users.fullName,
        studentEmail: users.email,
        universityName: universities.name,
        laptopBrand: laptops.brand,
        laptopModel: laptops.model,
        staffName: deliveries.staffName,
        deliveryDate: deliveries.deliveryDate,
        location: deliveries.location,
        delivered: deliveries.delivered,
        paymentConfirmed: deliveries.paymentConfirmed,
        createdAt: deliveries.createdAt,
      })
      .from(deliveries)
      .innerJoin(applications, eq(deliveries.applicationId, applications.id))
      .leftJoin(users, eq(applications.studentId, users.id))
      .leftJoin(universities, eq(applications.universityId, universities.id))
      .leftJoin(laptops, eq(applications.laptopId, laptops.id))
      .where(
        and(
          gte(deliveries.createdAt, startDate),
          lte(deliveries.createdAt, endDate)
        )
      );

    // 2. Get payment status for each delivery
    const paymentsData = await db
      .select({
        applicationId: payments.applicationId,
        status: payments.status,
        type: payments.type,
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      );

    // Create payment map for quick lookup
    const paymentMap = {};
    paymentsData.forEach(payment => {
      if (!paymentMap[payment.applicationId]) {
        paymentMap[payment.applicationId] = [];
      }
      paymentMap[payment.applicationId].push(payment);
    });

    // 3. Process deliveries and identify risks
    const deliveryStatuses = [];
    const staffPerformance = {};
    const unpaidDeliveries = [];
    const overdueDeliveries = [];
    
    let totalDeliveries = 0;
    let completedDeliveries = 0;
    let unpaidCount = 0;
    let overdueCount = 0;

    const now = new Date();

    deliveriesData.forEach(delivery => {
      totalDeliveries++;

      // Check if delivered
      if (delivery.delivered) {
        completedDeliveries++;
      }

      // Get payment status for this application
      const appPayments = paymentMap[delivery.applicationId] || [];
      const hasVerifiedFinal30 = appPayments.some(
        p => p.status === 'VERIFIED' && p.type === 'FINAL_30'
      );
      const hasVerifiedInitial70 = appPayments.some(
        p => p.status === 'VERIFIED' && p.type === 'INITIAL_70'
      );

      // Check if unpaid (delivered but no final payment)
      if (delivery.delivered && !hasVerifiedFinal30) {
        unpaidCount++;
        const daysOverdue = Math.floor((now - new Date(delivery.deliveryDate)) / (1000 * 60 * 60 * 24));
        
        unpaidDeliveries.push({
          deliveryId: delivery.deliveryId,
          applicationId: delivery.applicationId,
          studentName: delivery.studentName,
          studentEmail: delivery.studentEmail,
          universityName: delivery.universityName,
          laptopBrand: delivery.laptopBrand,
          laptopModel: delivery.laptopModel,
          staffName: delivery.staffName,
          deliveryDate: delivery.deliveryDate,
          location: delivery.location,
          daysOverdue,
          hasFinal30: hasVerifiedFinal30,
          hasInitial70: hasVerifiedInitial70,
          paymentStatus: hasVerifiedFinal30 ? 'PAID' : 'UNPAID'
        });

        // Track as overdue if > 7 days
        if (daysOverdue > 7) {
          overdueCount++;
          overdueDeliveries.push({
            studentName: delivery.studentName,
            daysOverdue,
            staffName: delivery.staffName
          });
        }
      }

      // Track status
      deliveryStatuses.push({
        deliveryId: delivery.deliveryId,
        applicationId: delivery.applicationId,
        studentName: delivery.studentName,
        staffName: delivery.staffName,
        delivered: delivery.delivered,
        deliveryDate: delivery.deliveryDate,
        paymentConfirmed: delivery.paymentConfirmed,
        paymentStatus: hasVerifiedFinal30 ? 'VERIFIED' : 'PENDING',
        daysToDeliver: Math.floor((new Date(delivery.deliveryDate) - new Date(delivery.createdAt)) / (1000 * 60 * 60 * 24)),
        riskLevel: !delivery.delivered ? 'PENDING' : !hasVerifiedFinal30 ? 'UNPAID' : 'COMPLETE'
      });

      // Staff performance tracking
      if (!staffPerformance[delivery.staffName]) {
        staffPerformance[delivery.staffName] = {
          staffName: delivery.staffName,
          assignedCount: 0,
          completedCount: 0,
          unpaidCount: 0,
          deliveryDates: []
        };
      }

      staffPerformance[delivery.staffName].assignedCount++;
      if (delivery.delivered) {
        staffPerformance[delivery.staffName].completedCount++;
      }
      if (delivery.delivered && !hasVerifiedFinal30) {
        staffPerformance[delivery.staffName].unpaidCount++;
      }
      staffPerformance[delivery.staffName].deliveryDates.push(
        Math.floor((new Date(delivery.deliveryDate) - new Date(delivery.createdAt)) / (1000 * 60 * 60 * 24))
      );
    });

    // 4. Calculate staff metrics
    const staffMetrics = Object.values(staffPerformance).map(staff => {
      const completionRate = staff.assignedCount > 0 
        ? ((staff.completedCount / staff.assignedCount) * 100).toFixed(2)
        : 0;
      
      const avgDeliveryDays = staff.deliveryDates.length > 0
        ? (staff.deliveryDates.reduce((a, b) => a + b, 0) / staff.deliveryDates.length).toFixed(1)
        : 0;

      const unpaidRate = staff.assignedCount > 0
        ? ((staff.unpaidCount / staff.completedCount || 0) * 100).toFixed(2)
        : 0;

      return {
        staffName: staff.staffName,
        assignedCount: staff.assignedCount,
        completedCount: staff.completedCount,
        pendingCount: staff.assignedCount - staff.completedCount,
        unpaidCount: staff.unpaidCount,
        completionRate: parseFloat(completionRate),
        avgDeliveryDays: parseFloat(avgDeliveryDays),
        unpaidRate: parseFloat(unpaidRate),
        performanceRating: parseFloat(completionRate) >= 90 ? 'EXCELLENT' :
                          parseFloat(completionRate) >= 75 ? 'GOOD' :
                          parseFloat(completionRate) >= 60 ? 'FAIR' : 'POOR'
      };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // 5. Identify operational risks
    const risks = [];
    if (unpaidCount > totalDeliveries * 0.15) {
      risks.push({
        level: 'CRITICAL',
        type: 'HIGH_UNPAID_RATE',
        message: `${((unpaidCount / totalDeliveries) * 100).toFixed(1)}% of deliveries are unpaid`,
        count: unpaidCount
      });
    }
    if (overdueCount > 0) {
      risks.push({
        level: 'WARNING',
        type: 'OVERDUE_DELIVERIES',
        message: `${overdueCount} deliveries overdue (>7 days without payment)`,
        count: overdueCount
      });
    }
    
    const lowPerformers = staffMetrics.filter(s => s.completionRate < 70);
    if (lowPerformers.length > 0) {
      risks.push({
        level: 'WARNING',
        type: 'LOW_PERFORMER',
        message: `${lowPerformers.length} staff members with completion rate < 70%`,
        count: lowPerformers.length
      });
    }

    const deliveryCompletionRate = totalDeliveries > 0 
      ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2)
      : 0;

    logger.info('Delivery performance analytics retrieved successfully', {
      period: { startDate, endDate, days },
      totalDeliveries,
      completedDeliveries,
      unpaidCount
    });

    return res.status(200).json({
      success: true,
      period: {
        startDate,
        endDate,
        days
      },
      summary: {
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries: totalDeliveries - completedDeliveries,
        unpaidDeliveries: unpaidCount,
        overdueDeliveries: overdueCount,
        deliveryCompletionRate: parseFloat(deliveryCompletionRate),
        paymentCollectionRate: totalDeliveries > 0 
          ? (((totalDeliveries - unpaidCount) / totalDeliveries) * 100).toFixed(2)
          : 0,
        totalStaff: staffMetrics.length,
        riskLevel: risks.length > 0 ? (risks.some(r => r.level === 'CRITICAL') ? 'CRITICAL' : 'WARNING') : 'LOW'
      },
      deliveryStatuses: deliveryStatuses.sort((a, b) => {
        const riskOrder = { UNPAID: 1, PENDING: 2, COMPLETE: 3 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }),
      unpaidDeliveries: unpaidDeliveries.sort((a, b) => b.daysOverdue - a.daysOverdue),
      staffPerformance: staffMetrics,
      operationalRisks: risks,
      highRiskItems: unpaidDeliveries.filter(d => d.daysOverdue > 14)
    });

  } catch (error) {
    logger.error('Error fetching delivery performance analytics', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery performance analytics',
      message: error.message,
    });
  }
}

