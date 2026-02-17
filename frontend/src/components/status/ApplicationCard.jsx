import { Link } from 'react-router-dom'
import StatusProgress from './StatusProgress'
import { APPLICATION_STATUS } from '../../services/applicationService'

/**
 * ApplicationCard Component
 * Displays a single application card with status information
 * 
 * @param {Object} props
 * @param {Object} props.application - Application object
 * @param {Function} props.onClick - Function to call when card is clicked
 */
const ApplicationCard = ({ application, onClick }) => {
  const getStatusBadge = () => {
    switch (application.status) {
      case APPLICATION_STATUS.PENDING_SRC:
        return {
          label: 'Pending SRC Review',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        }
      case APPLICATION_STATUS.SRC_APPROVED:
        return {
          label: 'SRC Approved (Pending Admin Review)',
          className: 'bg-blue-100 text-blue-800 border-blue-300'
        }
      case APPLICATION_STATUS.ADMIN_APPROVED:
        return {
          label: 'Approved for Delivery',
          className: 'bg-green-100 text-green-800 border-green-300'
        }
      case APPLICATION_STATUS.SRC_REJECTED:
      case APPLICATION_STATUS.ADMIN_REJECTED:
        return {
          label: 'Rejected',
          className: 'bg-red-100 text-red-800 border-red-300'
        }
      case APPLICATION_STATUS.WITHDRAWN:
        return {
          label: 'Withdrawn by Student',
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        }
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }
  }

  const getStatusMessage = () => {
    switch (application.status) {
      case APPLICATION_STATUS.PENDING_SRC:
        return 'Your application is currently under SRC review.'
      case APPLICATION_STATUS.SRC_APPROVED:
        return 'SRC has approved your application. Awaiting admin approval.'
      case APPLICATION_STATUS.ADMIN_APPROVED:
        return 'Your application has been approved. Delivery arrangements will follow.'
      case APPLICATION_STATUS.SRC_REJECTED:
      case APPLICATION_STATUS.ADMIN_REJECTED:
        return `Your application was rejected. ${application.rejectionReason ? `Reason: ${application.rejectionReason}` : 'Contact support for clarification.'}`
      case APPLICATION_STATUS.WITHDRAWN:
        return 'You withdrew this application before SRC review. Start a new application to continue.'
      default:
        return 'Status unknown.'
    }
  }

  const statusBadge = getStatusBadge()
  const formattedDate = new Date(application.submittedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left Section: Application Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {application.laptop?.brand} {application.laptop?.model}
              </h3>
              <p className="text-sm text-gray-600">
                Reference: <span className="font-medium text-gray-900">{application.reference}</span>
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Submitted on {formattedDate}
          </p>

          {/* Status Message */}
          <div className="bg-gray-50 rounded-md p-3 mb-4">
            <p className="text-sm text-gray-700">{getStatusMessage()}</p>
          </div>

          {/* Status Progress */}
          <StatusProgress status={application.status} />

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={onClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
            >
              <span>View Details</span>
            </button>
            <Link
              to={`/application/${application.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              <span>📊</span>
              <span>View Timeline</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationCard
