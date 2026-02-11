/**
 * Audit Log Viewer Component
 * 
 * Admin interface for viewing comprehensive audit logs of all critical system actions.
 * Features filtering by actor, role, action, and date range.
 */

import React, { useState, useEffect, useCallback } from 'react';
import '../styles/audit-log.css';

interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorRole: string;
  details: string;
  timestamp: string;
  applicationId?: string;
}

interface AuditLogStats {
  totalLogs: number;
  logsByAction: { action: string; count: number }[];
  logsByRole: { role: string; count: number }[];
}

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actorId, setActorId] = useState('');
  const [actorRole, setActorRole] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicationId, setApplicationId] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);

  // Detail expansion
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (actorId) queryParams.append('actorId', actorId);
      if (actorRole) queryParams.append('actorRole', actorRole);
      if (action) queryParams.append('action', action);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (applicationId) queryParams.append('applicationId', applicationId);
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', ((currentPage - 1) * limit).toString());

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / limit));
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [actorId, actorRole, action, startDate, endDate, applicationId, currentPage, limit]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [actorId, actorRole, action, startDate, endDate, applicationId, limit, currentPage]);

  // Fetch audit log statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch audit log stats:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [currentPage, fetchLogs, fetchStats]);
  }, [fetchLogs, fetchStats]);

  // Handle filter change
  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  // Clear all filters
  const clearFilters = () => {
    setActorId('');
    setActorRole('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setApplicationId('');
    setCurrentPage(1);
  };

  // Toggle detail expansion
  const toggleDetails = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Parse JSON details safely
  const parseDetails = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  return (
    <div className="audit-log-viewer">
      <div className="audit-log-header">
        <h1>Audit Logs</h1>
        <p className="audit-log-description">
          Comprehensive audit trail of all critical system actions
        </p>
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div className="audit-log-stats">
          <div className="stat-card">
            <h3>Total Logs</h3>
            <p className="stat-value">{stats.totalLogs.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Top Actions</h3>
            <ul className="stat-list">
              {stats.logsByAction.slice(0, 3).map((item) => (
                <li key={item.action}>
                  <span className="stat-action">{item.action}</span>
                  <span className="stat-count">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="stat-card">
            <h3>Top Roles</h3>
            <ul className="stat-list">
              {stats.logsByRole.slice(0, 3).map((item) => (
                <li key={item.role}>
                  <span className="stat-role">{item.role}</span>
                  <span className="stat-count">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="audit-log-filters">
        <h2>Filters</h2>
        <div className="filter-grid">
          <div className="filter-field">
            <label htmlFor="actorId">Actor ID</label>
            <input
              type="text"
              id="actorId"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              placeholder="Filter by actor ID"
            />
          </div>

          <div className="filter-field">
            <label htmlFor="actorRole">Actor Role</label>
            <select
              id="actorRole"
              value={actorRole}
              onChange={(e) => setActorRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SRC">SRC</option>
              <option value="STUDENT">Student</option>
              <option value="DELIVERY_STAFF">Delivery Staff</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="action">Action</label>
            <input
              type="text"
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Filter by action (e.g., ADMIN_APPROVED)"
            />
          </div>

          <div className="filter-field">
            <label htmlFor="applicationId">Application ID</label>
            <input
              type="text"
              id="applicationId"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Filter by application ID"
            />
          </div>

          <div className="filter-field">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-field">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={handleFilterChange} className="btn-apply-filters">
            Apply Filters
          </button>
          <button onClick={clearFilters} className="btn-clear-filters">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="audit-log-error">
          <p>❌ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="audit-log-loading">
          <p>Loading audit logs...</p>
        </div>
      )}

      {/* Audit Logs Table */}
      {!loading && logs.length > 0 && (
        <div className="audit-log-table-container">
          <table className="audit-log-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor ID</th>
                <th>Role</th>
                <th>Application ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const parsedDetails = parseDetails(log.details);
                const isExpanded = expandedLogId === log.id;

                return (
                  <React.Fragment key={log.id}>
                    <tr className="audit-log-row">
                      <td>{formatTimestamp(log.timestamp)}</td>
                      <td>
                        <span className={`action-badge action-${log.action.toLowerCase()}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <code>{log.actorId}</code>
                      </td>
                      <td>
                        <span className={`role-badge role-${log.actorRole.toLowerCase()}`}>
                          {log.actorRole}
                        </span>
                      </td>
                      <td>
                        {log.applicationId ? (
                          <code>{log.applicationId.substring(0, 8)}...</code>
                        ) : (
                          <span className="no-value">—</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleDetails(log.id)}
                          className="btn-toggle-details"
                        >
                          {isExpanded ? '▼ Hide' : '▶ View'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="audit-log-details-row">
                        <td colSpan={6}>
                          <div className="audit-log-details">
                            <h4>Details:</h4>
                            <pre>{JSON.stringify(parsedDetails, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="audit-log-empty">
          <p>No audit logs found matching the filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="audit-log-pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="btn-pagination"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="btn-pagination"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;
