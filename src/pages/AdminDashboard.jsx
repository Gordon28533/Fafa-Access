import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminStatsCard from '../components/admin/AdminStatsCard'
import SRCBottleneckList from '../components/admin/SRCBottleneckList'
import AdminApprovalQueue from '../components/admin/AdminApprovalQueue'
import AdminDecisionModal from '../components/admin/AdminDecisionModal'
import DeliveryAssignmentModal from '../components/admin/DeliveryAssignmentModal'
import AuditLogTable from '../components/admin/AuditLogTable'
import DocumentReviewPanel from '../components/admin/DocumentReviewPanel'

const ADMIN_NAME = 'Admin User'; // Replace with actual admin name if available
const ADMIN_ID = 'admin-001'; // Placeholder admin id
const AdminDashboard = () => {
  const stats = {
    total: 128,
    pendingSrc: 14,
    pendingAdmin: 9,
    approved: 87,
    rejected: 18,
  }

  // Mock SRC bottleneck data
  const srcBottlenecks = [
    {
      university: "University of Ghana",
      pendingCount: 6,
      oldestSubmissionDate: "2024-10-02"
    },
    {
      university: "Kwame Nkrumah University of Science and Technology",
      pendingCount: 4,
      oldestSubmissionDate: "2024-10-05"
    },
    {
      university: "University of Cape Coast",
      pendingCount: 2,
      oldestSubmissionDate: "2024-10-10"
    }
  ]

  // Admin approval queue state
  const [adminApprovalQueue, setAdminApprovalQueue] = useState([
    {
      ref: 'APP-2024-0012',
      studentName: 'Ama Mensah',
      university: 'University of Ghana',
      laptop: 'Dell Inspiron 15',
      srcApprovedDate: '2024-10-12',
    },
    {
      ref: 'APP-2024-0013',
      studentName: 'Kwesi Boateng',
      university: 'Kwame Nkrumah University of Science and Technology',
      laptop: 'HP Pavilion x360',
      srcApprovedDate: '2024-10-13',
    },
    {
      ref: 'APP-2024-0014',
      studentName: 'Efua Owusu',
      university: 'University of Cape Coast',
      laptop: 'Lenovo ThinkPad E14',
      srcApprovedDate: '2024-10-14',
    },
  ])

  // Approved applications (for delivery assignment)
  const [approvedApplications, setApprovedApplications] = useState([])
  // Delivery queue (assigned for delivery)
  const [deliveryQueue, setDeliveryQueue] = useState([])
  // Delivered applications history
  const [deliveredHistory, setDeliveredHistory] = useState([])
  // Delivery modal state
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [deliveryApplication, setDeliveryApplication] = useState(null)
  // Audit log (append-only)
  const [auditLogs, setAuditLogs] = useState([])

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [decisionSummary, setDecisionSummary] = useState(null)
  const [decisionLockRefs, setDecisionLockRefs] = useState(new Set())

  const handleDecisionClick = (application) => {
    if (decisionLockRefs.has(application.ref)) return
    setSelectedApplication(application)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedApplication(null)
  }

  const handleApprove = (application) => {
    setDecisionLockRefs(prev => new Set(prev).add(application.ref))
    setAdminApprovalQueue(q => q.filter(a => a.ref !== application.ref))
    setApprovedApplications(a => [...a, application])
    setModalOpen(false)
    setSelectedApplication(null)
    const entry = {
      action: 'APPROVE',
      admin: ADMIN_NAME,
      adminId: ADMIN_ID,
      timestamp: new Date().toISOString(),
      details: { ref: application.ref, studentName: application.studentName },
    }
    setAuditLogs(logs => [...logs, entry])
    setDecisionSummary({ type: 'APPROVED', ref: application.ref, student: application.studentName })
  }
  // Open delivery assignment modal for an approved application
  const handleAssignDeliveryClick = (application) => {
    setDeliveryApplication(application)
    setDeliveryModalOpen(true)
  }

  // Assign delivery (move from approved to delivery queue)
  const handleAssignDelivery = (application, deliveryData) => {
    setApprovedApplications(a => a.filter(app => app.ref !== application.ref))
    setDeliveryQueue(q => [...q, { ...application, delivery: deliveryData, delivered: false, paymentCollected: false }])
    setDeliveryModalOpen(false)
    setDeliveryApplication(null)
    setAuditLogs(logs => [
      ...logs,
      {
        action: 'ASSIGN_DELIVERY',
        admin: ADMIN_NAME,
        timestamp: new Date().toISOString(),
        details: { ref: application.ref, delivery: deliveryData },
      },
    ])
  }

  // Ingest delivery confirmations from localStorage (produced by Delivery dashboard)
  useEffect(() => {
    const key = 'delivery_confirmations'
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const confirmations = JSON.parse(raw)
      if (!Array.isArray(confirmations) || confirmations.length === 0) return

      confirmations.forEach((conf) => {
        // Validate confirmation has required fields
        if (!conf.ref || !conf.receiptRef) {
          console.warn('[AdminDashboard] Invalid delivery confirmation:', conf)
          return
        }

        // Find in current deliveryQueue
        const found = deliveryQueue.find(a => a.ref === conf.ref)
        if (!found) {
          console.warn('[AdminDashboard] Delivery not found in queue:', conf.ref)
          return
        }

        // Remove from queue
        setDeliveryQueue(q => q.filter(app => app.ref !== conf.ref))
        // Append to delivered history with receipt reference
        setDeliveredHistory(h => [
          ...h,
          {
            ref: conf.ref,
            studentName: found?.studentName,
            university: found?.university,
            laptop: found?.laptop,
            delivery: found?.delivery,
            delivered: true,
            paymentCollected: !!conf.paymentCollected,
            deliveryReceiptRef: conf.receiptRef,
            final30Status: 'Pending',
            final30DueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          }
        ])
        // Add audit log entry attributed to delivery staff
        setAuditLogs(logs => [
          ...logs,
          {
            action: 'DELIVERY_CONFIRMED',
            admin: 'Delivery Staff',
            timestamp: conf.timestamp || new Date().toISOString(),
            details: { ref: conf.ref, receiptRef: conf.receiptRef, paymentCollected: !!conf.paymentCollected },
          },
        ])
      })

      // Clear processed confirmations
      localStorage.removeItem(key)
    } catch (e) {
      console.warn('Failed to ingest delivery confirmations:', e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleReject = (application, reason) => {
    setDecisionLockRefs(prev => new Set(prev).add(application.ref))
    setAdminApprovalQueue(q => q.filter(a => a.ref !== application.ref))
    setModalOpen(false)
    setSelectedApplication(null)
    const entry = {
      action: 'REJECT',
      admin: ADMIN_NAME,
      adminId: ADMIN_ID,
      timestamp: new Date().toISOString(),
      details: { ref: application.ref, studentName: application.studentName, reason },
    }
    setAuditLogs(logs => [...logs, entry])
    setDecisionSummary({ type: 'REJECTED', ref: application.ref, student: application.studentName, reason })
  }

  const cards = [
    {
      id: 'total',
      label: 'Total Applications',
      value: stats.total,
      icon: (
        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6M9 16h6M9 8h6M4 6h16M4 18h16" />
        </svg>
      ),
    },
    {
      id: 'pendingSrc',
      label: 'Pending SRC Approval',
      value: stats.pendingSrc,
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'pendingAdmin',
      label: 'Pending Admin Approval',
      value: stats.pendingAdmin,
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      id: 'approved',
      label: 'Approved for Delivery',
      value: stats.approved,
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h4l3 8 4-16 3 8h4" />
        </svg>
      ),
    },
    {
      id: 'rejected',
      label: 'Rejected Applications',
      value: stats.rejected,
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  ]

  return (
    <main className="p-6 lg:p-10 w-full max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Oversight of all student laptop applications and approval stages.</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/inventory"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Manage Laptops
            </Link>
            <Link
              to="/admin/analytics"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Analytics
            </Link>
            <Link
              to="/admin/audit-logs"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Audit Logs
            </Link>
          </div>
        </div>
      </header>

      {decisionSummary && (
        <div className={`mb-6 p-4 rounded-md border ${decisionSummary.type === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">
                {decisionSummary.type === 'APPROVED' ? 'Application approved' : 'Application rejected'}
              </p>
              <p className="text-sm">Ref: {decisionSummary.ref} • Student: {decisionSummary.student}</p>
              {decisionSummary.reason && (
                <p className="text-xs mt-1">Reason: {decisionSummary.reason}</p>
              )}
            </div>
            <button
              onClick={() => setDecisionSummary(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="sr-only">Summary statistics</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cards.map((card) => (
            <AdminStatsCard key={card.id} label={card.label} value={card.value} icon={card.icon} />
          ))}
        </div>
      </section>

      {/* Pending SRC Bottlenecks Section */}
      <SRCBottleneckList bottlenecks={srcBottlenecks} />

      {/* Pending Admin Approval Queue */}
      <AdminApprovalQueue applications={adminApprovalQueue} onDecisionClick={handleDecisionClick} lockedRefs={decisionLockRefs} />

      {/* Document Review: identity verification */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Document Review</h2>
        <p className="text-sm text-gray-600 mb-4">Load Ghana card (front/back) and selfie to visually confirm the applicant matches their submitted ID.</p>
        <DocumentReviewPanel />
      </section>

      {/* Approved Applications (ready for delivery assignment) */}
      {approvedApplications.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready for Delivery Assignment</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-100 rounded-md">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application Ref</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laptop</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SRC Approved Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedApplications.map((app, idx) => (
                  <tr key={app.ref} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{app.ref}</td>
                    <td className="px-4 py-3 text-gray-700">{app.studentName}</td>
                    <td className="px-4 py-3 text-gray-700">{app.university}</td>
                    <td className="px-4 py-3 text-gray-700">{app.laptop}</td>
                    <td className="px-4 py-3 text-gray-700">{app.srcApprovedDate}</td>
                    <td className="px-4 py-3">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-3 rounded"
                        onClick={() => handleAssignDeliveryClick(app)}
                      >
                        Assign Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Delivery Queue (assigned; confirmation happens in Delivery dashboard) */}
      {deliveryQueue.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Queue</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-100 rounded-md">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application Ref</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Staff</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">70% Paid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt Ref</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final 30%</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliveryQueue.filter(app => !app.delivered).map((app, idx) => (
                  <tr key={app.ref} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{app.ref}</td>
                    <td className="px-4 py-3 text-gray-700">{app.studentName}</td>
                    <td className="px-4 py-3 text-gray-700">{app.delivery?.staffName}</td>
                    <td className="px-4 py-3 text-gray-700">{app.delivery?.deliveryDate}</td>
                    <td className="px-4 py-3 text-gray-700">{app.delivery?.location}</td>
                    <td className="px-4 py-3 text-gray-700">{app.delivered ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-gray-700">{app.paymentCollected ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-gray-700">Awaiting delivery staff confirmation</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Delivered Applications History (read-only) */}
      {deliveredHistory.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivered Applications History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-100 rounded-md">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application Ref</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laptop</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Staff</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">70% Paid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt Ref</th>
                </tr>
              </thead>
              <tbody>
                {deliveredHistory.map((app, idx) => (
                  <tr key={app.ref} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{app.ref}</td>
                    <td className="px-4 py-3 text-gray-700">{app.studentName}</td>
                    <td className="px-4 py-3 text-gray-700">{app.university}</td>
                    <td className="px-4 py-3 text-gray-700">{app.laptop}</td>
                    <td className="px-4 py-3 text-gray-700">{app.delivery?.staffName}</td>
                    <td className="px-4 py-3 text-gray-700">{app.delivery?.deliveryDate}</td>
                    <td className="px-4 py-3 text-gray-700">{app.delivery?.location}</td>
                    <td className="px-4 py-3 text-gray-700">Yes</td>
                    <td className="px-4 py-3 text-gray-700">{app.deliveryReceiptRef || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">Pending</span>
                      <p className="text-xs text-gray-600 mt-1">Due: {app.final30DueDate ? new Date(app.final30DueDate).toLocaleDateString() : '-'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DeliveryAssignmentModal
        isOpen={deliveryModalOpen}
        application={deliveryApplication}
        onClose={() => { setDeliveryModalOpen(false); setDeliveryApplication(null) }}
        onAssignDelivery={handleAssignDelivery}
      />

      <AdminDecisionModal
        isOpen={modalOpen}
        application={selectedApplication}
        onClose={handleModalClose}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      {/* Audit Log Table */}
      <AuditLogTable logs={auditLogs} />
    </main>
  )
}

export default AdminDashboard
