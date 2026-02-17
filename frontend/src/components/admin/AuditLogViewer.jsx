import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Download } from 'lucide-react';

/**
 * AuditLogViewer Component
 * Read-only audit log viewer for administrators
 * Displays system-wide audit logs with filtering and pagination
 */
const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 20,
    total: 0,
    hasMore: false
  });

  // Filter state
  const [filters, setFilters] = useState({
    actorId: '',
    actorRole: '',
    action: '',
    applicationId: '',
    startDate: '',
    endDate: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Available action types
  const actionTypes = [
    'APPLICATION_SUBMITTED',
    'SRC_APPROVED',
    'SRC_REJECTED',
    'ADMIN_APPROVED',
    'ADMIN_REJECTED',
    'DELIVERY_CONFIRMED',
    'PAYMENT_COLLECTED',
    'PAYMENT_CONFIRMED',
    'LAPTOP_CREATED',
    'LAPTOP_UPDATED',
    'LAPTOP_DEACTIVATED',
    'LAPTOP_ACTIVATED',
    'STOCK_ADJUSTED',
    'PAYMENT_INITIATED',
    'PAYMENT_VERIFIED'
  ];

  const roles = ['STUDENT', 'SRC', 'ADMIN', 'DELIVERY'];

  // Fetch audit logs from backend - memoized with useCallback
  const fetchLogs = useCallback(async (pageNum = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('limit', pagination.limit);
      params.append('offset', pageNum * pagination.limit);
      
      if (filters.actorId) params.append('actorId', filters.actorId);
      if (filters.actorRole) params.append('actorRole', filters.actorRole);
      if (filters.action) params.append('action', filters.action);
      if (filters.applicationId) params.append('applicationId', filters.applicationId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data.data.logs || []);
      setPagination({
        page: pageNum,
        limit: data.data.pagination?.limit || pagination.limit,
        total: data.data.pagination?.total || 0,
        hasMore: data.data.pagination?.hasMore || false
      });
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  // Initial load
  useEffect(() => {
    fetchLogs(0);
  }, [fetchLogs]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchLogs(0);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      actorId: '',
      actorRole: '',
      action: '',
      applicationId: '',
      startDate: '',
      endDate: ''
    });
    fetchLogs(0);
    setShowFilters(false);
  };

  // Export logs as CSV
  const exportLogs = () => {
    if (logs.length === 0) {
      alert('No logs to export');
      return;
    }

    const headers = ['Timestamp', 'Actor ID', 'Role', 'Action', 'Application ID', 'Details'];
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.actorId,
      log.actorRole,
      log.action,
      log.applicationId || 'N/A',
      JSON.stringify(log.details).replace(/"/g, '""')
    ]);

    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Format details for display
  const formatDetails = (details) => {
    try {
      if (typeof details === 'string') {
        return JSON.parse(details);
      }
      return details;
    } catch (e) {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log Viewer</h1>
          <p className="text-gray-600 mt-1">Complete system activity log - Read-only access</p>
        </div>
        <button
          onClick={exportLogs}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            <Filter size={18} />
            Filters
          </button>
          {(Object.values(filters).some(f => f)) && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="p-4 space-y-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actor Role
                </label>
                <select
                  value={filters.actorRole}
                  onChange={(e) => handleFilterChange('actorRole', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Action Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  {actionTypes.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              {/* Actor ID Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actor ID
                </label>
                <input
                  type="text"
                  value={filters.actorId}
                  onChange={(e) => handleFilterChange('actorId', e.target.value)}
                  placeholder="Search by actor ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Application ID Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application ID/Reference
                </label>
                <input
                  type="text"
                  value={filters.applicationId}
                  onChange={(e) => handleFilterChange('applicationId', e.target.value)}
                  placeholder="Search by application ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading audit logs</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actor (ID/Role)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id || idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{log.actorId}</div>
                      <div className="text-xs text-gray-500">{log.actorRole}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.applicationId ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {log.applicationId.substring(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-700 font-medium">
                          View
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                          <pre className="text-xs overflow-auto max-h-48 whitespace-pre-wrap break-words">
                            {JSON.stringify(formatDetails(log.details), null, 2)}
                          </pre>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {pagination.page * pagination.limit + 1} to{' '}
              {Math.min((pagination.page + 1) * pagination.limit, pagination.total)} of{' '}
              {pagination.total} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page === 0}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={!pagination.hasMore}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This audit log viewer is read-only. All system actions are automatically logged and cannot be edited or deleted for compliance and security purposes.
        </p>
      </div>
    </div>
  );
};

export default AuditLogViewer;
