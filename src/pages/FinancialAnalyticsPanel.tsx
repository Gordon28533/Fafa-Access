import '../styles/financial-analytics.css';

interface UnpaidDelivery {
  applicationId: string;
  studentName: string;
  studentEmail: string;
  universityName: string;
  laptopBrand: string;
  laptopModel: string;
  laptopPrice: number;
  outstandingAmount: number;
  deliveredAt: string;
  daysOverdue: number;
}

interface RevenueByUniversity {
  universityName: string;
  universityId: string;
  totalRevenue: number;
  initial70: number;
  final30: number;
  paymentCount: number;
}

interface RevenueByProduct {
  laptopId: string;
  brand: string;
  model: string;
  totalRevenue: number;
  initial70: number;
  final30: number;
  unitsSold: number;
}

interface FinancialSummary {
  totalRevenue: number;
  initial70Total: number;
  final30Total: number;
  initial70Percentage: string;
  final30Percentage: string;
  totalOutstanding: number;
  expected30Outstanding: number;
  unpaidDeliveriesCount: number;
  paymentCompletionRate: number;
  totalPayments: number;
  initial70Count: number;
  final30Count: number;
  currency: string;
}

interface FinancialAnalyticsPanelProps {
  summary: FinancialSummary;
  unpaidDeliveries: UnpaidDelivery[];
  revenueByUniversity: RevenueByUniversity[];
  revenueByProduct: RevenueByProduct[];
  loading?: boolean;
}

const FinancialAnalyticsPanel: React.FC<FinancialAnalyticsPanelProps> = ({
  summary,
  unpaidDeliveries,
  revenueByUniversity,
  revenueByProduct,
  loading = false
}) => {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percent: string | number) => {
    return `${parseFloat(percent.toString()).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="financial-analytics">
        <div className="financial-analytics-header">
          <h2>Financial Analytics</h2>
        </div>
        <p className="text-gray-600">Loading financial data...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="financial-analytics">
        <div className="financial-analytics-header">
          <h2>Financial Analytics</h2>
        </div>
        <p className="text-gray-600">No financial data available.</p>
      </div>
    );
  }

  return (
    <div className="financial-analytics">
      <div className="financial-analytics-header">
        <h2>Financial Analytics</h2>
        <span className="currency-badge">{summary.currency}</span>
      </div>

      {/* Revenue Summary Cards */}
      <div className="financial-summary">
        <div className="summary-card revenue-total">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <span className="summary-label">Total Revenue</span>
            <span className="summary-value">{formatCurrency(summary.totalRevenue)}</span>
            <span className="summary-sublabel">{summary.totalPayments} payments</span>
          </div>
        </div>

        <div className="summary-card initial-70">
          <div className="summary-icon">📥</div>
          <div className="summary-content">
            <span className="summary-label">70% Initial Payments</span>
            <span className="summary-value">{formatCurrency(summary.initial70Total)}</span>
            <span className="summary-sublabel">
              {formatPercentage(summary.initial70Percentage)} • {summary.initial70Count} payments
            </span>
          </div>
        </div>

        <div className="summary-card final-30">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <span className="summary-label">30% Final Payments</span>
            <span className="summary-value">{formatCurrency(summary.final30Total)}</span>
            <span className="summary-sublabel">
              {formatPercentage(summary.final30Percentage)} • {summary.final30Count} payments
            </span>
          </div>
        </div>

        <div className="summary-card outstanding">
          <div className="summary-icon">⚠️</div>
          <div className="summary-content">
            <span className="summary-label">Outstanding Amount</span>
            <span className="summary-value danger">{formatCurrency(summary.totalOutstanding)}</span>
            <span className="summary-sublabel">
              {summary.unpaidDeliveriesCount} unpaid deliveries
            </span>
          </div>
        </div>

        <div className="summary-card completion-rate">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <span className="summary-label">Completion Rate</span>
            <span className={`summary-value ${summary.paymentCompletionRate >= 70 ? 'success' : 'warning'}`}>
              {formatPercentage(summary.paymentCompletionRate)}
            </span>
            <span className="summary-sublabel">
              {summary.final30Count} of {summary.initial70Count} completed
            </span>
          </div>
        </div>
      </div>

      {/* Unpaid Deliveries Table */}
      {unpaidDeliveries && unpaidDeliveries.length > 0 && (
        <div className="financial-section">
          <h3 className="section-title">
            Unpaid Delivered Laptops 
            <span className="count-badge danger">{unpaidDeliveries.length}</span>
          </h3>
          
          <div className="table-container">
            <table className="financial-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>University</th>
                  <th>Laptop</th>
                  <th>Price</th>
                  <th className="numeric">Outstanding</th>
                  <th className="numeric">Delivered</th>
                  <th className="numeric">Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {unpaidDeliveries.map((delivery) => (
                  <tr key={delivery.applicationId} className="unpaid-row">
                    <td>
                      <div className="student-info">
                        <div className="student-name">{delivery.studentName}</div>
                        <div className="student-email">{delivery.studentEmail}</div>
                      </div>
                    </td>
                    <td>{delivery.universityName}</td>
                    <td>
                      <div className="laptop-info">
                        {delivery.laptopBrand} {delivery.laptopModel}
                      </div>
                    </td>
                    <td>{formatCurrency(delivery.laptopPrice)}</td>
                    <td className="numeric danger">{formatCurrency(delivery.outstandingAmount)}</td>
                    <td className="date-cell">
                      {new Date(delivery.deliveredAt).toLocaleDateString()}
                    </td>
                    <td className={`numeric ${delivery.daysOverdue > 14 ? 'danger' : delivery.daysOverdue > 7 ? 'warning' : ''}`}>
                      {delivery.daysOverdue} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue by University */}
      {revenueByUniversity && revenueByUniversity.length > 0 && (
        <div className="financial-section">
          <h3 className="section-title">Revenue by University</h3>
          
          <div className="table-container">
            <table className="financial-table">
              <thead>
                <tr>
                  <th>University</th>
                  <th className="numeric">Total Revenue</th>
                  <th className="numeric">70% Payments</th>
                  <th className="numeric">30% Payments</th>
                  <th className="numeric">Payment Count</th>
                </tr>
              </thead>
              <tbody>
                {revenueByUniversity.map((uni) => (
                  <tr key={uni.universityId || uni.universityName}>
                    <td className="university-name">{uni.universityName}</td>
                    <td className="numeric revenue">{formatCurrency(uni.totalRevenue)}</td>
                    <td className="numeric">{formatCurrency(uni.initial70)}</td>
                    <td className="numeric">{formatCurrency(uni.final30)}</td>
                    <td className="numeric">{uni.paymentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue by Product */}
      {revenueByProduct && revenueByProduct.length > 0 && (
        <div className="financial-section">
          <h3 className="section-title">Revenue by Product</h3>
          
          <div className="table-container">
            <table className="financial-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Model</th>
                  <th className="numeric">Units Sold</th>
                  <th className="numeric">Total Revenue</th>
                  <th className="numeric">70% Payments</th>
                  <th className="numeric">30% Payments</th>
                </tr>
              </thead>
              <tbody>
                {revenueByProduct.map((product) => (
                  <tr key={product.laptopId}>
                    <td className="product-brand">{product.brand}</td>
                    <td className="product-model">{product.model}</td>
                    <td className="numeric">{product.unitsSold}</td>
                    <td className="numeric revenue">{formatCurrency(product.totalRevenue)}</td>
                    <td className="numeric">{formatCurrency(product.initial70)}</td>
                    <td className="numeric">{formatCurrency(product.final30)}</td>
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

export default FinancialAnalyticsPanel;
