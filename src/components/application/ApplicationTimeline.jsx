import React, { useState, useEffect } from 'react'

const ApplicationTimeline = ({ applicationId, applicationRef }) => {
  const [timelineEvents, setTimelineEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchApplicationLogs = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Not authenticated')
          return
        }

        const response = await fetch(
          `http://localhost:3000/api/admin/audit-logs/application/${applicationId}`,
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
          // Convert audit logs to timeline events
          const events = (data.data.logs || []).map(log => ({
            id: log.id,
            timestamp: new Date(log.timestamp),
            action: log.action,
            actor: log.actorId,
            role: log.actorRole,
            details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
            raw: log,
          }))

          // Sort by timestamp descending (most recent first) then reverse for display
          events.sort((a, b) => a.timestamp - b.timestamp)
          setTimelineEvents(events)
          setError(null)
        } else {
          setError(data.message || 'Failed to fetch application timeline')
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch application timeline')
        setTimelineEvents([])
      } finally {
        setLoading(false)
      }
    }

    if (applicationId) {
      fetchApplicationLogs()
    }
  }, [applicationId])

  const getEventIcon = (action) => {
    const iconMap = {
      'APPLICATION_SUBMITTED': '📝',
      'APPLICATION_SUBMISSION': '📝',
      'SRC_DECISION': '✅',
      'SRC_APPROVED': '✅',
      'SRC_REJECTED': '❌',
      'ADMIN_DECISION': '⚖️',
      'ADMIN_APPROVED': '⚖️',
      'ADMIN_REJECTED': '❌',
      'DELIVERY_CONFIRMED': '📦',
      'DELIVERY_CONFIRMATION': '📦',
      'PAYMENT_INITIATED': '💳',
      'PAYMENT_VERIFIED': '💰',
      'PAYMENT_COLLECTED': '💵',
      'PAYMENT_CONFIRMATION': '💵',
      'LAPTOP_CREATED': '💻',
      'LAPTOP_UPDATED': '⚙️',
      'STOCK_ADJUSTED': '📊',
    }
    return iconMap[action] || '📌'
  }

  const getEventColor = (action) => {
    if (action.includes('SUBMIT')) return 'bg-blue-100 border-blue-300 text-blue-700'
    if (action.includes('SRC')) return 'bg-green-100 border-green-300 text-green-700'
    if (action.includes('ADMIN')) return 'bg-purple-100 border-purple-300 text-purple-700'
    if (action.includes('DELIVERY')) return 'bg-orange-100 border-orange-300 text-orange-700'
    if (action.includes('PAYMENT')) return 'bg-yellow-100 border-yellow-300 text-yellow-700'
    if (action.includes('REJECT')) return 'bg-red-100 border-red-300 text-red-700'
    return 'bg-gray-100 border-gray-300 text-gray-700'
  }

  const formatTimestamp = (date) => {
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

  const getActionLabel = (action) => {
    const labels = {
      'APPLICATION_SUBMITTED': 'Application Submitted',
      'APPLICATION_SUBMISSION': 'Application Submitted',
      'SRC_DECISION': 'SRC Review Decision',
      'SRC_APPROVED': 'SRC Approved',
      'SRC_REJECTED': 'SRC Rejected',
      'ADMIN_DECISION': 'Admin Review Decision',
      'ADMIN_APPROVED': 'Admin Approved',
      'ADMIN_REJECTED': 'Admin Rejected',
      'DELIVERY_CONFIRMED': 'Delivered',
      'DELIVERY_CONFIRMATION': 'Delivered',
      'PAYMENT_INITIATED': 'Payment Initiated',
      'PAYMENT_VERIFIED': 'Payment Verified',
      'PAYMENT_COLLECTED': 'Payment Collected (70%)',
      'PAYMENT_CONFIRMATION': 'Payment Confirmed (30%)',
    }
    return labels[action] || action.replace(/_/g, ' ')
  }

  const getRoleLabel = (role) => {
    const labels = {
      'STUDENT': 'Student',
      'SRC': 'SRC Officer',
      'ADMIN': 'Administrator',
      'DELIVERY': 'Delivery Staff',
    }
    return labels[role] || role
  }

  if (loading) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="inline-flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
          <span className="text-gray-600 text-sm">Loading application timeline...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-6 px-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium text-sm">Unable to load timeline</p>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Application Timeline</h3>
        <p className="text-sm text-gray-600 mt-1">
          Complete action history for application <code className="text-xs bg-gray-100 px-2 py-1 rounded">{applicationRef}</code>
        </p>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">No actions recorded yet for this application.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-green-300 to-orange-300"></div>

          {/* Timeline events */}
          <div className="space-y-6 pl-16">
            {timelineEvents.map((event) => (
              <div key={event.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-10 mt-1">
                  <div className="flex items-center justify-center w-8 h-8 bg-white border-4 border-gray-300 rounded-full text-lg">
                    {getEventIcon(event.action)}
                  </div>
                </div>

                {/* Event card */}
                <div className={`border-l-4 rounded-r-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${getEventColor(event.action)}`}>
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{getActionLabel(event.action)}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        by <span className="font-medium">{getRoleLabel(event.role)}</span>
                        {event.actor && <span className="ml-1">({event.actor.split('@')[0]})</span>}
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 whitespace-nowrap">
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>

                  {/* Details */}
                  {event.details && Object.keys(event.details).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-xs space-y-1">
                      {Object.entries(event.details)
                        .filter(([key]) => !['ipAddress', 'timestamp', 'userAgent'].includes(key))
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="font-medium min-w-fit">{key.replace(/_/g, ' ')}:</span>
                            <span className="break-words">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value).slice(0, 100)}
                            </span>
                          </div>
                        ))}
                      {Object.keys(event.details).length > 4 && (
                        <p className="text-gray-600 italic">+{Object.keys(event.details).length - 4} more details</p>
                      )}
                    </div>
                  )}

                  {/* Status badge */}
                  {event.action.includes('APPROVED') && (
                    <div className="mt-3 inline-block bg-green-500 bg-opacity-20 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      ✓ Approved
                    </div>
                  )}
                  {event.action.includes('REJECTED') && (
                    <div className="mt-3 inline-block bg-red-500 bg-opacity-20 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      ✗ Rejected
                    </div>
                  )}
                  {event.action.includes('CONFIRMED') && (
                    <div className="mt-3 inline-block bg-blue-500 bg-opacity-20 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      ✓ Confirmed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <span>Submission</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <span>SRC Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <span>Admin Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span>Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span>Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span>Rejection</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationTimeline
