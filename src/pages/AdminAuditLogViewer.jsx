import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AdminAuditLogViewer = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state
  const [filters, setFilters] = useState({
    role: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    applicationRef: '',
    actorId: '',
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Fetch audit logs from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Not authenticated')
          return
        }

        // Build query params
        const params = new URLSearchParams()
        if (filters.role) params.append('actorRole', filters.role)
        if (filters.action) params.append('action', filters.action)
        if (filters.dateFrom) params.append('startDate', filters.dateFrom)
        if (filters.dateTo) params.append('endDate', filters.dateTo)
        if (filters.applicationRef) params.append('applicationId', filters.applicationRef)
        if (filters.actorId) params.append('actorId', filters.actorId)
        params.append('limit', 100)
        params.append('offset', 0)

        const response = await fetch(
          `http://localhost:3000/api/admin/audit-logs?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (data.success) {
          setLogs(data.data.logs || [])
          setError(null)
        } else {
          setError(data.message || 'Failed to fetch audit logs')
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch audit logs')
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [filters])

  // Apply filtering
  useEffect(() => {
    let filtered = logs
    setCurrentPage(1)
    setFilteredLogs(filtered)
  }, [logs])

  // Get unique action types for filter
  const actionTypes = [...new Set(logs.map(log => log.action))].sort()
  const roles = [...new Set(logs.map(log => log.actorRole))].sort()

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const paginatedLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setFilters({
      role: '',
      action: '',
      dateFrom: '',
      dateTo: '',
      applicationRef: '',
      actorId: '',
    })
    setCurrentPage(1)
  }

  const parseLogDetails = (details) => {
    try {
      return typeof details === 'string' ? JSON.parse(details) : details
    } catch {
      return details
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const getActionBadgeColor = (action) => {
    const colors = {
      'APPLICATION_SUBMITTED': 'bg-blue-100 text-blue-800',
      'APPLICATION_SUBMISSION': 'bg-blue-100 text-blue-800',
      'SRC_APPROVED': 'bg-green-100 text-green-800',
      'SRC_DECISION': 'bg-green-100 text-green-800',
      'ADMIN_APPROVED': 'bg-purple-100 text-purple-800',
      'ADMIN_DECISION': 'bg-purple-100 text-purple-800',
      'DELIVERY_CONFIRMED': 'bg-orange-100 text-orange-800',
      'DELIVERY_CONFIRMATION': 'bg-orange-100 text-orange-800',
      'PAYMENT_COLLECTED': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_CONFIRMED': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_VERIFICATION': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_INITIATED': 'bg-indigo-100 text-indigo-800',
      'LAPTOP_CREATED': 'bg-cyan-100 text-cyan-800',
      'LAPTOP_UPDATED': 'bg-cyan-100 text-cyan-800',
      'LAPTOP_DEACTIVATED': 'bg-red-100 text-red-800',
      'LAPTOP_ACTIVATED': 'bg-cyan-100 text-cyan-800',
      'STOCK_ADJUSTED': 'bg-lime-100 text-lime-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      'ADMIN': 'bg-red-100 text-red-800',
      'SRC': 'bg-blue-100 text-blue-800',
      'STUDENT': 'bg-green-100 text-green-800',
      'DELIVERY': 'bg-orange-100 text-orange-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <main className="p-6 lg:p-10 w-full max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Audit Log Viewer</h1>
            <p className="mt-2 text-gray-600">
              Complete and immutable record of all system actions and transactions
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <section className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Type
            </label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          {/* Actor ID Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actor ID
            </label>
            <input
              type="text"
              name="actorId"
              value={filters.actorId}
              onChange={handleFilterChange}
              placeholder="Filter by user/actor ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Application Ref Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Ref
            </label>
            <input
              type="text"
              name="applicationRef"
              value={filters.applicationRef}
              onChange={handleFilterChange}
              placeholder="Filter by application ID/reference"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Date From Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </section>

      {/* Audit Logs Table */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-gray-600">Loading audit logs...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-50 border-b border-red-200">
            <p className="text-red-800 font-medium">Error loading audit logs</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{Math.min(itemsPerPage, filteredLogs.length)}</span> of <span className="font-semibold">{filteredLogs.length}</span> logs
              </p>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No audit logs found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Application
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedLogs.map((log, idx) => {
                      const details = parseLogDetails(log.details)
                      return (
                        <tr key={`${log.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-mono text-xs">
                            {log.actorId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(log.actorRole)}`}>
                              {log.actorRole}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {log.applicationId ? (
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{log.applicationId.slice(0, 8)}...</code>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="max-w-xs overflow-hidden">
                              {typeof details === 'object' ? (
                                <div className="text-xs text-gray-600 space-y-1">
                                  {Object.entries(details)
                                    .filter(([k]) => k !== 'ipAddress' && k !== 'timestamp')
                                    .slice(0, 3)
                                    .map(([k, v]) => (
                                      <div key={k}>
                                        <span className="font-medium">{k}:</span> {String(v).slice(0, 40)}
                                      </div>
                                    ))}
                                  {Object.keys(details).length > 3 && (
                                    <div className="text-gray-500 italic">+{Object.keys(details).length - 3} more fields</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600 truncate">{String(details)}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ About Audit Logs</h3>
        <p className="text-sm text-blue-800">
          This is an immutable record of all critical system actions including applications, approvals, deliveries, payments, and inventory changes. 
          All logs include the actor's ID, role, timestamp, and action details for complete traceability and compliance auditing.
        </p>
      </div>
    </main>
  )
}

export default AdminAuditLogViewer
