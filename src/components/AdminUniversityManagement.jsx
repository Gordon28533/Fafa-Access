/**
 * Admin University Management Component
 * 
 * Complete dashboard for managing universities.
 * Admins can add, edit, activate, deactivate, and delete universities.
 * 
 * FEATURES:
 * - View all universities (active and inactive)
 * - Add new universities with validation
 * - Edit university details
 * - Activate/deactivate universities
 * - Delete universities
 * - Statistics overview
 * - Search and filter
 * 
 * Created: February 8, 2024
 */

import React, { useState, useEffect } from 'react';
import './AdminUniversityManagement.css';

export default function AdminUniversityManagement() {
  // State
  const [universities, setUniversities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    active: true
  });
  
  // Filter state
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch universities
  useEffect(() => {
    fetchUniversities();
    fetchStats();
  }, []);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/universities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch universities');
      }

      const result = await response.json();
      setUniversities(result.data.universities);
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/universities/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleOpenModal = (university = null) => {
    if (university) {
      setEditingId(university.id);
      setFormData({
        name: university.name,
        code: university.code,
        email: university.email,
        phone: university.phone,
        address: university.address || '',
        active: university.active
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId
        ? `/api/admin/universities/${editingId}`
        : '/api/admin/universities';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save university');
      }

      setSuccessMessage(
        editingId
          ? 'University updated successfully'
          : 'University created successfully'
      );

      setTimeout(() => setSuccessMessage(null), 3000);

      handleCloseModal();
      fetchUniversities();
      fetchStats();
    } catch (err) {
      console.error('Error saving university:', err);
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const endpoint = currentStatus
        ? `/api/admin/universities/${id}/deactivate`
        : `/api/admin/universities/${id}/activate`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update status');
      }

      setSuccessMessage(
        currentStatus
          ? 'University deactivated successfully'
          : 'University activated successfully'
      );

      setTimeout(() => setSuccessMessage(null), 3000);

      fetchUniversities();
      fetchStats();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/universities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete university');
      }

      setSuccessMessage('University deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      fetchUniversities();
      fetchStats();
    } catch (err) {
      console.error('Error deleting university:', err);
      setError(err.message);
    }
  };

  // Filter universities
  const filteredUniversities = universities.filter(u => {
    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && u.active) ||
      (filterActive === 'inactive' && !u.active);

    const matchesSearch =
      !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="h3 mb-1">🏫 University Management</h1>
          <p className="text-muted">Manage universities and control application access</p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            ➕ Add University
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-primary">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Universities</h6>
                <h3 className="mb-0">{stats.total}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-success">
              <div className="card-body">
                <h6 className="text-muted mb-2">✅ Active</h6>
                <h3 className="mb-0 text-success">{stats.active}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-warning">
              <div className="card-body">
                <h6 className="text-muted mb-2">⭕ Inactive</h6>
                <h3 className="mb-0 text-warning">{stats.inactive}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-info">
              <div className="card-body">
                <h6 className="text-muted mb-2">% Active</h6>
                <h3 className="mb-0 text-info">{stats.percentageActive}%</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          ✅ {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage(null)}
          ></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          ❌ {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search universities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">✅ Active Only</option>
                <option value="inactive">⭕ Inactive Only</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm('');
                  setFilterActive('all');
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Universities Table */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading universities...</p>
        </div>
      ) : filteredUniversities.length > 0 ? (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              Universities ({filteredUniversities.length})
            </h5>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUniversities.map((uni) => (
                  <tr key={uni.id}>
                    <td>
                      <span
                        className={`badge bg-${uni.active ? 'success' : 'secondary'}`}
                      >
                        {uni.active ? '✅ Active' : '⭕ Inactive'}
                      </span>
                    </td>
                    <td
                      style={{ fontSize: '14px' }}
                    >
                      <strong>{uni.name}</strong>
                    </td>
                    <td>
                      <code>{uni.code}</code>
                    </td>
                    <td>
                      <small>{uni.email}</small>
                    </td>
                    <td>
                      <small>{uni.phone}</small>
                    </td>
                    <td>
                      <small className="text-muted">
                        {uni.address || '—'}
                      </small>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleOpenModal(uni)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn btn-sm btn-outline-${
                          uni.active ? 'warning' : 'success'
                        } me-1`}
                        onClick={() => handleToggleStatus(uni.id, uni.active)}
                        title={uni.active ? 'Deactivate' : 'Activate'}
                      >
                        {uni.active ? '⭕' : '✅'}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(uni.id, uni.name)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-5">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏫</div>
            <h5>No Universities Found</h5>
            <p className="text-muted">Start by adding a new university</p>
            <button
              className="btn btn-primary"
              onClick={() => handleOpenModal()}
            >
              ➕ Add First University
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                {editingId ? '✏️ Edit University' : '➕ Add New University'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseModal}
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">University Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., University of Ghana"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">University Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    placeholder="e.g., UG"
                    maxLength="10"
                    required
                  />
                  <small className="text-muted">Short code or abbreviation</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="info@university.edu.gh"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="+233 XXXXXXXXX"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="University location/address"
                  />
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="active"
                    name="active"
                    checked={formData.active}
                    onChange={handleFormChange}
                  />
                  <label className="form-check-label" htmlFor="active">
                    Active (Accepting Applications)
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
