import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { fetchStudentProfile, saveStudentProfile, fetchUniversities } from '../services/studentProfileService'

const statusStyles = {
  VERIFIED: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  FLAGGED: 'bg-orange-50 text-orange-800 border-orange-200',
  ESCALATED: 'bg-orange-50 text-orange-800 border-orange-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
  DEFAULT: 'bg-gray-100 text-gray-800 border-gray-200',
}

const badgeClass = (status) => statusStyles[status] || statusStyles.DEFAULT

function StudentSettings() {
  const { user, authFetch } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [formState, setFormState] = useState({
    fullName: '',
    ghanaCardRef: '',
    phoneNumber: '',
    address: '',
    universityId: '',
  })
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadProfile = async () => {
    setError('')
    try {
      setLoading(true)
      const [profileResponse, universitiesResponse] = await Promise.all([
        fetchStudentProfile(authFetch),
        fetchUniversities(authFetch).catch(() => []),
      ])

      setProfileData(profileResponse)
      setUniversities(universitiesResponse || [])

      setFormState({
        fullName: profileResponse?.profile?.fullName || user?.fullName || '',
        ghanaCardRef: profileResponse?.profile?.ghanaCardRef || '',
        phoneNumber: profileResponse?.profile?.phoneNumber || user?.phone || '',
        address: profileResponse?.profile?.address || '',
        universityId: profileResponse?.profile?.universityId || user?.universityId || '',
      })
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
    setSuccess('')
    setError('')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {}
      const currentProfile = profileData?.profile || {}
      const fields = ['fullName', 'ghanaCardRef', 'phoneNumber', 'address', 'universityId']

      fields.forEach((field) => {
        if (formState[field] !== undefined && formState[field] !== currentProfile[field]) {
          payload[field] = formState[field]
        }
      })

      const updated = await saveStudentProfile(authFetch, payload)
      setProfileData(updated)
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const verification = profileData?.verification || {}
  const editable = profileData?.editableFields || {}
  const profile = profileData?.profile

  const universityName = useMemo(() => {
    if (!profile?.universityId) return ''
    const match = universities.find((u) => u.id === profile.universityId)
    return match?.name || profile.universityName || ''
  }, [profile?.universityId, profile?.universityName, universities])

  const sectionTitle = (title, subtitle) => (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {saving && (
        <span className="text-sm text-blue-600 font-medium">Saving...</span>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-8 text-center">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">Student Settings</p>
          <h1 className="text-3xl font-bold text-gray-900">Profile & Verification</h1>
          <p className="text-gray-600 mt-2">Keep your identity and contact details accurate to avoid review delays.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Account email</p>
          <p className="font-semibold text-gray-900">{user?.email}</p>
          <span className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${verification.emailVerified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
            {verification.emailVerified ? 'Email verified' : 'Email not verified'}
          </span>
        </div>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-lg border ${error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
          <p className="text-sm font-medium">{error || success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Profile verification</p>
          <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${badgeClass(verification.status)}`}>
            {verification.status || 'PENDING'}
          </div>
          <p className="text-xs text-gray-500 mt-2">Review team uses this to unlock edits to identity fields.</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Identity lock</p>
          <p className="text-lg font-semibold text-gray-900">{verification.identityLocked ? 'Locked' : 'Editable'}</p>
          <p className="text-xs text-gray-500 mt-2">
            {verification.identityLocked
              ? 'Identity fields are locked because verification is complete or you have active applications.'
              : 'You can still edit your identity before verification completes.'}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Active applications</p>
          <p className="text-lg font-semibold text-gray-900">{verification.activeApplications || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Edits are more restricted once applications are in review.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-6">
        {sectionTitle('Identity', 'These fields are locked after verification or submission to keep records consistent.')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              name="fullName"
              value={formState.fullName}
              onChange={handleChange}
              disabled={!editable.fullName}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${editable.fullName ? 'bg-white' : 'bg-gray-100 text-gray-600'}`}
              placeholder="Enter your legal name"
            />
            {!editable.fullName && (
              <p className="text-xs text-gray-500 mt-1">Locked after verification or submission.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghana Card number</label>
            <input
              name="ghanaCardRef"
              value={formState.ghanaCardRef}
              onChange={handleChange}
              disabled={!editable.ghanaCardRef}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${editable.ghanaCardRef ? 'bg-white' : 'bg-gray-100 text-gray-600'}`}
              placeholder="GHA-XXXX-XXXX"
            />
            {!editable.ghanaCardRef && (
              <p className="text-xs text-gray-500 mt-1">Contact support to amend after verification.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
            <select
              name="universityId"
              value={formState.universityId}
              onChange={handleChange}
              disabled={!editable.universityId}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 ${editable.universityId ? 'bg-white' : 'bg-gray-100 text-gray-600'}`}
            >
              <option value="">Select your university</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {!editable.universityId && (
              <p className="text-xs text-gray-500 mt-1">University is locked to keep approval routing consistent.</p>
            )}
            {universityName && !editable.universityId && (
              <p className="text-xs text-gray-500 mt-1">{universityName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
            <input
              name="phoneNumber"
              value={formState.phoneNumber}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="+233 XX XXX XXXX"
            />
            <p className="text-xs text-gray-500 mt-1">We share this with SRC and delivery for coordination.</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formState.address}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Residence or campus address"
            />
            <p className="text-xs text-gray-500 mt-1">Use a delivery-ready address to avoid delays.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={loadProfile}
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

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        {sectionTitle('Recent profile changes', 'Last 10 updates recorded for auditability.')}
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
  )
}

export default StudentSettings
