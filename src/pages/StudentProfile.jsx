import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchStudentProfile, saveStudentProfile } from '../services/studentProfileService'
import { getStudentApplications } from '../services/applicationService'
import PaymentDeliveryStatus from '../components/student/PaymentDeliveryStatus'

const badgeClass = (status) => {
  switch (status) {
    case 'VERIFIED':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'PENDING':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    case 'FLAGGED':
    case 'ESCALATED':
      return 'bg-orange-50 text-orange-800 border-orange-200'
    case 'REJECTED':
      return 'bg-red-50 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function StudentProfile() {
  const { user, authFetch } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [mostRecentApplication, setMostRecentApplication] = useState(null)
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'security', 'support'
  const [formState, setFormState] = useState({
    phoneNumber: '',
    level: '',
    course: '',
    profilePhotoUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchStudentProfile(authFetch)
      setProfileData(data)
      setFormState({
        phoneNumber: data?.profile?.phoneNumber || user?.phone || '',
        level: data?.profile?.level || '',
        course: data?.profile?.course || '',
        profilePhotoUrl: data?.profile?.profilePhotoUrl || '',
      })
      
      // Fetch most recent application for payment/delivery status
      try {
        const applications = await getStudentApplications()
        if (applications && applications.length > 0) {
          // Get the most recent application (applications are already sorted by date)
          setMostRecentApplication(applications[0])
        }
      } catch (appErr) {
        console.error('Failed to fetch applications:', appErr)
        // Don't fail the whole page if applications can't be loaded
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
    setSuccess('')
    setError('')
  }

  const handlePhotoFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setFormState((prev) => ({ ...prev, profilePhotoUrl: String(e.target.result) }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {}
      const current = profileData?.profile || {}
      const fields = ['phoneNumber', 'level', 'course', 'profilePhotoUrl']
      fields.forEach((field) => {
        if (formState[field] !== current[field]) {
          payload[field] = formState[field]
        }
      })

      const updated = await saveStudentProfile(authFetch, payload)
      setProfileData(updated)
      setSuccess('Profile updated')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const verification = profileData?.verification || {}
  const profile = profileData?.profile
  const identityReview = profileData?.identityReview || {}

  const renderBadge = (status) => (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass(status)}`}>
      {status || 'PENDING'}
    </span>
  )

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error && !profileData) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800 font-semibold">{error}</p>
          <button
            className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={load}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header with Profile Picture */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {formState.profilePhotoUrl ? (
                    <img
                      src={formState.profilePhotoUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <span className="text-4xl text-blue-500">👤</span>
                  )}
                </div>
                <button
                  onClick={() => document.getElementById('profilePhotoInput')?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg border-4 border-white transition-colors"
                  title="Change profile picture"
                >
                  📷
                </button>
              </div>
              
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile?.fullName}</h1>
                <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  {renderBadge(verification.status)}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${verification.identityLocked ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    {verification.identityLocked ? '🔒 Identity Locked' : '✏️ Identity Editable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
              <div className="text-center bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{verification.activeApplications || 0}</p>
                <p className="text-xs text-gray-600 mt-1">Active</p>
              </div>
              <div className="text-center bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-2xl font-bold text-green-600">{identityReview.verifiedAt ? '✓' : '○'}</p>
                <p className="text-xs text-gray-600 mt-1">Verified</p>
              </div>
              <div className="text-center bg-purple-50 rounded-lg p-3 border border-purple-100">
                <p className="text-2xl font-bold text-purple-600">{formState.level || '—'}</p>
                <p className="text-xs text-gray-600 mt-1">Level</p>
              </div>
            </div>
          </div>

          {/* Hidden file input for photo upload */}
          <input
            id="profilePhotoInput"
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoFile(e.target.files?.[0])}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200 rounded-t-xl">
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Profile & Settings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🔒 Security
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-4 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'support'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 Support & Help
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-200 p-6 sm:p-8">

        {/* Profile & Settings Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {(error || success) && (
              <div className={`p-4 rounded-lg border ${error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                <p className="text-sm font-medium">{error || success}</p>
              </div>
            )}

            {/* Identity & Verification Status */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">Identity & Verification</h3>
              <p className="text-sm text-gray-600 mb-4">Your identity documents are reviewed once and locked after verification.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">Ghana Card status</p>
              {renderBadge(identityReview.ghanaCardStatus)}
            </div>
            {identityReview.rejectionReason && identityReview.ghanaCardStatus === 'REJECTED' && (
              <p className="text-xs text-red-600 mt-2">Reason: {identityReview.rejectionReason}</p>
            )}
          </div>
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">Student ID / Admission Letter</p>
              {renderBadge(identityReview.studentIdOrAdmissionStatus)}
            </div>
            <p className="text-xs text-gray-500 mt-2">Locked after submission; contact support if corrections are needed.</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-800">Date verified</p>
            <p className="text-sm text-gray-700 mt-1">{identityReview.verifiedAt ? new Date(identityReview.verifiedAt).toLocaleString() : 'Not verified yet'}</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-800">Verified by</p>
            <p className="text-sm text-gray-700 mt-1">{identityReview.verifiedBy || 'Pending review'}</p>
          </div>
        </div>
      </div>

      {/* Payment & Delivery Status */}
      {mostRecentApplication && (
        <PaymentDeliveryStatus application={mostRecentApplication} />
      )}

      {/* Personal Info */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">Personal Information</h3>
        <p className="text-sm text-gray-600 mb-6">Read-only identity information and editable contact details.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Full name <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">Read-only</span>
            </label>
            <input
              value={profile?.fullName || ''}
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Email <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">Read-only</span>
            </label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Phone number <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Editable</span>
            </label>
            <input
              name="phoneNumber"
              value={formState.phoneNumber}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="+233 XX XXX XXXX"
            />
            <p className="text-xs text-gray-500 mt-1">May require verification for future changes.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Ghana Card <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">Read-only</span>
            </label>
            <input
              value={profile?.ghanaCardRef || ''}
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              Profile Photo <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Edit from header</span>
            </label>
            <p className="text-xs text-gray-600">Click the camera icon in the header to update your profile picture.</p>
          </div>
        </div>
      </div>

      {/* Academic Info */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">Academic Information</h3>
        <p className="text-sm text-gray-600 mb-6">University is locked after approval. Update your level and course as needed.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              University <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">Read-only</span>
            </label>
            <input
              value={profile?.universityName || ''}
              disabled
              className="w-full border rounded-md px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Level <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Editable</span>
            </label>
            <input
              name="level"
              value={formState.level}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 100, 200"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              Course / Programme <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Editable</span>
            </label>
            <input
              name="course"
              value={formState.course}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Computer Science"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
          >
            Save changes
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-200">Recent Profile Changes</h3>
        <p className="text-sm text-gray-600 mb-4">Last 10 updates recorded for auditability.</p>
        {profileData?.auditTrail?.length ? (
          <ul className="mt-4 divide-y divide-gray-100">
            {profileData.auditTrail.map((entry) => (
              <li key={entry.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                  {entry.field && (
                    <p className="text-xs text-gray-600">{entry.field}: {entry.oldValue || '—'} → {entry.newValue || '—'}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600 mt-2">No audit entries yet.</p>
        )}
      </div>
        </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🔒 Security Settings</h3>
              <p className="text-blue-700 mb-4">Manage your account security, login sessions, and two-factor authentication.</p>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Coming Soon
              </button>
            </div>
          </div>
        )}

        {/* Support & Help Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-green-900 mb-2">💬 Support & Help</h3>
              <p className="text-green-700 mb-4">Get help, submit support tickets, and view our frequently asked questions.</p>
              <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                Create Support Ticket
              </button>
            </div>
          </div>
        )}

        </div>
      </div>
    </div>
  )
}

export default StudentProfile
