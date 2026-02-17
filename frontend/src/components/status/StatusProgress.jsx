import { APPLICATION_STATUS } from '../../services/applicationService'

/**
 * StatusProgress Component
 * Displays the approval progress stages for an application
 * 
 * @param {Object} props
 * @param {string} props.status - Current application status
 */
const StatusProgress = ({ status }) => {
  const steps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'src_review', label: 'SRC Review' },
    { key: 'admin_review', label: 'Admin Review' },
    { key: 'decision', label: 'Approved / Rejected' }
  ]

  const getCurrentStepIndex = () => {
    switch (status) {
      case APPLICATION_STATUS.PENDING_SRC:
        return 1 // At SRC Review
      case APPLICATION_STATUS.SRC_APPROVED:
        return 2 // At Admin Review
      case APPLICATION_STATUS.ADMIN_APPROVED:
        return 3 // Final Decision (approved)
      case APPLICATION_STATUS.SRC_REJECTED:
      case APPLICATION_STATUS.ADMIN_REJECTED:
      case APPLICATION_STATUS.WITHDRAWN:
        return 3 // Final Decision (rejected)
      default:
        return 0 // Submitted
    }
  }

  const currentStepIndex = getCurrentStepIndex()
  const isRejected = status === APPLICATION_STATUS.SRC_REJECTED || status === APPLICATION_STATUS.ADMIN_REJECTED || status === APPLICATION_STATUS.WITHDRAWN

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          const isPending = index > currentStepIndex

          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? isRejected
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-xs text-center max-w-[80px] ${
                    isCurrent ? 'font-medium text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StatusProgress
