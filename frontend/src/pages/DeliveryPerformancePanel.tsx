import React from 'react';
import { AlertCircle, CheckCircle, Clock, TrendingDown, TrendingUp } from 'lucide-react';

interface DeliveryStatus {
  applicationId: string;
  studentName: string;
  universityName: string;
  laptopModel: string;
  deliveryStatus: string;
  deliveryDate: string | null;
  paymentVerified: boolean;
  daysToDeliver: number | null;
  daysOverdue: number;
  riskLevel: 'COMPLETE' | 'PENDING' | 'UNPAID';
}

interface UnpaidDelivery {
  applicationId: string;
  studentName: string;
  universityName: string;
  laptopModel: string;
  deliveryDate: string;
  daysOverdue: number;
  paymentStatus: string;
}

interface StaffPerformance {
  staffName: string;
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
  unpaidCount: number;
  completionRate: number;
  averageDeliveryDays: number;
  unpaidRate: number;
  performanceRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

interface OperationalRisk {
  riskType: string;
  severity: 'CRITICAL' | 'WARNING' | 'LOW';
  count: number;
  description: string;
}

interface DeliveryPerformanceData {
  success: boolean;
  data: {
    summary: {
      totalDeliveries: number;
      completedDeliveries: number;
      pendingDeliveries: number;
      unpaidDeliveries: number;
      overdueDeliveries: number;
      completionRate: number;
      paymentCollectionRate: number;
    };
    deliveryStatuses: DeliveryStatus[];
    unpaidDeliveries: UnpaidDelivery[];
    staffPerformance: StaffPerformance[];
    operationalRisks: OperationalRisk[];
    highRiskItems: UnpaidDelivery[];
  };
}

interface Props {
  data: DeliveryPerformanceData | null;
  loading: boolean;
}

const DeliveryPerformancePanel: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="delivery-performance-panel loading">
        <div className="spinner"></div>
        <p>Loading delivery performance analytics...</p>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="delivery-performance-panel error">
        <div className="error-icon">
          <AlertCircle size={32} />
        </div>
        <p>Failed to load delivery performance data</p>
      </div>
    );
  }

  const {
    summary,
    deliveryStatuses,
    unpaidDeliveries,
    staffPerformance,
    operationalRisks,
    highRiskItems,
  } = data.data;

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'COMPLETE':
        return 'risk-complete';
      case 'UNPAID':
        return 'risk-unpaid';
      case 'PENDING':
        return 'risk-pending';
      default:
        return 'risk-low';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'severity-critical';
      case 'WARNING':
        return 'severity-warning';
      case 'LOW':
        return 'severity-low';
      default:
        return 'severity-low';
    }
  };

  const getPerformanceColor = (rating: string): string => {
    switch (rating) {
      case 'EXCELLENT':
        return 'performance-excellent';
      case 'GOOD':
        return 'performance-good';
      case 'FAIR':
        return 'performance-fair';
      case 'POOR':
        return 'performance-poor';
      default:
        return 'performance-fair';
    }
  };

  return (
    <div className="delivery-performance-panel">
      <h2 className="panel-title">Delivery Performance & Risk Monitoring</h2>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <div className="summary-card">
          <div className="card-icon total">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Total Deliveries</span>
            <span className="card-value">{summary.totalDeliveries}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon completed">
            <CheckCircle size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Completed & Paid</span>
            <span className="card-value">{summary.completedDeliveries}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon pending">
            <Clock size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Pending Delivery</span>
            <span className="card-value">{summary.pendingDeliveries}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon unpaid">
            <AlertCircle size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Unpaid Deliveries</span>
            <span className="card-value">{summary.unpaidDeliveries}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon overdue">
            <TrendingDown size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Overdue Unpaid</span>
            <span className="card-value">{summary.overdueDeliveries}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon rate">
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Completion Rate</span>
            <span className="card-value">{summary.completionRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon rate">
            <CheckCircle size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Collection Rate</span>
            <span className="card-value">{summary.paymentCollectionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Operational Risks Section */}
      {operationalRisks && operationalRisks.length > 0 && (
        <div className="risks-section">
          <h3 className="section-title">
            <AlertCircle size={20} />
            Operational Risks
          </h3>
          <div className="risks-grid">
            {operationalRisks.map((risk, idx) => (
              <div key={idx} className={`risk-card ${getSeverityColor(risk.severity)}`}>
                <div className="risk-header">
                  <span className="risk-type">{risk.riskType}</span>
                  <span className={`severity-badge ${risk.severity.toLowerCase()}`}>
                    {risk.severity}
                  </span>
                </div>
                <p className="risk-description">{risk.description}</p>
                <div className="risk-count">
                  <span className="count-label">Count:</span>
                  <span className="count-value">{risk.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Risk Items */}
      {highRiskItems && highRiskItems.length > 0 && (
        <div className="high-risk-section">
          <h3 className="section-title">
            <AlertCircle size={20} />
            High-Risk Items (Overdue &gt;14 Days)
          </h3>
          <div className="table-container">
            <table className="high-risk-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>University</th>
                  <th>Laptop Model</th>
                  <th>Delivery Date</th>
                  <th>Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {highRiskItems.map((item, idx) => (
                  <tr key={idx} className="high-risk-row">
                    <td className="cell-name">{item.studentName}</td>
                    <td className="cell-university">{item.universityName}</td>
                    <td className="cell-model">{item.laptopModel}</td>
                    <td className="cell-date">
                      {new Date(item.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="cell-days">
                      <span className="days-badge overdue">{item.daysOverdue}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unpaid Deliveries */}
      {unpaidDeliveries && unpaidDeliveries.length > 0 && (
        <div className="unpaid-section">
          <h3 className="section-title">
            <AlertCircle size={20} />
            Unpaid Deliveries ({unpaidDeliveries.length})
          </h3>
          <div className="table-container">
            <table className="unpaid-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>University</th>
                  <th>Laptop Model</th>
                  <th>Delivery Date</th>
                  <th>Days Overdue</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {unpaidDeliveries.map((delivery, idx) => (
                  <tr key={idx} className="unpaid-row">
                    <td className="cell-name">{delivery.studentName}</td>
                    <td className="cell-university">{delivery.universityName}</td>
                    <td className="cell-model">{delivery.laptopModel}</td>
                    <td className="cell-date">
                      {new Date(delivery.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="cell-days">
                      <span className={`days-badge ${delivery.daysOverdue > 7 ? 'critical' : 'warning'}`}>
                        {delivery.daysOverdue}
                      </span>
                    </td>
                    <td className="cell-status">
                      <span className="status-badge unpaid">Unpaid</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Status Overview */}
      {deliveryStatuses && deliveryStatuses.length > 0 && (
        <div className="deliveries-section">
          <h3 className="section-title">Delivery Status Overview</h3>
          <div className="table-container">
            <table className="deliveries-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>University</th>
                  <th>Laptop Model</th>
                  <th>Status</th>
                  <th>Delivery Date</th>
                  <th>Days to Deliver</th>
                  <th>Payment</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {deliveryStatuses.slice(0, 20).map((delivery, idx) => (
                  <tr key={idx} className={`delivery-row ${getRiskColor(delivery.riskLevel)}`}>
                    <td className="cell-name">{delivery.studentName}</td>
                    <td className="cell-university">{delivery.universityName}</td>
                    <td className="cell-model">{delivery.laptopModel}</td>
                    <td className="cell-status">
                      <span className={`status-badge ${delivery.deliveryStatus.toLowerCase()}`}>
                        {delivery.deliveryStatus}
                      </span>
                    </td>
                    <td className="cell-date">
                      {delivery.deliveryDate
                        ? new Date(delivery.deliveryDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="cell-days">
                      {delivery.daysToDeliver ? delivery.daysToDeliver : '-'}
                    </td>
                    <td className="cell-payment">
                      <span
                        className={`payment-badge ${
                          delivery.paymentVerified ? 'verified' : 'pending'
                        }`}
                      >
                        {delivery.paymentVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="cell-risk">
                      <span className={`risk-badge ${delivery.riskLevel.toLowerCase()}`}>
                        {delivery.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deliveryStatuses.length > 20 && (
              <div className="table-footer">
                Showing 20 of {deliveryStatuses.length} deliveries
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Performance */}
      {staffPerformance && staffPerformance.length > 0 && (
        <div className="staff-section">
          <h3 className="section-title">Delivery Staff Performance</h3>
          <div className="table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Assigned</th>
                  <th>Completed</th>
                  <th>Pending</th>
                  <th>Unpaid</th>
                  <th>Completion Rate</th>
                  <th>Avg Days</th>
                  <th>Unpaid Rate</th>
                  <th>Performance Rating</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((staff, idx) => (
                  <tr key={idx} className={`staff-row ${getPerformanceColor(staff.performanceRating)}`}>
                    <td className="cell-name">{staff.staffName}</td>
                    <td className="cell-number">{staff.assignedCount}</td>
                    <td className="cell-number">{staff.completedCount}</td>
                    <td className="cell-number">{staff.pendingCount}</td>
                    <td className="cell-number">{staff.unpaidCount}</td>
                    <td className="cell-rate">
                      <div className="rate-bar">
                        <div
                          className="rate-fill"
                          style={{ width: `${Math.min(staff.completionRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="rate-text">{staff.completionRate.toFixed(1)}%</span>
                    </td>
                    <td className="cell-number">{staff.averageDeliveryDays.toFixed(1)}</td>
                    <td className="cell-rate">{staff.unpaidRate.toFixed(1)}%</td>
                    <td className="cell-rating">
                      <span className={`rating-badge ${staff.performanceRating.toLowerCase()}`}>
                        {staff.performanceRating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPerformancePanel;
