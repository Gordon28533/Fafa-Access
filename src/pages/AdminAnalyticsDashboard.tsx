import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import UniversityPerformancePanel from './UniversityPerformancePanel';
import SrcAccountabilityPanel from './SrcAccountabilityPanel';
import FinancialAnalyticsPanel from './FinancialAnalyticsPanel';
import DeliveryPerformancePanel from './DeliveryPerformancePanel';
import ExportModal from './ExportModal';
import '../styles/admin-analytics.css';
import '../styles/university-analytics.css';
import '../styles/src-accountability.css';
import '../styles/financial-analytics.css';
import '../styles/delivery-analytics.css';

export default function AdminAnalyticsDashboard() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [trends, setTrends] = useState<Record<string, unknown>[] | null>(null);
  const [reviewTimes, setReviewTimes] = useState<Record<string, unknown> | null>(null);
  const [payments, setPayments] = useState<Record<string, unknown> | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, unknown> | null>(null);
  const [universities, setUniversities] = useState<Record<string, unknown>[] | null>(null);
  const [srcAccountability, setSrcAccountability] = useState<Record<string, unknown> | null>(null);
  const [financial, setFinancial] = useState<Record<string, unknown> | null>(null);
  const [deliveryPerformance, setDeliveryPerformance] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  // Fetch all analytics data
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [overviewRes, trendsRes, reviewRes, paymentsRes, deliveriesRes, universitiesRes, srcAccountabilityRes, financialRes, deliveryPerformanceRes] =
          await Promise.all([
            authFetch(`/api/admin/analytics/overview?days=${days}`),
            authFetch(`/api/admin/analytics/trends?days=${days}`),
            authFetch(`/api/admin/analytics/review-times?days=${days}`),
            authFetch(`/api/admin/analytics/payments?days=${days}`),
            authFetch(`/api/admin/analytics/deliveries?days=${days}`),
            authFetch(`/api/admin/analytics/universities?days=${days}`),
            authFetch(`/api/admin/analytics/src-accountability?days=${days}`),
            authFetch(`/api/admin/analytics/financial?days=${days}`),
            authFetch(`/api/admin/analytics/delivery-performance?days=${days}`),
          ]);

        if (!overviewRes.ok)
          throw new Error('Failed to fetch overview');
        if (!trendsRes.ok)
          throw new Error('Failed to fetch trends');
        if (!reviewRes.ok)
          throw new Error('Failed to fetch review times');
        if (!paymentsRes.ok)
          throw new Error('Failed to fetch payments');
        if (!deliveriesRes.ok)
          throw new Error('Failed to fetch deliveries');
        if (!universitiesRes.ok)
          throw new Error('Failed to fetch universities');
        if (!srcAccountabilityRes.ok)
          throw new Error('Failed to fetch SRC accountability');
        if (!financialRes.ok)
          throw new Error('Failed to fetch financial analytics');
        if (!deliveryPerformanceRes.ok)
          throw new Error('Failed to fetch delivery performance analytics');

        const [overviewData, trendsData, reviewData, paymentsData, deliveriesData, universitiesData, srcAccountabilityData, financialData, deliveryPerformanceData] =
          await Promise.all([
            overviewRes.json(),
            trendsRes.json(),
            reviewRes.json(),
            paymentsRes.json(),
            deliveriesRes.json(),
            universitiesRes.json(),
            srcAccountabilityRes.json(),
            financialRes.json(),
            deliveryPerformanceRes.json(),
          ]);

        setOverview(overviewData.data);
        setTrends(trendsData.data);
        setReviewTimes(reviewData.data);
        setPayments(paymentsData.data);
        setDeliveries(deliveriesData.data);
        setUniversities(universitiesData.data);
        setSrcAccountability(srcAccountabilityData);
        setFinancial(financialData);
        setDeliveryPerformance(deliveryPerformanceData);
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError((err as Error).message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [authFetch, days, user]);

  if (!user || user.role !== 'ADMIN') {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Admin Analytics Dashboard</h1>
        <div className="analytics-controls">
          <button
            className="audit-logs-button"
            onClick={() => navigate('/admin/audit-logs')}
            title="View Audit Logs"
          >
            📋 Audit Logs
          </button>
          <button
            className="export-button"
            onClick={() => setShowExportModal(true)}
          >
            <Download size={18} />
            Export Reports
          </button>
          <label htmlFor="days-select">Time Period:</label>
          <select
            id="days-select"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="days-select"
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={60}>Last 60 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="overview-cards">
          <div className="metric-card">
            <div className="metric-label">Total Applications</div>
            <div className="metric-value">{overview.applications.total}</div>
            <div className="metric-subtext">
              Approval Rate: {overview.applications.approvalRate}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Total Payments</div>
            <div className="metric-value">₵{overview.payments.total.toFixed(2)}</div>
            <div className="metric-subtext">
              Collected: {overview.payments.completionRate}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Deliveries</div>
            <div className="metric-value">
              {overview.deliveries.completed}/{overview.deliveries.total}
            </div>
            <div className="metric-subtext">
              Completion: {overview.deliveries.completionRate}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Rejection Rate</div>
            <div className="metric-value">{overview.applications.rejectionRate}</div>
            <div className="metric-subtext">
              SRC + Admin Rejections
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Application Trends */}
        {trends && (
          <div className="chart-container">
            <h2>Application Trends (Last {days} Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="#4ade80"
                  name="Approved"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#f59e0b"
                  name="Pending"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="#ef4444"
                  name="Rejected"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Trends */}
        {payments && (
          <div className="chart-container">
            <h2>Payment Trends (Last {days} Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={payments.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Bar dataKey="collected" stackId="a" fill="#4ade80" name="Collected" />
                <Bar dataKey="verified" stackId="a" fill="#3b82f6" name="Verified" />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Review Times */}
        {reviewTimes && (
          <div className="chart-container metric-display">
            <h2>Average Review Times</h2>
            <div className="review-metrics">
              <div className="review-metric">
                <div className="review-label">SRC Review</div>
                <div className="review-value">
                  {reviewTimes.srcReview.averageDays} days
                </div>
                <div className="review-subtext">
                  ({reviewTimes.srcReview.averageHours} hours)
                </div>
                <div className="review-count">
                  {reviewTimes.srcReview.applicationsReviewed} applications reviewed
                </div>
              </div>

              <div className="review-metric">
                <div className="review-label">Admin Review</div>
                <div className="review-value">
                  {reviewTimes.adminReview.averageDays} days
                </div>
                <div className="review-subtext">
                  ({reviewTimes.adminReview.averageHours} hours)
                </div>
                <div className="review-count">
                  {reviewTimes.adminReview.applicationsReviewed} applications reviewed
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Trends */}
        {deliveries && (
          <div className="chart-container">
            <h2>Delivery Trends (Last {days} Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deliveries.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#4ade80"
                  name="Delivered"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#f59e0b"
                  name="Pending"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment Status Breakdown */}
        {payments && (
          <div className="chart-container">
            <h2>Payment Status Distribution</h2>
            <div className="payment-breakdown">
              <div className="payment-stat">
                <div className="stat-label">Collected</div>
                <div className="stat-amount">₵{payments.summary.collected.amount.toFixed(2)}</div>
                <div className="stat-percentage">{payments.summary.collected.percentage}</div>
              </div>

              <div className="payment-stat">
                <div className="stat-label">Verified</div>
                <div className="stat-amount">₵{payments.summary.verified.amount.toFixed(2)}</div>
                <div className="stat-percentage">{payments.summary.verified.percentage}</div>
              </div>

              <div className="payment-stat">
                <div className="stat-label">Pending</div>
                <div className="stat-amount">₵{payments.summary.pending.amount.toFixed(2)}</div>
                <div className="stat-percentage">{payments.summary.pending.percentage}</div>
              </div>

              <div className="payment-stat">
                <div className="stat-label">Failed</div>
                <div className="stat-amount">₵{payments.summary.failed.amount.toFixed(2)}</div>
                <div className="stat-percentage">{payments.summary.failed.percentage}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SRC Accountability Section */}
      {srcAccountability && (
        <SrcAccountabilityPanel
          data={srcAccountability.data}
          summary={srcAccountability.summary}
          loading={false}
        />
      )}

      {/* Financial Analytics Section */}
      {financial && (
        <FinancialAnalyticsPanel
          summary={financial.summary}
          unpaidDeliveries={financial.unpaidDeliveries}
          revenueByUniversity={financial.revenueByUniversity}
          revenueByProduct={financial.revenueByProduct}
          loading={false}
        />
      )}

      {/* Delivery Performance Section */}
      {deliveryPerformance && (
        <DeliveryPerformancePanel
          data={deliveryPerformance}
          loading={false}
        />
      )}

      {/* University Performance Section */}
      {universities && (
        <UniversityPerformancePanel data={universities} loading={false} />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
