/**
 * PaymentStatus Component
 * Displays current payment status and history for an application
 * 
 * Shows:
 * - Payment status badge (Pending, Completed, Failed)
 * - Payment amount and date
 * - Payment method/channel
 * - Payment reference
 * - Next steps based on status
 * 
 * Usage:
 * <PaymentStatus applicationId="app_123" />
 */

import React, { useEffect, useState } from 'react';

const PaymentStatus = ({ applicationId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch(
          `/api/payments/application/${applicationId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch payment information');
        }

        const result = await response.json();
        setPayments(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchPayments();
    }
  }, [applicationId]);

  if (loading) {
    return (
      <div className="payment-status-container">
        <div className="loading-skeleton">
          <div className="skeleton-bar" />
          <div className="skeleton-bar" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-status-container">
        <div className="alert alert-warning">
          <strong>⚠️ Unable to load payment information</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const completedPayment = payments.find(p => p.status === 'COMPLETED');
  const pendingPayment = payments.find(p => p.status === 'PENDING');
  const failedPayment = payments.find(p => p.status === 'FAILED');

  return (
    <div className="payment-status-container">
      {/* No Payments Yet */}
      {payments.length === 0 && (
        <div className="no-payments">
          <p className="text-muted">
            <small>
              No payment records found. Click the payment button above to begin payment.
            </small>
          </p>
        </div>
      )}

      {/* Completed Payment */}
      {completedPayment && (
        <div className="payment-card completed">
          <div className="card-header">
            <h6>
              <span className="status-icon">✅</span>
              Payment Completed
            </h6>
          </div>
          <div className="card-body">
            <div className="payment-row">
              <span className="label">Amount Paid</span>
              <span className="value amount">
                GHS {completedPayment.amount?.toFixed(2)}
              </span>
            </div>
            <div className="payment-row">
              <span className="label">Date</span>
              <span className="value">
                {new Date(completedPayment.completedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="payment-row">
              <span className="label">Reference</span>
              <span className="value reference" title={completedPayment.reference}>
                {completedPayment.reference}
              </span>
            </div>
            <div className="payment-row">
              <span className="label">Type</span>
              <span className="value badge bg-primary">
                {completedPayment.type}
              </span>
            </div>
            <div className="payment-next-steps">
              <p>
                <strong>Next:</strong> Your application will be processed for delivery scheduling.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payment */}
      {pendingPayment && !completedPayment && (
        <div className="payment-card pending">
          <div className="card-header">
            <h6>
              <span className="status-icon">⏳</span>
              Payment Pending
            </h6>
          </div>
          <div className="card-body">
            <div className="payment-row">
              <span className="label">Amount</span>
              <span className="value amount">
                GHS {pendingPayment.amount?.toFixed(2)}
              </span>
            </div>
            <div className="payment-row">
              <span className="label">Status</span>
              <span className="value badge bg-warning">
                Awaiting Confirmation
              </span>
            </div>
            <div className="payment-row">
              <span className="label">Reference</span>
              <span className="value reference" title={pendingPayment.reference}>
                {pendingPayment.reference}
              </span>
            </div>
            <div className="payment-next-steps">
              <p>
                <strong>Next:</strong> Complete your payment on the Paystack checkout page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Failed Payment */}
      {failedPayment && !completedPayment && (
        <div className="payment-card failed">
          <div className="card-header">
            <h6>
              <span className="status-icon">❌</span>
              Payment Failed
            </h6>
          </div>
          <div className="card-body">
            <div className="payment-row">
              <span className="label">Attempted Amount</span>
              <span className="value amount">
                GHS {failedPayment.amount?.toFixed(2)}
              </span>
            </div>
            <div className="payment-row">
              <span className="label">Status</span>
              <span className="value badge bg-danger">
                Failed
              </span>
            </div>
            <div className="payment-next-steps">
              <p>
                <strong>Next:</strong> Please try making another payment using the button above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 1 && (
        <details className="payment-history mt-3">
          <summary>
            <small>View All Payments ({payments.length})</small>
          </summary>
          <div className="history-list mt-2">
            {payments.map((payment, index) => (
              <div key={index} className="history-item">
                <span className="history-status">
                  {payment.status === 'COMPLETED' && '✅'}
                  {payment.status === 'PENDING' && '⏳'}
                  {payment.status === 'FAILED' && '❌'}
                </span>
                <span className="history-date">
                  {payment.completedAt 
                    ? new Date(payment.completedAt).toLocaleDateString()
                    : new Date(payment.initiatedAt).toLocaleDateString()}
                </span>
                <span className="history-amount">
                  GHS {payment.amount?.toFixed(2)}
                </span>
                <span className="history-type">{payment.type}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <style jsx>{`
        .payment-status-container {
          margin: 2rem 0;
        }

        .loading-skeleton {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .skeleton-bar {
          height: 1rem;
          background: #e9ecef;
          border-radius: 0.25rem;
          margin-bottom: 0.75rem;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .no-payments {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 0.25rem;
          border-left: 4px solid #6c757d;
        }

        .payment-card {
          border: 1px solid #dee2e6;
          border-radius: 0.5rem;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .payment-card.completed {
          border-color: #28a745;
          background: #f0f8f5;
        }

        .payment-card.completed .card-header {
          background: #d4edda;
          border-bottom: 2px solid #28a745;
        }

        .payment-card.pending {
          border-color: #ffc107;
          background: #fffbf0;
        }

        .payment-card.pending .card-header {
          background: #fff3cd;
          border-bottom: 2px solid #ffc107;
        }

        .payment-card.failed {
          border-color: #dc3545;
          background: #f8f5f5;
        }

        .payment-card.failed .card-header {
          background: #f8d7da;
          border-bottom: 2px solid #dc3545;
        }

        .card-header {
          padding: 1rem;
        }

        .card-header h6 {
          margin: 0;
          font-weight: 600;
          font-size: 1rem;
        }

        .status-icon {
          margin-right: 0.5rem;
          font-size: 1.2rem;
        }

        .card-body {
          padding: 1rem;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .payment-row:last-of-type {
          border-bottom: none;
        }

        .payment-row .label {
          font-weight: 600;
          color: #666;
          font-size: 0.95rem;
        }

        .payment-row .value {
          color: #333;
          font-size: 0.95rem;
        }

        .payment-row .amount {
          font-weight: 700;
          font-size: 1.1rem;
          color: #28a745;
        }

        .payment-row .reference {
          font-family: monospace;
          font-size: 0.85rem;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .payment-next-steps {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .payment-next-steps p {
          margin: 0;
          font-size: 0.9rem;
          color: #555;
        }

        .payment-next-steps strong {
          color: #333;
        }

        .payment-history {
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 0.25rem;
          cursor: pointer;
        }

        .payment-history summary {
          list-style: none;
          outline: none;
          user-select: none;
        }

        .payment-history summary:hover {
          color: #0066cc;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .history-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          background: white;
          border-radius: 0.25rem;
          gap: 1rem;
          font-size: 0.9rem;
        }

        .history-status {
          font-size: 1.1rem;
          min-width: 24px;
        }

        .history-date {
          color: #666;
          min-width: 100px;
        }

        .history-amount {
          font-weight: 600;
          color: #333;
          min-width: 80px;
        }

        .history-type {
          background: #e7f3ff;
          color: #0066cc;
          padding: 0.2rem 0.5rem;
          border-radius: 0.2rem;
          font-size: 0.8rem;
        }

        @media (max-width: 576px) {
          .payment-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .history-item {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentStatus;
