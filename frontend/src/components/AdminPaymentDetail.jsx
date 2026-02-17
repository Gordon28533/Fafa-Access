/**
 * Admin Payment Detail Component
 * 
 * Displays comprehensive details of a single payment transaction.
 * Read-only view with full payment and verification information.
 * 
 * FEATURES:
 * - Payment status and timeline
 * - Student and application details
 * - Paystack verification data
 * - Payment reference numbers
 * - Transaction dates and amounts
 * - Navigation back to dashboard
 * 
 * Created: February 8, 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function AdminPaymentDetail() {
  const { paymentId } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId, fetchPaymentDetails]);

  const fetchPaymentDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payment details');
      }

      const result = await response.json();
      setPayment(result.data);
    } catch (err) {
      console.error('Error fetching payment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  const formatCurrency = (amount) => {
    return `GHS ${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: 'success',
      PENDING: 'warning',
      FAILED: 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      COMPLETED: '✅',
      PENDING: '⏳',
      FAILED: '❌'
    };
    return icons[status] || '❓';
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h5>Error Loading Payment</h5>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/payments')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          <h5>Payment Not Found</h5>
          <p>The requested payment could not be found.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/payments')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/admin/payments">Payment Dashboard</Link>
              </li>
              <li className="breadcrumb-item active">Payment Details</li>
            </ol>
          </nav>
          <h1 className="h3 mb-1">Payment Details</h1>
          <p className="text-muted">
            Reference: <code>{payment.paymentReference}</code>
          </p>
        </div>
        <div className="col-md-4 text-end">
          <button
            className="btn btn-outline-secondary me-2"
            onClick={fetchPaymentDetails}
          >
            🔄 Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/payments')}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`alert alert-${getStatusColor(payment.status)} mb-4`}>
        <div className="d-flex align-items-center">
          <div style={{ fontSize: '32px', marginRight: '16px' }}>
            {getStatusIcon(payment.status)}
          </div>
          <div>
            <h5 className="mb-1">
              Payment Status: {payment.status}
            </h5>
            <p className="mb-0">
              {payment.status === 'COMPLETED' && 'This payment has been successfully completed and verified.'}
              {payment.status === 'PENDING' && 'This payment is awaiting confirmation from Paystack.'}
              {payment.status === 'FAILED' && 'This payment transaction failed or was declined.'}
            </p>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column - Payment Information */}
        <div className="col-md-6">
          {/* Payment Details Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">💳 Payment Information</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">Amount:</td>
                    <td>
                      <strong className="h5 mb-0">{formatCurrency(payment.amount)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Currency:</td>
                    <td>{payment.currency}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Type:</td>
                    <td>
                      <span className="badge bg-info">
                        {payment.type === 'INSTALLMENT' ? '30% Installment' : 'Full Payment'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Payment Reference:</td>
                    <td>
                      <code className="text-primary">{payment.paymentReference}</code>
                    </td>
                  </tr>
                  {payment.paystackReference && (
                    <tr>
                      <td className="text-muted">Paystack Reference:</td>
                      <td>
                        <code className="text-success">{payment.paystackReference}</code>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-muted">Status:</td>
                    <td>
                      <span className={`badge bg-${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)} {payment.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">⏱️ Timeline</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">Initiated:</td>
                    <td>{formatDateTime(payment.initiatedAt)}</td>
                  </tr>
                  {payment.completedAt && (
                    <tr>
                      <td className="text-muted">Completed:</td>
                      <td className="text-success">
                        <strong>{formatDateTime(payment.completedAt)}</strong>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-muted">Created:</td>
                    <td>{formatDateTime(payment.createdAt)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">Last Updated:</td>
                    <td>{formatDateTime(payment.updatedAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Student & Application Info */}
        <div className="col-md-6">
          {/* Student Details Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">👤 Student Information</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">Name:</td>
                    <td>
                      <strong>{payment.student.fullName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Email:</td>
                    <td>
                      <a href={`mailto:${payment.student.email}`}>
                        {payment.student.email}
                      </a>
                    </td>
                  </tr>
                  {payment.student.phone && (
                    <tr>
                      <td className="text-muted">Phone:</td>
                      <td>
                        <a href={`tel:${payment.student.phone}`}>
                          {payment.student.phone}
                        </a>
                      </td>
                    </tr>
                  )}
                  {payment.student.indexNumber && (
                    <tr>
                      <td className="text-muted">Index Number:</td>
                      <td>{payment.student.indexNumber}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="text-muted">Student ID:</td>
                    <td>
                      <code>{payment.student.id}</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Application Details Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">📄 Application Information</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted">Application Ref:</td>
                    <td>
                      <Link to={`/admin/applications/${payment.applicationId}`}>
                        {payment.application.reference}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">Status:</td>
                    <td>
                      <span className="badge bg-info">
                        {payment.application.status}
                      </span>
                    </td>
                  </tr>
                  {payment.application.laptop && (
                    <>
                      <tr>
                        <td className="text-muted">Laptop:</td>
                        <td>
                          {payment.application.laptop.brand} {payment.application.laptop.model}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Laptop Price:</td>
                        <td>
                          <strong>{formatCurrency(payment.application.laptop.price)}</strong>
                        </td>
                      </tr>
                      {payment.type === 'INSTALLMENT' && (
                        <tr>
                          <td className="text-muted">Payment %:</td>
                          <td>
                            {((payment.amount / payment.application.laptop.price) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Details (if available) */}
      {payment.verificationResult && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">🔍 Paystack Verification Data</h5>
          </div>
          <div className="card-body">
            <pre className="bg-light p-3 rounded">
              <code>{JSON.stringify(payment.verificationResult, null, 2)}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Read-Only Notice */}
      <div className="alert alert-info">
        <strong>ℹ️ Read-Only View:</strong> This is a view-only interface. Payment records cannot
        be modified through this dashboard. All payment processing is handled automatically through
        the Paystack integration.
      </div>
    </div>
  );
}
