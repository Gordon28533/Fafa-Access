import React, { useState, useEffect } from 'react'

const ApplicationActionTimeline = ({ applicationId }) => {
  const [events, setEvents] = useState([])
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
          throw new Error(`Failed to fetch audit logs`)
        }

        const data = await response.json()
        if (data.success && Array.isArray(data.data.logs)) {
          // Sort logs by timestamp (oldest first)
          const sortedLogs = data.data.logs.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          )
          setEvents(sortedLogs)
          setError(null)
        } else {
          setError(data.message || 'Failed to fetch audit logs')
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch application timeline')
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    if (applicationId) {
      fetchApplicationLogs()
    }
  }, [applicationId])

  const parseDetails = (details) => {
    try {
      return typeof details === 'string' ? JSON.parse(details) : details
    } catch {
      return details
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  }

  const getEventIcon = (action) => {
    const icons = {
      'APPLICATION_SUBMITTED': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a1 1 0 001 1h12a1 1 0 001-1V6a2 2 0 00-2-2H4zm12 12H4a2 2 0 01-2-2v-4a1 1 0 00-1-1H.5a1.5 1.5 0 00-1.5 1.5v4A3.5 3.5 0 003.5 19h13a1.5 1.5 0 001.5-1.5v-4a1 1 0 00-1-1h-.5a1 1 0 00-1 1v4a2 2 0 01-2 2z" clipRule="evenodd" />
        </svg>
      ),
      'APPLICATION_SUBMISSION': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.5 1A1.5 1.5 0 001 2.5v15A1.5 1.5 0 002.5 19h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0017.5 1h-15zM7 9a2 2 0 11-4 0 2 2 0 014 0zM7 7a1 1 0 100-2 1 1 0 000 2z" />
        </svg>
      ),
      'SRC_DECISION': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.5 1.5H19a1 1 0 011 1v15a1 1 0 01-1 1h-13a1 1 0 01-1-1V2.5a1 1 0 011-1zm0 2v12h7V3.5h-7zm-8 0h5v12H2.5V3.5z" />
        </svg>
      ),
      'ADMIN_DECISION': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-2.77 3.066 3.066 0 00-3.58 3.03A3.066 3.066 0 006.267 3.455zm9.8 9.374c0 1.102-.36 2.132-.98 2.975a3.066 3.066 0 003.058-3.066 3.066 3.066 0 00-3.058 3.066zM5.5 8a2.5 2.5 0 015 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" />
        </svg>
      ),
      'DELIVERY_CONFIRMED': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
        </svg>
      ),
      'DELIVERY_CONFIRMATION': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
        </svg>
      ),
      'PAYMENT_INITIATED': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a1 1 0 001 1h12a1 1 0 001-1V6a2 2 0 00-2-2H4zm12 12H4a2 2 0 01-2-2v-4a1 1 0 00-1-1H.5a1.5 1.5 0 00-1.5 1.5v4A3.5 3.5 0 003.5 19h13a1.5 1.5 0 001.5-1.5v-4a1 1 0 00-1-1h-.5a1 1 0 00-1 1v4a2 2 0 01-2 2z" clipRule="evenodd" />
        </svg>
      ),
      'PAYMENT_COLLECTED': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      'PAYMENT_VERIFIED': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      'PAYMENT_CONFIRMATION': (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    }

    return icons[action] || (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0zm3 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
      </svg>
    )
  }

  const getEventColor = (action) => {
    if (action.includes('SUBMISSION') || action.includes('SUBMITTED')) return 'blue'
    if (action.includes('SRC') || action.includes('DECISION')) return 'green'
    if (action.includes('ADMIN')) return 'purple'
    if (action.includes('DELIVERY') || action.includes('CONFIRMED')) return 'orange'
    if (action.includes('PAYMENT')) return 'yellow'
    return 'gray'
  }

  const getEventLabel = (action) => {
    const labels = {
      'APPLICATION_SUBMITTED': 'Application Submitted',
      'APPLICATION_SUBMISSION': 'Application Submitted',
      'SRC_DECISION': 'SRC Review Complete',
      'ADMIN_DECISION': 'Admin Decision',
      'DELIVERY_CONFIRMED': 'Delivery Confirmed',
      'DELIVERY_CONFIRMATION': 'Delivery Confirmed',
      'PAYMENT_INITIATED': 'Payment Initiated',
      'PAYMENT_COLLECTED': 'Payment Collected (70%)',
      'PAYMENT_VERIFIED': 'Payment Verified',
      'PAYMENT_CONFIRMATION': 'Final Payment (30%)',
    }
    return labels[action] || action.replace(/_/g, ' ')
  }

  const getActorLabel = (actorId, actorRole) => {
    if (actorRole === 'STUDENT') return 'You'
    if (actorRole === 'SRC') return 'SRC Officer'
    if (actorRole === 'ADMIN') return 'Admin'
    if (actorRole === 'DELIVERY') return 'Delivery Staff'
    return actorId || 'System'
  }

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
  }

  const dotClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    gray: 'bg-gray-500',
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="text-gray-600">Loading timeline...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Unable to load timeline</p>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">No actions recorded yet for this application.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200"></div>

        {/* Timeline events */}
        <div className="space-y-8">
          {events.map((event, index) => {
            const color = getEventColor(event.action)
            const details = parseDetails(event.details)

            return (
              <div key={`${event.id}-${index}`} className="relative pl-24">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-2 w-16 h-16 rounded-full ${dotClasses[color]} flex items-center justify-center text-white shadow-lg border-4 border-white`}>
                  {getEventIcon(event.action)}
                </div>

                {/* Event card */}
                <div className={`bg-white border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${colorClasses[color]}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {getEventLabel(event.action)}
                      </h3>
                      <p className="text-sm mt-1 opacity-90">
                        By <span className="font-medium">{getActorLabel(event.actorId, event.actorRole)}</span>
                      </p>
                    </div>
                    <span className="text-xs font-mono opacity-75 whitespace-nowrap ml-4">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>

                  {/* Details */}
                  {typeof details === 'object' && Object.keys(details).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <div className="text-sm space-y-1">
                        {Object.entries(details)
                          .filter(([k]) => k !== 'ipAddress' && k !== 'timestamp' && k !== 'userAgent')
                          .map(([key, value]) => {
                            // Format the key name
                            const formattedKey = key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, str => str.toUpperCase())
                              .trim()

                            // Format the value
                            let formattedValue = value
                            if (typeof value === 'boolean') {
                              formattedValue = value ? 'Yes' : 'No'
                            } else if (typeof value === 'object') {
                              formattedValue = JSON.stringify(value)
                            }

                            return (
                              <div key={key} className="flex justify-between items-start gap-4">
                                <span className="font-medium opacity-80">{formattedKey}:</span>
                                <span className="text-right max-w-xs">{String(formattedValue)}</span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
        <h4 className="font-semibold text-blue-900 text-sm mb-2">Timeline Summary</h4>
        <p className="text-blue-800 text-sm">
          This application has <span className="font-semibold">{events.length}</span> recorded action{events.length !== 1 ? 's' : ''}.
          Timeline shows all SRC reviews, admin decisions, delivery confirmations, and payment confirmations.
        </p>
      </div>
    </div>
  )
}

export default ApplicationActionTimeline
