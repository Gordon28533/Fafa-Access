/**
 * PaymentVerification Component
 * Handles payment verification after Paystack redirect
 * 
 * Shows on success page after student completes Paystack payment
 * Extracts reference from URL query params
 * Verifies payment with backend
 * Shows success/failure with next steps
 * 
 * Usage (in router):
 * <Route path="/payment/success" element={<PaymentVerification />} />
 * <Route path="/payment/failed" element={<PaymentVerification failed={true} />} />
 * 
 * URL format:
 * /payment/success?reference=INST/INIT-APP123456-12345-ABC
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import usePayment from '../hooks/usePayment';

const PaymentVerification = ({ failed = false }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment } = usePayment();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(!failed);
  const [error, setError] = useState(null);

  const reference = searchParams.get('reference');

  useEffect(() => {
    if (failed) {
      // User cancelled or payment failed on Paystack
      setLoading(false);
      setError({
        title: 'Payment Cancelled',
        message: 'Your payment was not completed. Please try again.',
        code: 'PAYMENT_CANCELLED',
      });
      return;
    }

    if (!reference) {
      setLoading(false);
      setError({
        title: 'Invalid Payment Reference',
        message: 'Payment reference not found in URL.',
        code: 'MISSING_REFERENCE',
      });
      return;
    }

    // Verify payment with backend
    const verifyWithBackend = async () => {
      const result = await verifyPayment(reference);

      if (result.success && result.verified) {
        // Payment verified successfully
        setVerification({
          successful: true,
          payment: result.payment,
          reference: reference,
        });
      } else {
        // Verification failed
        setError({
          title: 'Payment Verification Failed',
          message: result.error || 'Could not verify your payment.',
          code: result.code || 'VERIFICATION_FAILED',
        });
      }

      setLoading(false);
    };

    verifyWithBackend();
  }, [reference, failed, verifyPayment]);

  if (loading) {
    return (
      <div className="payment-verification-container">
        <div className="verification-loading">
          <div className="spinner-border" role="status">
            <span className="sr-only">Verifying payment...</span>
          </div>
          <h3>Verifying Your Payment</h3>
          <p>Please wait while we confirm your payment with Paystack...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-verification-container">
        <div className="verification-error">
          <div className="error-icon">❌</div>
          <h2>{error.title}</h2>
          <p className="error-message">{error.message}</p>

          {error.code === 'DUPLICATE_PAYMENT' && (
            <div className="alert alert-info mt-3">
              <strong>ℹ️ Note:</strong> You have already completed this payment.
              Your laptop will be delivered soon.
            </div>
          )}

          <div className="button-group mt-4">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/applications')}
            >
              Back to Applications
            </button>
            <button
              className="btn btn-secondary ms-2"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verification && verification.successful) {
    const payment = verification.payment;

    return (
      <div className="payment-verification-container">
        <div className="verification-success">
          <div className="success-icon">✅</div>
          <h2>Payment Successful!</h2>
          <p>Your 30% installment payment has been confirmed.</p>

          {/* Payment Details */}
          <div className="payment-details card mt-4">
            <div className="card-body">
              <h5 className="card-title">Payment Details</h5>

              <div className="detail-row">
                <label>Amount Paid</label>
                <span className="amount">
                  GHS {payment.amount?.toFixed(2) || 'N/A'}
                </span>
              </div>

              <div className="detail-row">
                <label>Currency</label>
                <span>{payment.currency}</span>
              </div>

              <div className="detail-row">
                <label>Payment Reference</label>
                <span className="reference" title={payment.reference}>
                  {payment.reference}
                </span>
              </div>

              <div className="detail-row">
                <label>Payment Method</label>
                <span className="channel">
                  {payment.channel 
                    ? payment.channel.charAt(0).toUpperCase() + payment.channel.slice(1)
                    : 'N/A'}
                </span>
              </div>

              <div className="detail-row">
                <label>Status</label>
                <span className="status-badge badge bg-success">
                  {payment.status}
                </span>
              </div>

              {payment.completedAt && (
                <div className="detail-row">
                  <label>Completed On</label>
                  <span>
                    {new Date(payment.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="next-steps card mt-4">
            <div className="card-body">
              <h5 className="card-title">What's Next?</h5>
              <ol className="steps-list">
                <li>
                  <strong>Payment Confirmed</strong>
                  <p>Your payment has been received and verified.</p>
                </li>
                <li>
                  <strong>Application Pending</strong>
                  <p>Your application is being processed for delivery scheduling.</p>
                </li>
                <li>
                  <strong>Delivery Scheduled</strong>
                  <p>You will receive an email with delivery details soon.</p>
                </li>
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="button-group mt-4">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/applications')}
            >
              View Your Applications
            </button>
            <button
              className="btn btn-secondary ms-2"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>

          {/* Email Confirmation Notice */}
          <div className="email-notice alert alert-info mt-4">
            <strong>📧 Check Your Email</strong>
            <p>A payment confirmation email has been sent to your registered email address.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-verification-container">
      <div className="verification-unknown">
        <p>Unable to determine payment status.</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/applications')}
        >
          Back to Applications
        </button>
      </div>
    </div>
  );
};

// Styles
const styles = `
  .payment-verification-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .verification-loading,
  .verification-error,
  .verification-success,
  .verification-unknown {
    background: white;
    border-radius: 1rem;
    padding: 3rem 2rem;
    max-width: 600px;
    width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    text-align: center;
  }

  .spinner-border {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1.5rem;
    border-width: 0.3em;
  }

  .verification-loading h3 {
    color: #333;
    margin-bottom: 0.5rem;
  }

  .verification-loading p {
    color: #666;
    font-size: 0.95rem;
  }

  .error-icon,
  .success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    display: inline-block;
  }

  .verification-error h2,
  .verification-success h2 {
    color: #333;
    margin-bottom: 0.5rem;
  }

  .verification-error p,
  .verification-success p {
    color: #666;
    margin-bottom: 1.5rem;
  }

  .payment-details,
  .next-steps {
    text-align: left;
    margin-bottom: 1.5rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #eee;
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-row label {
    font-weight: 600;
    color: #555;
    margin: 0;
  }

  .detail-row span {
    color: #333;
    font-size: 0.95rem;
  }

  .detail-row .amount {
    font-weight: 700;
    font-size: 1.2rem;
    color: #28a745;
  }

  .detail-row .reference {
    font-family: monospace;
    font-size: 0.85rem;
    color: #555;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail-row .channel {
    background: #e7f3ff;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    color: #0066cc;
  }

  .status-badge {
    font-size: 0.9rem;
    padding: 0.35rem 0.75rem;
  }

  .steps-list {
    padding-left: 1.5rem;
    margin-bottom: 0;
  }

  .steps-list li {
    margin-bottom: 1.5rem;
  }

  .steps-list li:last-child {
    margin-bottom: 0;
  }

  .steps-list strong {
    display: block;
    margin-bottom: 0.25rem;
    color: #333;
  }

  .steps-list p {
    margin: 0.25rem 0 0 0;
    color: #666;
    font-size: 0.95rem;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .button-group .btn {
    min-width: 180px;
  }

  .email-notice {
    text-align: left;
    border-left: 4px solid #0c5460;
    background-color: #d1ecf1;
    color: #0c5460;
    margin-top: 1.5rem;
  }

  .email-notice strong {
    display: block;
    margin-bottom: 0.5rem;
  }

  .email-notice p {
    margin: 0;
  }

  @media (max-width: 576px) {
    .payment-verification-container {
      padding: 1rem;
    }

    .verification-loading,
    .verification-error,
    .verification-success,
    .verification-unknown {
      padding: 2rem 1.5rem;
    }

    .error-icon,
    .success-icon {
      font-size: 3rem;
    }

    .verification-error h2,
    .verification-success h2 {
      font-size: 1.75rem;
    }

    .detail-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .detail-row label {
      margin-bottom: 0.25rem;
    }

    .button-group {
      flex-direction: column;
    }

    .button-group .btn {
      width: 100%;
      margin: 0 !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default PaymentVerification;
