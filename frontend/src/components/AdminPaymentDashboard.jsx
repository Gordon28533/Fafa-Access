/**
 * Admin Payment Dashboard Component
 * 
 * READ-ONLY admin interface for viewing all payment states across the system.
 * 
 * FEATURES:
 * - View all payments with paid/unpaid status
 * - Display payment references and dates
 * - Filter by status (PENDING, COMPLETED, FAILED)
 * - Search by payment reference or application reference
 * - Sort by date, amount, or status
 * - Pagination for large datasets
 * - View detailed payment information
 * - Export payment data (optional)
 * 
 * SECURITY:
 * - Requires admin authentication
 * - Read-only access (no modifications allowed)
 * - All API calls include JWT token
 * 
 * Created: February 8, 2024
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function AdminPaymentDashboard() {
  // State management
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    startDate: '',
    endDate: '',
    sortBy: 'initiated_at',
    sortOrder: 'desc'
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  });

  // Fetch payments data
  useEffect(() => {
    fetchPayments();
  }, [filters, pagination.currentPage, fetchPayments]);

  // Fetch summary statistics
  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/payments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payments');
      }

      const result = await response.json();
      setPayments(result.data.payments);
      setPagination(result.data.pagination);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/admin/payments/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSummary(result.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      type: '',
      search: '',
      startDate: '',
      endDate: '',
      sortBy: 'initiated_at',
      sortOrder: 'desc'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      COMPLETED: { color: 'success', icon: '✅', label: 'Paid' },
      PENDING: { color: 'warning', icon: '⏳', label: 'Pending' },
      FAILED: { color: 'danger', icon: '❌', label: 'Failed' }
    };

    const config = statusConfig[status] || { color: 'secondary', icon: '?', label: status };

    return (
      <span className={`badge bg-${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return `GHS ${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="h3 mb-1">💳 Payment Management</h1>
          <p className="text-muted">View and monitor all payment transactions (Read-only)</p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-outline-secondary" onClick={fetchPayments}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-primary">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Payments</h6>
                <h3 className="mb-0">{summary.overview.totalPayments}</h3>
                <small className="text-muted">
                  {formatCurrency(summary.overview.totalAmount)}
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-success">
              <div className="card-body">
                <h6 className="text-muted mb-2">✅ Completed</h6>
                <h3 className="mb-0 text-success">
                  {summary.byStatus.find(s => s.status === 'COMPLETED')?.count || 0}
                </h3>
                <small className="text-muted">
                  {formatCurrency(summary.overview.completedAmount)}
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-warning">
              <div className="card-body">
                <h6 className="text-muted mb-2">⏳ Pending</h6>
                <h3 className="mb-0 text-warning">
                  {summary.byStatus.find(s => s.status === 'PENDING')?.count || 0}
                </h3>
                <small className="text-muted">
                  {formatCurrency(summary.overview.pendingAmount)}
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-danger">
              <div className="card-body">
                <h6 className="text-muted mb-2">❌ Failed</h6>
                <h3 className="mb-0 text-danger">
                  {summary.byStatus.find(s => s.status === 'FAILED')?.count || 0}
                </h3>
                <small className="text-muted">Last 30 days</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">✅ Paid</option>
                <option value="PENDING">⏳ Pending</option>
                <option value="FAILED">❌ Failed</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="INSTALLMENT">30% Installment</option>
                <option value="FULL_PAYMENT">Full Payment</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Reference number..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">&nbsp;</label>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="initiated_at">Date Initiated</option>
                <option value="completed_at">Date Completed</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Order</label>
              <select
                className="form-select"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error:</strong> {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading payments...</p>
        </div>
      )}

      {/* Payments Table */}
      {!loading && payments.length > 0 && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Payment Records ({pagination.totalCount} total)
            </h5>
            <small className="text-muted">
              Page {pagination.currentPage} of {pagination.totalPages}
            </small>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Status</th>
                  <th>Payment Reference</th>
                  <th>Application</th>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Initiated</th>
                  <th>Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>
                      <code className="text-primary">{payment.paymentReference}</code>
                      {payment.paystackReference && (
                        <div>
                          <small className="text-muted">
                            Paystack: {payment.paystackReference}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <Link to={`/admin/applications/${payment.applicationId}`}>
                        {payment.application.reference}
                      </Link>
                      <div>
                        <small className="text-muted">
                          {payment.application.status}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>{payment.student.name}</div>
                      <small className="text-muted">{payment.student.email}</small>
                    </td>
                    <td>
                      <strong>{formatCurrency(payment.amount)}</strong>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {payment.type === 'INSTALLMENT' ? '30%' : 'Full'}
                      </span>
                    </td>
                    <td>
                      <small>{formatDate(payment.initiatedAt)}</small>
                    </td>
                    <td>
                      <small>
                        {payment.completedAt ? formatDate(payment.completedAt) : '—'}
                      </small>
                    </td>
                    <td>
                      <Link
                        to={`/admin/payments/${payment.id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="card-footer">
            <nav>
              <ul className="pagination pagination-sm mb-0 justify-content-center">
                <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    Previous
                  </button>
                </li>
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <li
                      key={pageNum}
                      className={`page-item ${pageNum === pagination.currentPage ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </li>
                  );
                })}
                {pagination.totalPages > 5 && (
                  <li className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                )}
                <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && payments.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="mb-3" style={{ fontSize: '48px' }}>📭</div>
            <h5>No Payments Found</h5>
            <p className="text-muted">
              {filters.status || filters.search
                ? 'Try adjusting your filters'
                : 'No payment records are available yet'}
            </p>
            {(filters.status || filters.search) && (
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Read-Only Notice */}
      <div className="alert alert-info mt-4">
        <strong>ℹ️ Read-Only Mode:</strong> This dashboard provides view-only access to payment
        data. No modifications can be made through this interface. All payment processing happens
        through the student payment portal.
      </div>
    </div>
  );
}
