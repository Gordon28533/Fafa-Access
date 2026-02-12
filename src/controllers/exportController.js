import { db } from '../db/connection.js';
import { applications, users, universities, laptops, payments, deliveries } from '../db/schema/index.js';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';
import { logger } from '../observability.js';
import { logDataExport } from '../utils/auditLogger.js';

/**
 * Export Applications Report as CSV
 * GET /api/admin/export/applications/csv
 * 
 * Query params:
 *   - startDate: ISO date string (optional)
 *   - endDate: ISO date string (optional)
 *   - universityId: UUID (optional)
 *   - status: APPLICATION_STATUS (optional)
 */
export async function exportApplicationsCSV(req, res) {
  try {
    const { startDate, endDate, universityId, status } = req.query;

    // Build query conditions
    const conditions = [];
    if (startDate) {
      conditions.push(gte(applications.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(applications.createdAt, new Date(endDate)));
    }
    if (universityId) {
      conditions.push(eq(applications.universityId, universityId));
    }
    if (status) {
      conditions.push(eq(applications.status, status));
    }

    // Fetch applications with related data
    const applicationsData = await db
      .select({
        applicationId: applications.id,
        studentName: users.fullName,
        studentEmail: users.email,
        studentPhone: users.phone,
        universityName: universities.name,
        laptopModel: laptops.model,
        laptopBrand: laptops.brand,
        laptopPrice: laptops.discountedPrice,
        status: applications.status,
        submittedAt: applications.createdAt,
        srcReviewedAt: applications.srcReviewedAt,
        adminReviewedAt: applications.adminReviewedAt,
        srcComment: applications.srcComment,
        adminComment: applications.adminComment,
      })
      .from(applications)
      .leftJoin(users, eq(applications.studentId, users.id))
      .leftJoin(universities, eq(applications.universityId, universities.id))
      .leftJoin(laptops, eq(applications.laptopId, laptops.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(applications.createdAt));

    // Generate CSV
    const csv = generateCSV(applicationsData, [
      { key: 'applicationId', header: 'Application ID' },
      { key: 'studentName', header: 'Student Name' },
      { key: 'studentEmail', header: 'Email' },
      { key: 'studentPhone', header: 'Phone' },
      { key: 'universityName', header: 'University' },
      { key: 'laptopBrand', header: 'Laptop Brand' },
      { key: 'laptopModel', header: 'Laptop Model' },
      { key: 'laptopPrice', header: 'Price (GHS)' },
      { key: 'status', header: 'Status' },
      { key: 'submittedAt', header: 'Submitted At' },
      { key: 'srcReviewedAt', header: 'SRC Reviewed At' },
      { key: 'adminReviewedAt', header: 'Admin Reviewed At' },
      { key: 'srcComment', header: 'SRC Comment' },
      { key: 'adminComment', header: 'Admin Comment' },
    ]);

    // Set headers for CSV download
    const filename = `applications-report-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    // Log audit event
    await logDataExport({
      actorId: req.user.userId,
      actorRole: req.user.role,
      exportType: 'applications',
      format: 'csv',
      filters: { startDate, endDate, universityId, status },
    });

    logger.info(`Applications CSV exported by admin ${req.user.id}`, {
      filters: { startDate, endDate, universityId, status },
      recordCount: applicationsData.length,
    });
  } catch (error) {
    logger.error('Export applications CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export applications report',
    });
  }
}

/**
 * Export Payments Report as CSV
 * GET /api/admin/export/payments/csv
 */
export async function exportPaymentsCSV(req, res) {
  try {
    const { startDate, endDate, universityId, paymentStatus } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(payments.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(payments.createdAt, new Date(endDate)));
    }
    if (paymentStatus) {
      conditions.push(eq(payments.status, paymentStatus));
    }

    // Fetch payments with related data
    const paymentsData = await db
      .select({
        paymentId: payments.id,
        studentName: users.fullName,
        studentEmail: users.email,
        universityName: universities.name,
        laptopModel: laptops.model,
        amount: payments.amount,
        paymentType: payments.paymentType,
        status: payments.status,
        reference: payments.reference,
        paystackReference: payments.paystackReference,
        createdAt: payments.createdAt,
        verifiedAt: payments.verifiedAt,
      })
      .from(payments)
      .leftJoin(applications, eq(payments.applicationId, applications.id))
      .leftJoin(users, eq(applications.studentId, users.id))
      .leftJoin(universities, eq(applications.universityId, universities.id))
      .leftJoin(laptops, eq(applications.laptopId, laptops.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payments.createdAt));

    // Filter by university if needed (post-query filtering)
    let filteredData = paymentsData;
    if (universityId) {
      filteredData = paymentsData.filter(p => 
        p.universityId === universityId
      );
    }

    const csv = generateCSV(filteredData, [
      { key: 'paymentId', header: 'Payment ID' },
      { key: 'studentName', header: 'Student Name' },
      { key: 'studentEmail', header: 'Email' },
      { key: 'universityName', header: 'University' },
      { key: 'laptopModel', header: 'Laptop Model' },
      { key: 'amount', header: 'Amount (GHS)' },
      { key: 'paymentType', header: 'Payment Type' },
      { key: 'status', header: 'Status' },
      { key: 'reference', header: 'Reference' },
      { key: 'paystackReference', header: 'Paystack Reference' },
      { key: 'createdAt', header: 'Created At' },
      { key: 'verifiedAt', header: 'Verified At' },
    ]);

    const filename = `payments-report-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    // Log audit event
    await logDataExport({
      actorId: req.user.userId,
      actorRole: req.user.role,
      exportType: 'payments',
      format: 'csv',
      filters: { startDate, endDate, universityId, paymentStatus },
    });

    logger.info(`Payments CSV exported by admin ${req.user.id}`, {
      filters: { startDate, endDate, universityId, paymentStatus },
      recordCount: filteredData.length,
    });
  } catch (error) {
    logger.error('Export payments CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export payments report',
    });
  }
}

/**
 * Export Deliveries Report as CSV
 * GET /api/admin/export/deliveries/csv
 */
export async function exportDeliveriesCSV(req, res) {
  try {
    const { startDate, endDate, universityId, deliveryStatus } = req.query;

    const conditions = [];
    if (startDate) {
      conditions.push(gte(deliveries.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(deliveries.createdAt, new Date(endDate)));
    }
    if (deliveryStatus) {
      conditions.push(eq(deliveries.status, deliveryStatus));
    }

    // Fetch deliveries with related data
    const deliveriesData = await db
      .select({
        deliveryId: deliveries.id,
        studentName: users.fullName,
        studentEmail: users.email,
        studentPhone: users.phone,
        universityName: universities.name,
        laptopModel: laptops.model,
        laptopBrand: laptops.brand,
        status: deliveries.status,
        staffName: deliveries.deliveredBy,
        trackingNumber: deliveries.trackingNumber,
        deliveryAddress: deliveries.deliveryAddress,
        deliveryNotes: deliveries.notes,
        createdAt: deliveries.createdAt,
        deliveredAt: deliveries.deliveredAt,
      })
      .from(deliveries)
      .leftJoin(applications, eq(deliveries.applicationId, applications.id))
      .leftJoin(users, eq(applications.studentId, users.id))
      .leftJoin(universities, eq(applications.universityId, universities.id))
      .leftJoin(laptops, eq(applications.laptopId, laptops.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(deliveries.createdAt));

    // Filter by university if needed
    let filteredData = deliveriesData;
    if (universityId) {
      filteredData = deliveriesData.filter(d => 
        d.universityId === universityId
      );
    }

    const csv = generateCSV(filteredData, [
      { key: 'deliveryId', header: 'Delivery ID' },
      { key: 'studentName', header: 'Student Name' },
      { key: 'studentEmail', header: 'Email' },
      { key: 'studentPhone', header: 'Phone' },
      { key: 'universityName', header: 'University' },
      { key: 'laptopBrand', header: 'Laptop Brand' },
      { key: 'laptopModel', header: 'Laptop Model' },
      { key: 'status', header: 'Status' },
      { key: 'staffName', header: 'Delivered By' },
      { key: 'trackingNumber', header: 'Tracking Number' },
      { key: 'deliveryAddress', header: 'Delivery Address' },
      { key: 'deliveryNotes', header: 'Notes' },
      { key: 'createdAt', header: 'Created At' },
      { key: 'deliveredAt', header: 'Delivered At' },
    ]);

    const filename = `deliveries-report-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    // Log audit event
    await logDataExport({
      actorId: req.user.userId,
      actorRole: req.user.role,
      exportType: 'deliveries',
      format: 'csv',
      filters: { startDate, endDate, universityId, deliveryStatus },
    });

    logger.info(`Deliveries CSV exported by admin ${req.user.id}`, {
      filters: { startDate, endDate, universityId, deliveryStatus },
      recordCount: filteredData.length,
    });
  } catch (error) {
    logger.error('Export deliveries CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export deliveries report',
    });
  }
}

/**
 * Export Analytics Summary as JSON
 * GET /api/admin/export/analytics/json
 */
export async function exportAnalyticsJSON(req, res) {
  try {
    const { startDate, endDate, universityId } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const conditions = [
      gte(applications.createdAt, start),
      lte(applications.createdAt, end),
    ];

    if (universityId) {
      conditions.push(eq(applications.universityId, universityId));
    }

    // Get comprehensive analytics
    const [applicationsCount, paymentsTotal, deliveriesCount] = await Promise.all([
      db
        .select({
          total: sql`count(*)::int`,
          approved: sql`count(case when ${applications.status} = 'ADMIN_APPROVED' then 1 end)::int`,
          rejected: sql`count(case when ${applications.status} in ('SRC_REJECTED', 'ADMIN_REJECTED') then 1 end)::int`,
          pending: sql`count(case when ${applications.status} in ('PENDING_SRC_REVIEW', 'PENDING_ADMIN_REVIEW') then 1 end)::int`,
        })
        .from(applications)
        .where(and(...conditions)),
      
      db
        .select({
          totalAmount: sql`coalesce(sum(${payments.amount}), 0)`,
          verifiedAmount: sql`coalesce(sum(case when ${payments.status} = 'VERIFIED' then ${payments.amount} else 0 end), 0)`,
          pendingAmount: sql`coalesce(sum(case when ${payments.status} = 'PENDING' then ${payments.amount} else 0 end), 0)`,
        })
        .from(payments)
        .innerJoin(applications, eq(payments.applicationId, applications.id))
        .where(and(...conditions)),
      
      db
        .select({
          total: sql`count(*)::int`,
          completed: sql`count(case when ${deliveries.status} = 'DELIVERED' then 1 end)::int`,
          pending: sql`count(case when ${deliveries.status} = 'PENDING' then 1 end)::int`,
        })
        .from(deliveries)
        .innerJoin(applications, eq(deliveries.applicationId, applications.id))
        .where(and(...conditions)),
    ]);

    const analyticsData = {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      applications: applicationsCount[0],
      payments: paymentsTotal[0],
      deliveries: deliveriesCount[0],
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.email,
    };

    const filename = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json({
      success: true,
      data: analyticsData,
    });

    // Log audit event
    await logDataExport({
      actorId: req.user.userId,
      actorRole: req.user.role,
      exportType: 'analytics',
      format: 'json',
      filters: { startDate, endDate, universityId },
    });

    logger.info(`Analytics JSON exported by admin ${req.user.id}`, {
      filters: { startDate, endDate, universityId },
    });
  } catch (error) {
    logger.error('Export analytics JSON error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics report',
    });
  }
}

/**
 * Export Comprehensive Report as PDF
 * GET /api/admin/export/comprehensive/pdf
 */
export async function exportComprehensivePDF(req, res) {
  try {
    const { startDate, endDate, universityId } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get summary data
    const conditions = [
      gte(applications.createdAt, start),
      lte(applications.createdAt, end),
    ];

    if (universityId) {
      conditions.push(eq(applications.universityId, universityId));
    }

    const [summaryData] = await db
      .select({
        totalApplications: sql`count(*)::int`,
        approvedApplications: sql`count(case when ${applications.status} = 'ADMIN_APPROVED' then 1 end)::int`,
        rejectedApplications: sql`count(case when ${applications.status} in ('SRC_REJECTED', 'ADMIN_REJECTED') then 1 end)::int`,
        pendingApplications: sql`count(case when ${applications.status} in ('PENDING_SRC_REVIEW', 'PENDING_ADMIN_REVIEW') then 1 end)::int`,
      })
      .from(applications)
      .where(and(...conditions));

    // Generate PDF-like HTML report (can be converted to PDF on frontend)
    const htmlReport = generateHTMLReport({
      title: 'Comprehensive Analytics Report',
      period: { start, end },
      summary: summaryData,
      universityId,
      generatedBy: req.user.email,
    });

    const filename = `comprehensive-report-${new Date().toISOString().split('T')[0]}.html`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(htmlReport);

    // Log audit event
    await logDataExport({
      actorId: req.user.userId,
      actorRole: req.user.role,
      exportType: 'comprehensive',
      format: 'html',
      filters: { startDate, endDate, universityId },
    });

    logger.info(`Comprehensive PDF/HTML exported by admin ${req.user.id}`, {
      filters: { startDate, endDate, universityId },
    });
  } catch (error) {
    logger.error('Export comprehensive PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export comprehensive report',
    });
  }
}

/**
 * Helper function to generate CSV from data
 */
function generateCSV(data, columns) {
  if (!data || data.length === 0) {
    return columns.map(col => col.header).join(',') + '\n';
  }

  // Header row
  const headers = columns.map(col => col.header).join(',');

  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Format dates
      if (value instanceof Date) {
        value = value.toISOString();
      }

      // Handle numbers
      if (typeof value === 'number') {
        value = value.toString();
      }

      // Escape and quote strings containing commas, quotes, or newlines
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
      }

      return value;
    }).join(',');
  }).join('\n');

  return headers + '\n' + rows;
}

/**
 * Helper function to escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Helper function to generate HTML report
 */
function generateHTMLReport(options) {
  const { title, period, summary, universityId, generatedBy } = options;

  // Escape user-controlled values to prevent XSS
  const safeTitle = escapeHtml(title);
  const safeGeneratedBy = escapeHtml(generatedBy);
  const safeUniversityId = escapeHtml(universityId);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #1f2937;
      margin: 0;
    }
    .meta-info {
      margin: 20px 0;
      padding: 15px;
      background: #f3f4f6;
      border-radius: 8px;
    }
    .meta-info p {
      margin: 5px 0;
    }
    .summary-section {
      margin: 30px 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .summary-card {
      padding: 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #6b7280;
      font-size: 14px;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body { margin: 20px; }
      .header { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${safeTitle}</h1>
    <p>Student Laptop Benefit Program</p>
  </div>

  <div class="meta-info">
    <p><strong>Report Period:</strong> ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}</p>
    <p><strong>Generated On:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Generated By:</strong> ${safeGeneratedBy}</p>
    ${universityId ? `<p><strong>University Filter:</strong> ${safeUniversityId}</p>` : ''}
  </div>

  <div class="summary-section">
    <h2>Applications Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Applications</h3>
        <div class="value">${summary.totalApplications || 0}</div>
      </div>
      <div class="summary-card">
        <h3>Approved</h3>
        <div class="value">${summary.approvedApplications || 0}</div>
      </div>
      <div class="summary-card">
        <h3>Rejected</h3>
        <div class="value">${summary.rejectedApplications || 0}</div>
      </div>
      <div class="summary-card">
        <h3>Pending</h3>
        <div class="value">${summary.pendingApplications || 0}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>This report was automatically generated by the Student Laptop Benefit Program system.</p>
    <p>For questions or concerns, please contact the system administrator.</p>
  </div>
</body>
</html>
  `.trim();
}
