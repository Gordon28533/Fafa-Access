import { useEffect, useState } from 'react'

const requiredFields = ['fullName', 'level', 'course', 'phoneNumber', 'address']

const ApplicationEditModal = ({ isOpen, application, onClose, onSave, saving = false }) => {
  const [form, setForm] = useState({
    fullName: '',
    university: '',
    level: '',
    course: '',
    phoneNumber: '',
    address: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (application) {
      setForm({
        fullName: application.student?.fullName || '',
        university: application.student?.university || '',
        level: application.student?.level || '',
        course: application.student?.course || '',
        phoneNumber: application.student?.phoneNumber || '',
        address: application.student?.address || ''
      })
      setErrors({})
    }
  }, [application])

  if (!isOpen || !application) return null

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const nextErrors = {}

    requiredFields.forEach((field) => {
      if (!form[field]?.trim()) {
        nextErrors[field] = 'Required'
      }
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Application</h2>
              <p className="text-sm text-gray-500">You can edit details before SRC review starts.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => handleChange('university', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">University cannot be changed after submission.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => handleChange('level', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.level ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Level</option>
                  {['100', '200', '300', '400'].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
                {errors.level && <p className="text-xs text-red-600 mt-1">{errors.level}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course / Programme</label>
              <input
                type="text"
                value={form.course}
                onChange={(e) => handleChange('course', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${errors.course ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.course && <p className="text-xs text-red-600 mt-1">{errors.course}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.phoneNumber && <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationEditModal
