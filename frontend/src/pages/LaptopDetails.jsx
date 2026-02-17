import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import StockBadge from '../components/laptop/StockBadge'
import PaymentBreakdown from '../components/laptop/PaymentBreakdown'
import ApplyModal from '../components/apply/ApplyModal'
import { isAvailable, isLaptopAvailable } from '../utils/stockUtils'

/**
 * LaptopDetails Page Component
 * Displays detailed information about a specific laptop
 * 
 * @param {Object} props
 * @param {number} props.laptopId - Optional laptop ID (defaults to hardcoded ID if not provided)
 */
const LaptopDetails = ({ laptopId = null }) => {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const { isAuthenticated, user, authFetch } = useAuth()
  const [laptop, setLaptop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)

  useEffect(() => {
    const fetchLaptop = async () => {
      try {
        setLoading(true)
        const resolvedId = routeId ?? laptopId

        if (!resolvedId) {
          setError('Laptop not found')
          setLaptop(null)
          return
        }

        // Fetch laptops - works for both authenticated and unauthenticated users
        // Public endpoint shows only active laptops
        const response = await fetch('/api/laptops')
        
        if (!response.ok) {
          throw new Error('Failed to fetch laptops')
        }
        
        const data = await response.json()
        const laptops = data.data?.laptops || []

        const found = laptops.find((item) => String(item.id) === String(resolvedId))
        if (!found) {
          setError('Laptop not found')
          setLaptop(null)
          return
        }

        setLaptop(found)
        setError(null)
      } catch (err) {
        setError('Failed to load laptop details. Please try again later.')
        console.error('Error fetching laptop:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLaptop()
  }, [routeId, laptopId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading laptop details...</p>
        </div>
      </div>
    )
  }

  if (error || !laptop) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 text-lg">
            {error || 'Laptop not found'}
          </p>
        </div>
      </div>
    )
  }

  const available = isLaptopAvailable(laptop)
  const inStock = isAvailable(laptop.stockQuantity)
  const hasDiscount = laptop.originalPrice > laptop.discountedPrice

  return (
    <div className="w-full max-w-7xl mx-auto">

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
          {/* Left Column: Image */}
          <div className="flex flex-col">
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center mb-6 overflow-hidden">
              {laptop.imageUrl ? (
                <img
                  src={laptop.imageUrl}
                  alt={`${laptop.brand} ${laptop.model}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <svg
                  className="w-32 h-32 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col">
            {/* Brand and Model */}
            <div className="mb-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {laptop.brand} {laptop.model}
              </h1>
              <div className="mb-4">
                <StockBadge stockQuantity={laptop.stockQuantity} />
              </div>
            </div>

            {/* Specifications */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Specifications
              </h2>
              <div className="space-y-3">
                <div className="flex items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600 w-24">
                    RAM:
                  </span>
                  <span className="text-base text-gray-900">
                    {laptop.ram || '-'}
                  </span>
                </div>
                <div className="flex items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600 w-24">
                    Storage:
                  </span>
                  <span className="text-base text-gray-900">
                    {laptop.storage || '-'}
                  </span>
                </div>
                <div className="flex items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600 w-24">
                    Processor:
                  </span>
                  <span className="text-base text-gray-900">
                    {laptop.processor || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pricing
              </h2>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  GHS {laptop.discountedPrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-500 line-through">
                    GHS {laptop.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600 mt-2">
                  You save GHS {(laptop.originalPrice - laptop.discountedPrice).toLocaleString()}
                </p>
              )}
            </div>

            {/* Payment Breakdown */}
            <div className="mb-6">
              <PaymentBreakdown discountedPrice={laptop.discountedPrice} />
            </div>

            {/* Eligibility Notice */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Available only to students from partnered universities
                  </p>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => {
                if (!available) return
                if (!isAuthenticated) {
                  navigate('/login', {
                    state: {
                      message: 'Please sign in to apply for a laptop.',
                      redirectTo: window.location.pathname
                    }
                  })
                  return
                }
                // Only STUDENT role can apply
                if (user?.role !== 'STUDENT') {
                  navigate('/unauthorized', {
                    state: {
                      message: 'Only students can apply for laptops.',
                      from: window.location.pathname
                    }
                  })
                  return
                }
                setIsApplyModalOpen(true)
              }}
              disabled={!inStock || !laptop.isActive}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors duration-200 ${
                available
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {available ? 'Apply for this Laptop' : laptop.isActive ? 'Out of Stock' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        laptop={laptop}
      />
    </div>
  )
}

export default LaptopDetails
