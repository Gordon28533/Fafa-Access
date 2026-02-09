import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import ApplicationDetailsModal from '../components/status/ApplicationDetailsModal'
import ApplicationEditModal from '../components/status/ApplicationEditModal'
import ChangeLaptopModal from '../components/student/ChangeLaptopModal'
import PaymentModal from '../components/student/PaymentModal'
import { getStudentApplications, updateApplication, withdrawApplication, APPLICATION_STATUS } from '../services/applicationService'

/**
 * StudentDashboard Page Component (Refactored)
 * Modern card-based layout with application and payment status
 */
const StudentDashboard = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isChangeLaptopModalOpen, setIsChangeLaptopModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const { user, authFetch } = useAuth()

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const data = await getStudentApplications()
        setApplications(data)
      } catch (err) {
        console.error('Error fetching applications:', err)
        // Don't show error if it's auth-related (AuthContext handles it)
        if (!err.message?.includes('Session expired') && !err.message?.includes('permission')) {
          setActionError('Failed to load applications')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  // Fetch payment status separately
  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!authFetch) return
      try {
        const resp = await authFetch('/api/payments/status/my')
        if (resp.ok) {
          const data = await resp.json()
          setPaymentStatus(data)
        }
      } catch (err) {
        console.error('Failed to fetch payment status:', err)
      }
    }
    fetchPaymentStatus()
  }, [authFetch])

  const handleApplicationClick = (application) => {
    setSelectedApplication(application)
    setIsModalOpen(true)
  }

  const handleEditClick = () => {
    setIsEditModalOpen(true)
    setActionError('')
  }

  const handleWithdraw = async () => {
    if (!selectedApplication) return
    try {
      setSaving(true)
      const updated = await withdrawApplication(selectedApplication.id)
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)))
      setSelectedApplication(updated)
      setIsModalOpen(false)
    } catch (err) {
      console.error('Withdraw failed', err)
      // Auth errors are handled by AuthContext, show business rule errors
      if (!err.message?.includes('Session expired') && !err.message?.includes('permission')) {
        setActionError(err.message || 'Unable to withdraw application')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async (updates) => {
    if (!selectedApplication) return
    try {
      setSaving(true)
      const updated = await updateApplication(selectedApplication.id, updates)
      setApplications((prev) => prev.map((app) => (app.id === updated.id ? updated : app)))
      setSelectedApplication(updated)
      setIsEditModalOpen(false)
      setActionError('')
    } catch (err) {
      console.error('Update failed', err)
      // Auth errors are handled by AuthContext, show business rule errors
      if (!err.message?.includes('Session expired') && !err.message?.includes('permission')) {
        setActionError(err.message || 'Unable to update application')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleClose =() => {
    setIsModalOpen(false)
    setSelectedApplication(null)
    setActionError('')
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case APPLICATION_STATUS.PENDING_SRC:
        return { label: 'Pending SRC Review', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' }
      case APPLICATION_STATUS.SRC_APPROVED:
        return { label: 'SRC Approved', className: 'bg-blue-100 text-blue-700 border-blue-300' }
      case APPLICATION_STATUS.ADMIN_APPROVED:
        return { label: 'Approved', className: 'bg-green-100 text-green-700 border-green-300' }
      case APPLICATION_STATUS.SRC_REJECTED:
      case APPLICATION_STATUS.ADMIN_REJECTED:
        return { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-300' }
      case APPLICATION_STATUS.WITHDRAWN:
        return { label: 'Withdrawn', className: 'bg-gray-100 text-gray-700 border-gray-300' }
      default:
        return { label: 'Pending', className: 'bg-gray-100 text-gray-700 border-gray-300' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const latestApplication = applications.length > 0 ? applications[0] : null
  const laptopTotalPrice = latestApplication?.laptop?.discountedPrice || 0
  const deliveryPayment = Math.round(laptopTotalPrice * 0.7)
  const remainingPayment = Math.round(laptopTotalPrice * 0.3)

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Welcome, {user?.name || user?.email || 'Student'}
        </h1>
        <p className="text-gray-600">
          Track your laptop application and payment status
        </p>
      </div>

      {/* Error Alert */}
      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <p className="text-sm font-medium">{actionError}</p>
        </div>
      )}

      {/* No Applications State */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
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
          <p className="text-gray-600 text-lg mb-2 font-medium">No applications yet</p>
          <p className="text-gray-500 text-sm">
            You haven't submitted any laptop applications.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Application Card */}
          {latestApplication && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {latestApplication.laptop?.brand} {latestApplication.laptop?.model}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Reference: <span className="font-medium text-gray-900">{latestApplication.reference}</span>
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${
                      getStatusBadge(latestApplication.status).className
                    }`}
                  >
                    {getStatusBadge(latestApplication.status).label}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                {/* University Section */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Assigned University</p>
                    <p className="text-sm font-semibold text-gray-900">{latestApplication.student?.university || 'Not Assigned'}</p>
                  </div>
                </div>

                {/* Payment Status Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Breakdown</h3>
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 space-y-3">
                    {/* 70% Delivery Payment */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">70% on Delivery</p>
                          <p className="text-xs text-gray-500">Paid at delivery</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900">GH₵{deliveryPayment.toLocaleString()}</p>
                    </div>

                    {/* 30% Remaining Payment */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          paymentStatus?.hasOutstanding30 ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          {paymentStatus?.hasOutstanding30 ? (
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">30% Pay Later Online</p>
                          <p className="text-xs text-gray-500">
                            {paymentStatus?.hasOutstanding30 ? 'Payment pending' : 'Due after delivery'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900">GH₵{remainingPayment.toLocaleString()}</p>
                    </div>

                    {/* Total */}
                    <div className="pt-3 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">Total Amount</p>
                        <p className="text-lg font-bold text-green-600">GH₵{laptopTotalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outstanding Payment Alert */}
                {paymentStatus?.hasOutstanding30 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-grow">
                        <p className="text-sm font-semibold text-orange-900 mb-1">Payment Required</p>
                        <p className="text-sm text-orange-800">
                          Outstanding balance of <strong>GH₵{paymentStatus.outstandingAmount?.toFixed(2)}</strong> due by{' '}
                          <strong>{new Date(paymentStatus.dueDate).toLocaleDateString()}</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {paymentStatus?.hasOutstanding30 && (
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Pay Remaining 30%
                    </button>
                  )}
                  <button
                    onClick={() => handleApplicationClick(latestApplication)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Additional Applications */}
          {applications.length > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Applications</h3>
              <div className="space-y-3">
                {applications.slice(1).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleApplicationClick(app)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.laptop?.brand} {app.laptop?.model}
                      </p>
                      <p className="text-sm text-gray-600">Ref: {app.reference}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                        getStatusBadge(app.status).className
                      }`}
                    >
                      {getStatusBadge(app.status).label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ApplicationDetailsModal
        isOpen={isModalOpen}
        onClose={handleClose}
        application={selectedApplication}
        onEdit={handleEditClick}
        onWithdraw={handleWithdraw}
        onChangeLaptop={() => {
          setIsModalOpen(false)
          setIsChangeLaptopModalOpen(true)
        }}
        actionPending={saving}
      />

      <ApplicationEditModal
        isOpen={isEditModalOpen}
        application={selectedApplication}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        saving={saving}
      />

      <ChangeLaptopModal
        isOpen={isChangeLaptopModalOpen}
        onClose={() => setIsChangeLaptopModalOpen(false)}
        application={selectedApplication}
        onSuccess={async () => {
          try {
            const data = await getStudentApplications()
            setApplications(data)
            const updated = data.find(app => app.id === selectedApplication?.id)
            if (updated) {
              setSelectedApplication(updated)
            }
          } catch (err) {
            console.error('Failed to refresh applications:', err)
          }
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        paymentData={paymentStatus}
        onSuccess={() => {
          setIsPaymentModalOpen(false)
          setPaymentStatus(null)
        }}
      />
    </div>
  )
}

export default StudentDashboard
