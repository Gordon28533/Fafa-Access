/**
 * Admin SRC Invitation Manager
 * 
 * Component for admins to:
 * - Create SRC officer invitations
 * - View pending invitations
 * - Resend or cancel invitations
 * - Track acceptance status
 * 
 * Location: /admin/src-invitations
 * Requires: ADMIN role
 * 
 * Created: February 8, 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import './AdminSRCInvitations.css';

export default function AdminSRCInvitations() {
  // State management
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    created: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, accepted
  const [searchTerm, setSearchTerm] = useState('');
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data
  useEffect(() => {
    fetchInvitations();
    fetchStatistics();
    fetchUniversities();
  }, [filterStatus, fetchInvitations]);

  // Fetch universities for dropdown
  const fetchUniversities = async () => {
    try {
      const response = await fetch('/api/universities', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch universities');

      const data = await response.json();
      setUniversities(data.data.universities);
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError('Failed to load universities');
    }
  };

  // Fetch pending invitations
  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);

      let url = '/api/admin/src/invitations?';
      if (filterStatus !== 'all') {
        url += `accepted=${filterStatus === 'accepted'}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch invitations');

      const result = await response.json();
      setInvitations(result.data.invitations || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/src/statistics', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch statistics');

      const result = await response.json();
      setStats(result.data.stats);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!selectedUniversity) {
      errors.universityId = 'University is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create invitation
  const handleCreateInvitation = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/admin/src/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...formData,
          universityId: selectedUniversity,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create invitation');
      }

      // Success
      setSuccessMessage(
        `Invitation sent to ${formData.firstName} ${formData.lastName}. They will receive an email with the partnership agreement link.`
      );

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
      setSelectedUniversity('');
      setFormErrors({});
      setShowCreateModal(false);

      // Refresh data
      fetchInvitations();
      fetchStatistics();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(err.message || 'Failed to create invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend invitation
  const handleResendInvitation = async (inviteId) => {
    if (!window.confirm('Resend invitation to this SRC officer?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/src/invitations/${inviteId}/resend`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to resend invitation');
      }

      setSuccessMessage('Invitation resent successfully');
      fetchInvitations();

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError(err.message || 'Failed to resend invitation');
    }
  };

  // Cancel invitation
  const handleCancelInvitation = async (inviteId) => {
    if (!window.confirm('Cancel this invitation? The SRC officer will no longer be able to accept it.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/src/invitations/${inviteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to cancel invitation');
      }

      setSuccessMessage('Invitation cancelled');
      fetchInvitations();

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      setError(err.message || 'Failed to cancel invitation');
    }
  };

  // Filter invitations
  const filteredInvitations = invitations.filter((inv) => {
    const matchesSearch =
      inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.universityName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="admin-src-invitations">
      {/* Header */}
      <div className="header-section">
        <h1>🎓 SRC Officer Invitations</h1>
        <p>Manage SRC officer onboarding and partnership agreements</p>
      </div>

      {/* Messages */}
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Invitations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.accepted}</div>
          <div className="stat-label">Agreement Accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.created}</div>
          <div className="stat-label">Accounts Created</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.expired}</div>
          <div className="stat-label">Expired</div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Create New Invitation
        </button>

        <div className="filters">
          <input
            type="text"
            placeholder="Search by name, email, or university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control search-input"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Acceptance</option>
            <option value="accepted">Agreement Accepted</option>
          </select>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="invitations-section">
        {loading ? (
          <div className="loading">Loading invitations...</div>
        ) : filteredInvitations.length === 0 ? (
          <div className="empty-state">
            <p>No SRC invitations found</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Create your first invitation
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="invitations-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>University</th>
                  <th>Status</th>
                  <th>Agreement</th>
                  <th>Account</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitations.map((invite) => (
                  <tr key={invite.id}>
                    <td>
                      {invite.firstName} {invite.lastName}
                    </td>
                    <td>{invite.email}</td>
                    <td>{invite.universityName}</td>
                    <td>
                      <span className={`badge badge-${invite.isExpired ? 'danger' : 'info'}`}>
                        {invite.isExpired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {invite.agreementAccepted ? (
                        <span className="badge badge-success">
                          ✓ Accepted {invite.agreementAcceptedAt && new Date(invite.agreementAcceptedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="badge badge-warning">Pending</span>
                      )}
                    </td>
                    <td>
                      {invite.accountCreated ? (
                        <span className="badge badge-success">✓ Created</span>
                      ) : (
                        <span className="badge badge-secondary">Pending</span>
                      )}
                    </td>
                    <td>{new Date(invite.tokenExpiry).toLocaleDateString()}</td>
                    <td className="actions">
                      {!invite.isExpired && !invite.accountCreated && (
                        <>
                          <button
                            className="btn-action btn-resend"
                            onClick={() => handleResendInvitation(invite.id)}
                            title="Resend invitation"
                          >
                            🔄 Resend
                          </button>
                          <button
                            className="btn-action btn-cancel"
                            onClick={() => handleCancelInvitation(invite.id)}
                            title="Cancel invitation"
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invitation Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create SRC Invitation</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvitation}>
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={`form-control ${formErrors.firstName ? 'is-invalid' : ''}`}
                  placeholder="John"
                />
                {formErrors.firstName && <div className="error-message">{formErrors.firstName}</div>}
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={`form-control ${formErrors.lastName ? 'is-invalid' : ''}`}
                  placeholder="Doe"
                />
                {formErrors.lastName && <div className="error-message">{formErrors.lastName}</div>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                  placeholder="john.doe@example.com"
                />
                {formErrors.email && <div className="error-message">{formErrors.email}</div>}
              </div>

              <div className="form-group">
                <label>Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-control"
                  placeholder="+234-800-000-0000"
                />
              </div>

              <div className="form-group">
                <label>University *</label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className={`form-control ${formErrors.universityId ? 'is-invalid' : ''}`}
                >
                  <option value="">Select a university...</option>
                  {universities.map((uni) => (
                    <key key={uni.id} value={uni.id}>
                      {uni.name}
                    </key>
                  ))}
                </select>
                {formErrors.universityId && (
                  <div className="error-message">{formErrors.universityId}</div>
                )}
              </div>

              <div className="form-info">
                <p>
                  📧 An invitation email with the partnership agreement link will be sent to the provided email address. 
                  The invitation expires in 7 days.
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
