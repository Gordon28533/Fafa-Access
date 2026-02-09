import { Link } from 'react-router-dom'
import HowItWorks from '../components/common/HowItWorks'

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 py-20 sm:py-28 lg:py-32">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-1/4 -top-1/4 h-96 w-96 rounded-full bg-green-100/50 blur-3xl"></div>
          <div className="absolute -left-1/4 top-1/2 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-purple-100/30 blur-3xl"></div>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Content */}
            <div className="text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800 shadow-sm">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified Student Program</span>
              </div>

              {/* Headline */}
              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                Your Next Laptop,{' '}
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Simplified
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-xl leading-relaxed text-gray-700 sm:text-2xl">
                Get the laptop you need with flexible payment options designed for students.
              </p>

              {/* Value Props */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-base font-medium text-gray-800">Pay 70% upfront, 30% later</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-base font-medium text-gray-800">SRC verified & admin reviewed</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
                    <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-base font-medium text-gray-800">Campus delivery included</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  to="/catalog"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/40"
                >
                  Browse Laptops
                  <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How It Works
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-gray-200 pt-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">500+</p>
                  <p className="mt-1 text-sm text-gray-600">Students Served</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">15+</p>
                  <p className="mt-1 text-sm text-gray-600">Universities</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">95%</p>
                  <p className="mt-1 text-sm text-gray-600">Satisfaction Rate</p>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative flex items-center justify-center lg:justify-end">
              {/* Floating Cards */}
              <div className="relative h-[500px] w-full max-w-md">
                {/* Main Laptop Card */}
                <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 transform">
                  <div className="rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-200">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg viewBox="0 0 400 300" className="h-full w-full">
                        {/* Laptop Screen */}
                        <rect x="50" y="40" width="300" height="180" rx="8" fill="#1f2937" />
                        <rect x="60" y="50" width="280" height="160" rx="4" fill="#059669" opacity="0.1" />
                        
                        {/* Screen Content */}
                        <rect x="80" y="70" width="120" height="8" rx="4" fill="#10b981" />
                        <rect x="80" y="90" width="160" height="6" rx="3" fill="#d1d5db" />
                        <rect x="80" y="105" width="140" height="6" rx="3" fill="#d1d5db" />
                        
                        {/* Progress bars */}
                        <rect x="80" y="130" width="240" height="4" rx="2" fill="#e5e7eb" />
                        <rect x="80" y="130" width="180" height="4" rx="2" fill="#10b981" />
                        
                        <rect x="80" y="145" width="240" height="4" rx="2" fill="#e5e7eb" />
                        <rect x="80" y="145" width="120" height="4" rx="2" fill="#3b82f6" />
                        
                        {/* Buttons */}
                        <rect x="80" y="170" width="80" height="24" rx="12" fill="#10b981" />
                        <rect x="170" y="170" width="80" height="24" rx="12" fill="#e5e7eb" />
                        
                        {/* Laptop Base */}
                        <path d="M 20 220 L 380 220 L 360 240 L 40 240 Z" fill="#374151" />
                        <ellipse cx="200" cy="230" rx="15" ry="3" fill="#1f2937" />
                      </svg>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Premium Laptop</h3>
                          <p className="text-sm text-gray-600">Intel i5, 8GB RAM</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₦280,000</p>
                          <p className="text-xs text-gray-500">70% upfront</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge - Top Left */}
                <div className="absolute left-0 top-8 animate-float rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Verified by</p>
                      <p className="text-sm font-bold text-gray-900">SRC Officers</p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge - Bottom Right */}
                <div className="absolute bottom-8 right-0 animate-float-delayed rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600">Fast Approval</p>
                      <p className="text-sm font-bold text-gray-900">2-3 Days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
    </div>
  )
}

export default HomePage
