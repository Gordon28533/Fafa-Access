const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: 'Apply for Laptop',
      description: 'Browse available laptops and submit your application with required documents.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'SRC & Admin Approval',
      description: 'Your application is reviewed and verified by SRC officers and administrators.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Delivery & 70% Payment',
      description: 'Receive your laptop and pay 70% of the total cost upon delivery.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      number: 4,
      title: 'Pay Remaining 30% Online',
      description: 'Complete your payment by paying the remaining 30% online at your convenience.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ]

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Get your laptop in 4 simple steps
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Step Card */}
              <div className="flex flex-col items-center text-center">
                {/* Icon Container */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-white shadow-md">
                  {step.icon}
                </div>

                {/* Step Number */}
                <div className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-900">
                  {step.number}
                </div>

                {/* Title */}
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-sm text-gray-600">
                  {step.description}
                </p>
              </div>

              {/* Connector Arrow (hidden on last step and mobile) */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-8 hidden lg:block" style={{ transform: 'translateX(50%)' }}>
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
