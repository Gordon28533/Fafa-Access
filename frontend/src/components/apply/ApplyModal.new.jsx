import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

/**
 * ApplyModal Component (Refactored)
 * Streamlined application flow with laptop summary, university selection, and payment breakdown
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Object} props.laptop - Laptop object
 */
const ApplyModal = ({ isOpen, onClose, laptop }) => {
  const { authFetch, user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    university: '',
    fullName: '',
    phoneNumber: '',
    address: '',
    ghanaCardNumber: '',
    ghanaCardFront: null,
    ghanaCardBack: null,
    selfieWithCard: null,
    hasStudentId: null,
    studentId: '',
    admissionLetter: null,
    declarationAccepted: false
  })

  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [applicationRef, setApplicationRef] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const universities = [
    'University of Ghana',
    'Kwame Nkrumah University of Science and Technology',
    'University of Cape Coast',
    'University for Development Studies',
    'Ashesi University',
    'Ghana Institute of Management and Public Administration'
  ]

  // Calculate payment amounts
  const price = laptop?.discountedPrice || 0
  const deliveryAmount = Math.round(price * 0.7)
  const laterAmount = Math.round(price * 0.3)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleFileChange = (field, file) => {
    if (file) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png']
      const validPdfType = 'application/pdf'
      
      if (field === 'admissionLetter') {
        if (file.type !== validPdfType && !validImageTypes.includes(file.type)) {
          setErrors(prev => ({ ...prev, [field]: 'Please upload a PDF or image file' }))
          return
        }
      } else {
        if (!validImageTypes.includes(file.type)) {
          setErrors(prev => ({ ...prev, [field]: 'Please upload a JPG or PNG image' }))
          return
        }
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [field]: 'File size must be less than 5MB' }))
        return
      }

      handleInputChange(field, file)
    }
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.university) newErrors.university = 'University is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Residential address is required'
    if (!formData.ghanaCardNumber.trim()) newErrors.ghanaCardNumber = 'Ghana Card number is required'
    if (!formData.ghanaCardFront) newErrors.ghanaCardFront = 'Ghana Card front image is required'
    if (!formData.ghanaCardBack) newErrors.ghanaCardBack = 'Ghana Card back image is required'
    if (!formData.selfieWithCard) newErrors.selfieWithCard = 'Selfie with Ghana Card is required'
    if (formData.hasStudentId === null) newErrors.hasStudentId = 'Please select an option'
    if (formData.hasStudentId === true && !formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required'
    }
    if (formData.hasStudentId === false && !formData.admissionLetter) {
      newErrors.admissionLetter = 'Admission letter is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!formData.declarationAccepted) {
      setErrors(prev => ({
        ...prev,
        declarationAccepted: 'You must accept the declaration to proceed'
      }))
      return
    }

    if (!laptop || !laptop.isActive || (laptop.stockQuantity || 0) <= 0) {
      setSubmitError('This laptop is no longer available. Please choose another model.')
      return
    }

    if (user?.role !== 'STUDENT') {
      setSubmitError('Only students can apply for laptops.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const applicationData = {
        name: formData.fullName,
        level: '100', // Default level
        course: 'Not Specified',
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        ghanaCardNumber: formData.ghanaCardNumber,
        ghanaCardFrontHash: 'hash-' + Date.now() + '-front',
        ghanaCardBackHash: 'hash-' + Date.now() + '-back',
        selfieHash: 'hash-' + Date.now() + '-selfie',
        admissionLetterRef: formData.studentId || 'admission-' + Date.now(),
        laptopId: laptop?.id
      }

      const response = await authFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404 && (result.message?.toLowerCase().includes('student profile not found') || result.errors?.[0]?.toLowerCase().includes('student profile'))) {
          setSubmitError('We could not find your student profile. Please complete your student profile before applying.')
          return
        }
        throw new Error(result.message || result.errors?.[0] || 'Failed to submit application')
      }

      setApplicationRef(result.data.application.reference)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitError(error.message || 'Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitted) {
      setCurrentStep(1)
      setFormData({
        university: '',
        fullName: '',
        phoneNumber: '',
        address: '',
        ghanaCardNumber: '',
        ghanaCardFront: null,
        ghanaCardBack: null,
        selfieWithCard: null,
        hasStudentId: null,
        studentId: '',
        admissionLetter: null,
        declarationAccepted: false
      })
      setErrors({})
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={!isSubmitted ? handleClose : undefined} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-2xl font-bold text-gray-900">Apply for Laptop</h2>
            {!isSubmitted && (
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {!isSubmitted ? (
              <>
                {/* Step 1: Laptop Summary + University Selection + Payment Breakdown */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Laptop Summary Card */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex gap-4 p-4 bg-gray-50">
                        {/* Image */}
                        <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {laptop?.imageUrl ? (
                            <img src={laptop.imageUrl} alt={`${laptop.brand} ${laptop.model}`} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {laptop?.brand} {laptop?.model}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>RAM:</span>
                              <span className="font-medium text-gray-900">{laptop?.specs?.ram || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Storage:</span>
                              <span className="font-medium text-gray-900">{laptop?.specs?.storage || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-2xl font-bold text-gray-900">GH₵{price.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">Total price</p>
                        </div>
                      </div>
                    </div>

                    {/* University Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Which university are you from? *
                      </label>
                      <select
                        value={formData.university}
                        onChange={(e) => handleInputChange('university', e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors ${
                          errors.university ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                      >
                        <option value="">Select your university</option>
                        {universities.map((uni) => (
                          <option key={uni} value={uni}>
                            {uni}
                          </option>
                        ))}
                      </select>
                      {errors.university && <p className="mt-1 text-sm text-red-600">{errors.university}</p>}
                    </div>

                    {/* Payment Breakdown */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Payment Schedule</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-sm text-gray-700">On Delivery</span>
                          </div>
                          <span className="font-semibold text-gray-900">GH₵{deliveryAmount.toLocaleString()} (70%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-sm text-gray-700">Pay Later Online</span>
                          </div>
                          <span className="font-semibold text-gray-900">GH₵{laterAmount.toLocaleString()} (30%)</span>
                        </div>
                        <div className="pt-2 border-t border-green-200 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="text-lg font-bold text-green-700">GH₵{price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Next:</strong> You'll provide your contact details, identity verification, and document confirmation information in the next step.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Personal Details + Identity + Declaration */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Information</h3>
                      <p className="text-sm text-gray-600 mb-6">We need some details to process your application</p>
                    </div>

                    {/* Personal Details */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (as on Ghana Card) *</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address *</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          rows={2}
                          className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                      </div>
                    </div>

                    {/* Student Identity */}
                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Student Identity *</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="hasStudentId"
                            checked={formData.hasStudentId === true}
                            onChange={() => handleInputChange('hasStudentId', true)}
                            className="mr-2"
                          />
                          <span className="text-sm">I have a Student ID</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="hasStudentId"
                            checked={formData.hasStudentId === false}
                            onChange={() => handleInputChange('hasStudentId', false)}
                            className="mr-2"
                          />
                          <span className="text-sm">I do NOT have a Student ID (Fresh student)</span>
                        </label>
                      </div>
                      {errors.hasStudentId && <p className="mt-2 text-sm text-red-600">{errors.hasStudentId}</p>}

                      {formData.hasStudentId === true && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student ID Number *</label>
                          <input
                            type="text"
                            value={formData.studentId}
                            onChange={(e) => handleInputChange('studentId', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.studentId ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
                        </div>
                      )}

                      {formData.hasStudentId === false && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Admission Letter (PDF or Image) *</label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('admissionLetter', e.target.files[0])}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.admissionLetter ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {formData.admissionLetter && <p className="mt-1 text-sm text-gray-600">Selected: {formData.admissionLetter.name}</p>}
                          {errors.admissionLetter && <p className="mt-1 text-sm text-red-600">{errors.admissionLetter}</p>}
                        </div>
                      )}
                    </div>

                    {/* Ghana Card */}
                    <div className="border-t border-gray-200 pt-4 space-y-4">
                      <h4 className="font-medium text-gray-900">Identity Verification</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghana Card Number *</label>
                        <input
                          type="text"
                          value={formData.ghanaCardNumber}
                          onChange={(e) => handleInputChange('ghanaCardNumber', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.ghanaCardNumber ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.ghanaCardNumber && <p className="mt-1 text-sm text-red-600">{errors.ghanaCardNumber}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Card Front Image *</label>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('ghanaCardFront', e.target.files[0])}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.ghanaCardFront ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {formData.ghanaCardFront && <p className="mt-1 text-xs text-gray-600">{formData.ghanaCardFront.name}</p>}
                          {errors.ghanaCardFront && <p className="mt-1 text-sm text-red-600">{errors.ghanaCardFront}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Card Back Image *</label>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('ghanaCardBack', e.target.files[0])}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.ghanaCardBack ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {formData.ghanaCardBack && <p className="mt-1 text-xs text-gray-600">{formData.ghanaCardBack.name}</p>}
                          {errors.ghanaCardBack && <p className="mt-1 text-sm text-red-600">{errors.ghanaCardBack}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selfie with Ghana Card *</label>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange('selfieWithCard', e.target.files[0])}
                          className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.selfieWithCard ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {formData.selfieWithCard && <p className="mt-1 text-xs text-gray-600">{formData.selfieWithCard.name}</p>}
                        {errors.selfieWithCard && <p className="mt-1 text-sm text-red-600">{errors.selfieWithCard}</p>}
                      </div>
                    </div>

                    {/* Declaration */}
                    <div className="border-t border-gray-200 pt-4">
                      <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.declarationAccepted}
                          onChange={(e) => handleInputChange('declarationAccepted', e.target.checked)}
                          className="mt-1 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I confirm that all information provided is accurate and belongs to me. I understand that false information may result in disqualification. *
                        </span>
                      </label>
                      {errors.declarationAccepted && <p className="mt-2 text-sm text-red-600">{errors.declarationAccepted}</p>}
                    </div>

                    {/* Submission Note */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Process:</strong> Your application will be reviewed by your university's SRC, then forwarded to our admin team for final approval.
                      </p>
                    </div>

                    {submitError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800"><strong>Error:</strong> {submitError}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between items-center">
                  <div>
                    {currentStep > 1 && (
                      <button
                        onClick={handleBack}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                      >
                        Back
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {!isSubmitted && (
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    )}

                    {currentStep < 2 ? (
                      <button
                        onClick={handleNext}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:bg-gray-300"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={!formData.declarationAccepted || isSubmitting}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Your application has been successfully submitted and is now pending SRC review. You can track your application status in your dashboard.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-xs text-gray-600 mb-1">Application Reference ID</p>
                  <p className="text-lg font-bold text-green-600">{applicationRef}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href="/dashboard" className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors">
                    View My Applications
                  </a>
                  <button onClick={handleClose} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplyModal
