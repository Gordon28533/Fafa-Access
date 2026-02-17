import StatusProgress from './StatusProgress'
import ApplicationTimeline from './ApplicationTimeline'
import PaymentDeliveryStatus from '../student/PaymentDeliveryStatus'
import { APPLICATION_STATUS } from '../../services/applicationService'

/**
 * ApplicationDetailsModal Component
 * Displays detailed read-only application information
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Object} props.application - Application object
 */
const ApplicationDetailsModal = ({
  isOpen,
  onClose,
  application,
  onEdit,
  onWithdraw,
  onChangeLaptop,
  actionPending = false
}) => {
  if (!isOpen || !application) return null

  const formattedDate = new Date(application.submittedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

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

  const statusBadge = getStatusBadge()
  const isEditable = application.status === APPLICATION_STATUS.PENDING_SRC

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Application Details
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {application.reference}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Laptop Info & Status */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {application.laptop?.brand} {application.laptop?.model}
                </h3>
                <p className="text-sm text-gray-600">
                  Submitted on {formattedDate}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>

            {/* Status Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Approval Progress</h4>
              <StatusProgress status={application.status} />
            </div>

            {/* Timeline (read-only) */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Application Timeline</h4>
              <ApplicationTimeline status={application.status} submittedAt={application.submittedAt} />
              {!isEditable && (
                <p className="text-xs text-gray-500 mt-2">
                  Editing is locked because SRC review has started or a decision was made.
                </p>
              )}
            </div>

            {/* Student Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Student Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Full Name:</span>
                  <p className="text-gray-900 mt-1">{application.student.fullName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">University:</span>
                  <p className="text-gray-900 mt-1">{application.student.university}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Level:</span>
                  <p className="text-gray-900 mt-1">{application.student.level}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Course:</span>
                  <p className="text-gray-900 mt-1">{application.student.course}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone Number:</span>
                  <p className="text-gray-900 mt-1">{application.student.phoneNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Residential Address:</span>
                  <p className="text-gray-900 mt-1">{application.student.address}</p>
                </div>
              </div>
            </div>

            {/* Identity Information */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Identity Verification</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Identity Method:</span>
                  <p className="text-gray-900 mt-1">
                    {application.identity?.method === 'student_id'
                      ? `Student ID: ${application.identity.studentId}`
                      : `Admission Letter: ${application.identity?.admissionLetter}`}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Ghana Card Number:</span>
                  <p className="text-gray-900 mt-1">{application.student.ghanaCardNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Submitted Documents:</span>
                  <ul className="mt-2 text-gray-900 list-disc list-inside space-y-1">
                    <li>{application.documents?.ghanaCardFront}</li>
                    <li>{application.documents?.ghanaCardBack}</li>
                    <li>{application.documents?.selfieWithCard}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment & Delivery Status */}
            <PaymentDeliveryStatus application={application} />

            {/* Rejection Reason (if rejected) */}
            {[APPLICATION_STATUS.SRC_REJECTED, APPLICATION_STATUS.ADMIN_REJECTED].includes(application.status) && application.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                <p className="text-sm text-red-800">{application.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {isEditable ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onWithdraw}
                  disabled={actionPending}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                >
                  Withdraw Application
                </button>
                <button
                  onClick={onChangeLaptop}
                  disabled={actionPending}
                  className="px-4 py-2 border border-purple-200 text-purple-700 rounded-md hover:bg-purple-50 disabled:opacity-60"
                >
                  Change Laptop
                </button>
                <button
                  onClick={onEdit}
                  disabled={actionPending}
                  className="px-4 py-2 border border-blue-200 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-60"
                >
                  Edit Application
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Edits and withdrawals are disabled after SRC review starts.</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationDetailsModal
