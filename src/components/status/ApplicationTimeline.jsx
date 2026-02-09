import { APPLICATION_STATUS } from '../../services/applicationService'

const steps = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'src_review', label: 'SRC Review' },
  { key: 'admin_review', label: 'Admin Review' },
  { key: 'decision', label: 'Approved / Rejected' }
]

const determineStepState = (status, stepKey) => {
  switch (status) {
    case APPLICATION_STATUS.PENDING_SRC:
      if (stepKey === 'submitted') return 'done'
      if (stepKey === 'src_review') return 'current'
      return 'pending'
    case APPLICATION_STATUS.SRC_APPROVED:
      if (stepKey === 'submitted') return 'done'
      if (stepKey === 'src_review') return 'done'
      if (stepKey === 'admin_review') return 'current'
      return 'pending'
    case APPLICATION_STATUS.ADMIN_APPROVED:
    case APPLICATION_STATUS.DELIVERY_ASSIGNED:
    case APPLICATION_STATUS.DELIVERED:
    case APPLICATION_STATUS.COMPLETED:
      if (stepKey === 'decision') return 'approved'
      if (stepKey === 'admin_review') return 'done'
      if (stepKey === 'src_review') return 'done'
      return 'done'
    case APPLICATION_STATUS.SRC_REJECTED:
      if (stepKey === 'decision') return 'rejected'
      if (stepKey === 'src_review') return 'done'
      return stepKey === 'submitted' ? 'done' : 'pending'
    case APPLICATION_STATUS.ADMIN_REJECTED:
      if (stepKey === 'decision') return 'rejected'
      if (stepKey === 'admin_review') return 'done'
      if (stepKey === 'src_review') return 'done'
      return 'done'
    case APPLICATION_STATUS.WITHDRAWN:
      if (stepKey === 'decision') return 'withdrawn'
      if (stepKey === 'admin_review') return 'pending'
      if (stepKey === 'src_review') return 'pending'
      return stepKey === 'submitted' ? 'done' : 'pending'
    default:
      return stepKey === 'submitted' ? 'current' : 'pending'
  }
}

const getBadge = (state) => {
  switch (state) {
    case 'done':
      return { color: 'bg-green-500', text: 'text-green-700', icon: 'check' }
    case 'current':
      return { color: 'bg-blue-600', text: 'text-blue-700', icon: 'dot' }
    case 'approved':
      return { color: 'bg-green-500', text: 'text-green-700', icon: 'check' }
    case 'rejected':
      return { color: 'bg-red-500', text: 'text-red-700', icon: 'x' }
    case 'withdrawn':
      return { color: 'bg-gray-500', text: 'text-gray-700', icon: 'x' }
    default:
      return { color: 'bg-gray-300', text: 'text-gray-600', icon: 'dot' }
  }
}

const iconForState = (icon) => {
  if (icon === 'check') {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  }

  if (icon === 'x') {
    return (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }

  return <span className="text-white">•</span>
}

const ApplicationTimeline = ({ status, submittedAt }) => {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const state = determineStepState(status, step.key)
        const badge = getBadge(state)
        const isLast = index === steps.length - 1

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${badge.color}`}>
                {iconForState(badge.icon)}
              </span>
              {!isLast && <span className="flex-1 w-px bg-gray-200 mt-1 mb-1" />}
            </div>
            <div className="flex-1 pb-2">
              <p className={`text-sm font-semibold ${badge.text}`}>{step.label}</p>
              {step.key === 'submitted' && submittedAt && (
                <p className="text-xs text-gray-500">Submitted on {new Date(submittedAt).toLocaleDateString()}</p>
              )}
              {state === 'withdrawn' && (
                <p className="text-xs text-gray-500">Withdrawn by student before SRC review.</p>
              )}
              {state === 'rejected' && (
                <p className="text-xs text-gray-500">Decision: Rejected</p>
              )}
              {state === 'approved' && (
                <p className="text-xs text-gray-500">Decision: Approved</p>
              )}
              {state === 'pending' && (
                <p className="text-xs text-gray-400">Pending</p>
              )}
              {state === 'current' && (
                <p className="text-xs text-blue-600">In progress</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ApplicationTimeline
