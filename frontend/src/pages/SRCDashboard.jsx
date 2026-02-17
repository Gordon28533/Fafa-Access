import { useState, useEffect } from 'react'
import SRCApplicationCard from '../components/src/SRCApplicationCard'
import SRCReviewModal from '../components/src/SRCReviewModal'
import { getSRCPendingApplications } from '../services/applicationService'
import { APPLICATION_STATUS } from '../services/applicationService'

/**
 * SRCDashboard Page Component
 * Dashboard for SRC officers to review student laptop applications
 */
const SRCDashboard = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [allApplications, setAllApplications] = useState([]) // Store all applications for stats

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        // Backend filters by SRC officer's university automatically
        const data = await getSRCPendingApplications()
        setApplications(data)
        // For stats, we'd normally fetch all applications from backend
        // For now, we'll use the pending ones and mock the stats
        setAllApplications(data)
      } catch (err) {
        console.error('Error fetching applications:', err)
        // Auth/permission errors handled by AuthContext (redirect)
        // Only log business errors here
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const handleApplicationClick = (application) => {
    setSelectedApplication(application)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedApplication(null)
  }

  const handleDecision = (applicationId, newStatus, rejectionReason, metadata = {}) => {
    setApplications(prev => prev.filter(app => app.id !== applicationId))

    const logEntry = {
      applicationId,
      status: newStatus,
      rejectionReason: rejectionReason || null,
      internalComment: metadata.internalComment || null,
      reviewedDocs: metadata.reviewedDocs || {},
      actor: 'SRC Officer',
      timestamp: new Date().toISOString()
    }

    // In a real app, this would make an API call to update the status and write to audit log
    console.log('[SRC ACTION]', logEntry)

    alert(
      newStatus === APPLICATION_STATUS.SRC_APPROVED
        ? 'Application approved successfully!'
        : newStatus === APPLICATION_STATUS.SRC_REJECTED
        ? 'Application rejected successfully!'
        : 'Decision recorded'
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const stats = {
    totalApplied: allApplications.length,
    pending: applications.length,
    rejected: allApplications.filter(app => app.status === APPLICATION_STATUS.SRC_REJECTED).length,
    waitingForAdmin: allApplications.filter(app => app.status === APPLICATION_STATUS.SRC_APPROVED).length,
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SRC Application Review Dashboard
        </h1>
        <p className="text-gray-600">
          Review and verify student laptop applications for your institution.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Total Applied */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Applied</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalApplied}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
          <p className="text-xs text-gray-500 mt-3">All student applications</p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-lg border border-yellow-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
          <p className="text-xs text-yellow-600 mt-3">Awaiting SRC decision</p>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-lg border border-red-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
          <p className="text-xs text-red-600 mt-3">Rejected by SRC</p>
        </div>

        {/* Waiting for Admin */}
        <div className="bg-white rounded-lg border border-blue-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Waiting Admin</p>
              <p className="text-3xl font-bold text-blue-700">{stats.waitingForAdmin}</p>
            </div>
            <div className="text-4xl">👤</div>
          </div>
          <p className="text-xs text-blue-600 mt-3">Approved by SRC, pending admin review</p>
        </div>
      </div>

      {/* Applications Queue */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600 text-lg mb-2">No pending applications</p>
          <p className="text-gray-500 text-sm">
            All applications have been reviewed or there are no new submissions.
          </p>
        </div>
      ) : (
        <>
          {/* Queue Count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{applications.length}</span> application{applications.length !== 1 ? 's' : ''} pending review
            </p>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {applications.map((application) => (
              <SRCApplicationCard
                key={application.id}
                application={application}
                onClick={() => handleApplicationClick(application)}
              />
            ))}
          </div>
        </>
      )}

      {/* Review Modal */}
      <SRCReviewModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        application={selectedApplication}
        onDecision={handleDecision}
      />
    </div>
  )
}

export default SRCDashboard
