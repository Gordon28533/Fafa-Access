/**
 * SRCApplicationCard Component
 * Displays a single application card in the SRC review queue
 * 
 * @param {Object} props
 * @param {Object} props.application - Application object
 * @param {Function} props.onClick - Function to call when card is clicked
 */
const SRCApplicationCard = ({ application, onClick }) => {
  const submitted = new Date(application.submittedAt)
  const formattedDate = submitted.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const daysPending = Math.max(0, Math.floor((Date.now() - submitted.getTime()) / (1000 * 60 * 60 * 24)))
  const isAging = daysPending >= 5

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Section: Application Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {application.student.fullName}
              </h3>
              <p className="text-sm text-gray-600">
                {application.laptop.brand} {application.laptop.model}
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
              Pending Review
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Reference:</span>{' '}
              <span className="text-gray-900">{application.reference}</span>
            </div>
            <div>
              <span className="font-medium">Submitted:</span>{' '}
              <span className="text-gray-900">{formattedDate}</span>
            </div>
            <div>
              <span className="font-medium">Days Pending:</span>{' '}
              <span className={isAging ? 'text-red-600 font-semibold' : 'text-gray-900'}>{daysPending} day{daysPending === 1 ? '' : 's'}</span>
            </div>
            <div>
              <span className="font-medium">Level:</span>{' '}
              <span className="text-gray-900">{application.student.level}</span>
            </div>
            <div>
              <span className="font-medium">Course:</span>{' '}
              <span className="text-gray-900">{application.student.course}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Action Indicator */}
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default SRCApplicationCard
