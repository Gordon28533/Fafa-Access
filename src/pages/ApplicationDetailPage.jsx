import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../layouts/Layout'
import ApplicationActionTimeline from '../components/application/ApplicationActionTimeline'

const ApplicationDetailPage = () => {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        if (!token) {
          setError('Not authenticated')
          return
        }

        const response = await fetch(
          `http://localhost:3000/api/applications/${applicationId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch application details')
        }

        const data = await response.json()
        if (data.success) {
          setApplication(data.data)
          setError(null)
        } else {
          setError(data.message || 'Failed to load application')
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch application details')
      } finally {
        setLoading(false)
      }
    }

    if (applicationId) {
      fetchApplication()
    }
  }, [applicationId])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return '₦0.00'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-300',
      SRC_APPROVED: 'bg-green-100 text-green-800 border-green-300',
      SRC_REJECTED: 'bg-red-100 text-red-800 border-red-300',
      ADMIN_APPROVED: 'bg-green-100 text-green-800 border-green-300',
      ADMIN_REJECTED: 'bg-red-100 text-red-800 border-red-300',
      PAYMENT_PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      PAYMENT_COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      DELIVERED: 'bg-green-100 text-green-800 border-green-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="text-gray-600">Loading application details...</span>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-red-900 font-semibold mb-2">Error Loading Application</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <span>← Go Back</span>
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (!application) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">Application not found.</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              <span>← Go Back</span>
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-green-600 hover:text-green-700 font-medium mb-2 inline-flex items-center gap-1"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
            <p className="text-gray-600 mt-1">Reference: <span className="font-mono font-semibold">{application.reference || 'N/A'}</span></p>
          </div>
          <div className={`border-2 rounded-lg px-4 py-2 font-semibold ${getStatusBadge(application.status)}`}>
            {application.status?.replace(/_/g, ' ')}
          </div>
        </div>

        {/* Application Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Student Information */}
          <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg text-blue-900 mb-4">Student Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Full Name</p>
                <p className="font-medium text-gray-900">{application.student_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium text-gray-900 break-all">{application.student_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">ID/Matric Number</p>
                <p className="font-medium text-gray-900">{application.student_id || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-white border-2 border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg text-green-900 mb-4">Application Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Application Date</p>
                <p className="font-medium text-gray-900">{formatDate(application.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-600">Laptop Category</p>
                <p className="font-medium text-gray-900">{application.laptop_category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-medium text-gray-900">{application.status?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white border-2 border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg text-yellow-900 mb-4">Financial Summary</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Total Price</p>
                <p className="font-semibold text-2xl text-gray-900">{formatCurrency(application.total_price)}</p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-gray-600">Initial Payment (70%)</p>
                <p className="font-medium text-gray-900">{formatCurrency((application.total_price || 0) * 0.7)}</p>
              </div>
              <div>
                <p className="text-gray-600">Final Payment (30%)</p>
                <p className="font-medium text-gray-900">{formatCurrency((application.total_price || 0) * 0.3)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Timeline */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Application Timeline</h2>
          <ApplicationActionTimeline 
            applicationId={applicationId}
          />
        </div>

        {/* Additional Notes Section */}
        {(application.notes || application.rejection_reason) && (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            {application.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-900 font-semibold">Rejection Reason</p>
                <p className="text-red-800 mt-2">{application.rejection_reason}</p>
              </div>
            )}
            {application.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 font-semibold">Notes</p>
                <p className="text-blue-800 mt-2">{application.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ApplicationDetailPage
