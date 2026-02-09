import { Link } from 'react-router-dom'
import HowItWorks from '../components/common/HowItWorks'

const HomePage = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="text-left">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Student Access Program
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-gray-900 sm:text-5xl">
                Get a Laptop as a Student
              </h1>
              <p className="mt-4 text-lg text-gray-700">
                Pay 70% on Delivery • 30% Later
              </p>
              <p className="mt-4 max-w-xl text-base text-gray-600">
                Access is reviewed by SRC officers and administrators to keep distribution verified, fair, and supported.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/catalog"
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  View Available Laptops
                </Link>
                <Link
                  to="/#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  How It Works
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100"></div>
                <svg
                  className="relative w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
                  viewBox="0 0 480 360"
                  role="img"
                  aria-label="Student working on a laptop"
                >
                  <rect width="480" height="360" rx="24" fill="#f8fafc" />
                  <rect x="60" y="210" width="360" height="18" rx="9" fill="#cbd5f5" />
                  <rect x="120" y="120" width="240" height="140" rx="12" fill="#e2e8f0" />
                  <rect x="138" y="138" width="204" height="104" rx="8" fill="#ffffff" />
                  <rect x="150" y="152" width="120" height="12" rx="6" fill="#cbd5f5" />
                  <rect x="150" y="174" width="160" height="10" rx="5" fill="#dbe1f7" />
                  <circle cx="110" cy="120" r="32" fill="#fde2e4" />
                  <rect x="80" y="150" width="60" height="70" rx="18" fill="#f8c4cb" />
                  <rect x="300" y="150" width="90" height="80" rx="20" fill="#c7d2fe" />
                  <rect x="300" y="230" width="90" height="40" rx="18" fill="#a5b4fc" />
                  <rect x="180" y="250" width="120" height="24" rx="12" fill="#e2e8f0" />
                  <circle cx="370" cy="108" r="24" fill="#e0f2fe" />
                </svg>
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
