/**
 * StepIndicator Component
 * Displays progress through the application steps
 * 
 * @param {Object} props
 * @param {number} props.currentStep - Current step (1, 2, or 3)
 * @param {number} props.totalSteps - Total number of steps
 */
const StepIndicator = ({ currentStep, totalSteps = 3 }) => {
  const steps = [
    { number: 1, label: 'Student & Academic Info' },
    { number: 2, label: 'Identity Verification' },
    { number: 3, label: 'Review & Submit' }
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep > step.number
                    ? 'bg-green-500 text-white'
                    : currentStep === step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > step.number ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-2 text-xs text-center max-w-[100px] ${
                  currentStep === step.number
                    ? 'font-medium text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-colors ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default StepIndicator
