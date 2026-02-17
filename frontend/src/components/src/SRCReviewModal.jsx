import { useState } from 'react'
import { APPLICATION_STATUS } from '../../services/applicationService'

/**
 * SRCReviewModal Component
 * Modal for SRC officers to review and make decisions on applications
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Object} props.application - Application object
 * @param {Function} props.onDecision - Callback when SRC makes a decision
 */
const SRCReviewModal = ({ isOpen, onClose, application, onDecision }) => {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionInput, setShowRejectionInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [internalComment, setInternalComment] = useState('')
  const [reviewChecks, setReviewChecks] = useState({
    front: false,
    back: false,
    selfie: false,
    identity: false
  })

  if (!isOpen || !application) return null

  const formattedDate = new Date(application.submittedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const handleApprove = async () => {
    if (!Object.values(reviewChecks).every(Boolean)) {
      alert('Please confirm you reviewed all uploaded documents before approving.')
      return
    }

    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (onDecision) {
      onDecision(application.id, APPLICATION_STATUS.SRC_APPROVED, null, {
        internalComment: internalComment.trim(),
        reviewedDocs: { ...reviewChecks }
      })
    }
    
    setIsProcessing(false)
    handleClose()
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (onDecision) {
      onDecision(application.id, APPLICATION_STATUS.SRC_REJECTED, rejectionReason, {
        internalComment: internalComment.trim(),
        reviewedDocs: { ...reviewChecks }
      })
    }
    
    setIsProcessing(false)
    handleClose()
  }

  const handleClose = () => {
    setRejectionReason('')
    setInternalComment('')
    setReviewChecks({ front: false, back: false, selfie: false, identity: false })
    setShowRejectionInput(false)
    setIsProcessing(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={!isProcessing ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Review Application
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {application.reference}
              </p>
            </div>
            {!isProcessing && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Laptop Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {application.laptop.brand} {application.laptop.model}
              </h3>
              <p className="text-sm text-gray-600">
                Submitted on {formattedDate}
              </p>
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

            {/* Identity Verification */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Identity Verification</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Identity Method:</span>
                  <p className="text-gray-900 mt-1">
                    {application.identity?.method === 'student_id'
                      ? `Student ID: ${application.identity?.studentId}`
                      : `Admission Letter: ${application.identity?.admissionLetter}`}
                  </p>
                  <label className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                    <input
                      type="checkbox"
                      checked={reviewChecks.identity}
                      onChange={(e) => setReviewChecks(prev => ({ ...prev, identity: e.target.checked }))}
                    />
                    Confirmed identity document matches student info
                  </label>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Ghana Card Number:</span>
                  <p className="text-gray-900 mt-1">{application.student.ghanaCardNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Submitted Documents:</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{application.documents.ghanaCardFront}</span>
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={reviewChecks.front}
                          onChange={(e) => setReviewChecks(prev => ({ ...prev, front: e.target.checked }))}
                        />
                        Viewed
                      </label>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{application.documents.ghanaCardBack}</span>
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={reviewChecks.back}
                          onChange={(e) => setReviewChecks(prev => ({ ...prev, back: e.target.checked }))}
                        />
                        Viewed
                      </label>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{application.documents.selfieWithCard}</span>
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={reviewChecks.selfie}
                          onChange={(e) => setReviewChecks(prev => ({ ...prev, selfie: e.target.checked }))}
                        />
                        Viewed
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Internal Comments */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Internal Comments (SRC only)</h4>
              <textarea
                value={internalComment}
                onChange={(e) => setInternalComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notes for admin or future reference (not shown to student)."
              />
            </div>

            {/* Pricing Summary */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Pricing Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="text-lg font-bold text-gray-900">
                    GHS {(application.pricing?.discountedPrice || 0).toLocaleString()}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="bg-blue-50 rounded-md p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Payable on Delivery (70%):</span>
                      <span className="font-semibold text-blue-600">
                        GHS {(application.pricing?.paymentOnDelivery || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Payable Later (30%):</span>
                      <span className="font-semibold text-blue-600">
                        GHS {(application.pricing?.paymentLater || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection Reason Input */}
            {showRejectionInput && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-red-900 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Please provide a clear reason for rejection..."
                />
                <p className="mt-2 text-xs text-red-700">
                  This reason will be shared with the student.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              {!showRejectionInput ? (
                <>
                  <button
                    onClick={() => setShowRejectionInput(true)}
                    disabled={isProcessing}
                    className="px-6 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing || !Object.values(reviewChecks).every(Boolean)}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Approve Application'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowRejectionInput(false)
                      setRejectionReason('')
                    }}
                    disabled={isProcessing}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SRCReviewModal
