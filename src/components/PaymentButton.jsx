/**
 * PaymentButton Component
 * Displays payment button only when application is eligible for payment
 * 
 * Features:
 * - Shows button only if application is APPROVED
 * - Displays installment amount (30%)
 * - Initiates payment with backend
 * - Handles errors gracefully
 * - Shows loading state
 * - Disables button during processing
 * 
 * Usage:
 * <PaymentButton 
 *   applicationId="app_123" 
 *   status="APPROVED"
 *   laptopPrice={3000}
 * />
 */

import React, { useState } from 'react';
import usePayment from '../hooks/usePayment';

const PaymentButton = ({ applicationId, status, laptopPrice }) => {
  const { initializing, error, initiatePayment, clearError } = usePayment();
  const [showError, setShowError] = useState(false);

  // Only show button if application is APPROVED
  if (status !== 'APPROVED') {
    return null;
  }

  // Calculate 30% installment amount
  const installmentAmount = Math.round(laptopPrice * 0.30 * 100) / 100;

  const handlePaymentClick = async () => {
    setShowError(false);
    clearError();

    if (!applicationId) {
      setShowError(true);
      return;
    }

    const result = await initiatePayment(applicationId);

    if (!result.success) {
      setShowError(true);
    }
    // If successful, user will be redirected to Paystack checkout page
  };

  return (
    <div className="payment-button-container">
      {/* Error Alert */}
      {showError && error && (
        <div className="payment-error-alert alert alert-danger" role="alert">
          <div className="alert-title">
            {error.code === 'DUPLICATE_PAYMENT' 
              ? '💳 Already Paid' 
              : error.code === 'OWNERSHIP_MISMATCH' 
              ? '🔒 Not Authorized' 
              : error.code === 'APPLICATION_NOT_APPROVED'
              ? '⏳ Not Ready' 
              : '❌ Payment Error'}
          </div>
          <div className="alert-message">
            {error.message}
          </div>
          {error.code === 'DUPLICATE_PAYMENT' && error.existingPayment && (
            <div className="alert-details mt-2 text-sm">
              <p>Payment Reference: <code>{error.existingPayment.reference}</code></p>
              <p>Amount: <strong>GHS {error.existingPayment.amount}</strong></p>
              <p>Completed: {new Date(error.existingPayment.completedAt).toLocaleDateString()}</p>
            </div>
          )}
          <button
            className="btn-close"
            type="button"
            onClick={() => setShowError(false)}
            aria-label="Close"
          />
        </div>
      )}

      {/* Payment Button */}
      <div className="payment-button-wrapper">
        <button
          type="button"
          className="btn btn-primary btn-lg payment-button"
          onClick={handlePaymentClick}
          disabled={initializing}
          aria-label={`Pay GHS ${installmentAmount} installment`}
        >
          {initializing ? (
            <>
              <span className="spinner" aria-hidden="true" />
              {' '}Processing...
            </>
          ) : (
            <>
              💳 Pay 30% Installment
              <br />
              <span className="amount">GHS {installmentAmount.toFixed(2)}</span>
            </>
          )}
        </button>

        {/* Info Text */}
        <div className="payment-info mt-3">
          <p className="text-muted">
            <small>
              ℹ️ You will be redirected to Paystack secure checkout page
            </small>
          </p>
          <p className="text-muted">
            <small>
              💰 Laptop Price: <strong>GHS {laptopPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              <br />
              📊 Your Payment: <strong>GHS {installmentAmount.toFixed(2)} (30%)</strong>
            </small>
          </p>
        </div>
      </div>

      <style jsx>{`
        .payment-button-container {
          margin: 2rem 0;
        }

        .payment-error-alert {
          border-left: 4px solid #dc3545;
          background-color: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 0.25rem;
          margin-bottom: 1.5rem;
        }

        .alert-title {
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .alert-message {
          margin-bottom: 0.5rem;
        }

        .alert-details {
          background-color: rgba(0, 0, 0, 0.05);
          padding: 0.75rem;
          border-radius: 0.25rem;
        }

        .alert-details code {
          background-color: #fff3cd;
          padding: 0.2rem 0.4rem;
          border-radius: 0.2rem;
          font-size: 0.85rem;
          word-break: break-all;
        }

        .btn-close {
          float: right;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1;
          color: #000;
          text-shadow: 0 1px 0 #fff;
          opacity: 0.5;
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
        }

        .btn-close:hover {
          opacity: 0.75;
        }

        .payment-button-wrapper {
          text-align: center;
        }

        .payment-button {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
          min-width: 250px;
          white-space: normal;
          line-height: 1.5;
        }

        .payment-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .payment-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .payment-button .amount {
          display: block;
          font-size: 1.3rem;
          margin-top: 0.25rem;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .payment-info {
          text-align: center;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .payment-info small {
          display: block;
        }

        .payment-info strong {
          color: #333;
        }

        @media (max-width: 576px) {
          .payment-button {
            min-width: 100%;
            padding: 0.875rem 1rem;
            font-size: 1rem;
          }

          .payment-button .amount {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentButton;
