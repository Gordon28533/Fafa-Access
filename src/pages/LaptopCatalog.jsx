import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LaptopGrid from '../components/laptop/LaptopGrid'
import ApplyModal from '../components/apply/ApplyModal'
import FilterBar from '../components/laptop/FilterBar'
import { isLaptopAvailable } from '../utils/stockUtils'
import { 
  getDefaultFilters, 
  applyFiltersAndSort, 
  getFilterOptions,
  SORT_OPTIONS 
} from '../utils/filterUtils'

/**
 * LaptopCatalog Page Component
 * Main page for displaying the laptop catalog with filtering and sorting
 */
const LaptopCatalog = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, authFetch } = useAuth()
  const [allLaptops, setAllLaptops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(getDefaultFilters())
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.PRICE_LOW_TO_HIGH)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [selectedLaptop, setSelectedLaptop] = useState(null)

  useEffect(() => {
    const fetchLaptops = async () => {
      try {
        setLoading(true)
        
        // Fetch laptops - works for both authenticated and unauthenticated users
        // Public endpoint shows only active laptops
        const response = await fetch('/api/laptops')
        
        if (!response.ok) {
          throw new Error('Failed to fetch laptops')
        }
        
        const data = await response.json()
        setAllLaptops(data.data?.laptops || [])
        
        setError(null)
      } catch (err) {
        setError('Failed to load laptops. Please try again later.')
        console.error('Error fetching laptops:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLaptops()
  }, [])

  // Get available filter options from all laptops
  const filterOptions = useMemo(() => {
    return getFilterOptions(allLaptops)
  }, [allLaptops])

  // Apply filters and sorting
  const filteredAndSortedLaptops = useMemo(() => {
    return applyFiltersAndSort(allLaptops, filters, sortOption)
  }, [allLaptops, filters, sortOption])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading laptops...</p>
        </div>
      </div>
    )
  }

  const renderErrorState = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <div className="w-full bg-gradient-to-b from-white to-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Available Laptops</h1>
          <p className="text-green-100 text-lg max-w-2xl mb-3">
            Browse our collection of quality laptops designed for students. Find the perfect device for your academic needs.
          </p>
          {!isAuthenticated && (
            <p className="text-green-50 text-sm max-w-2xl">
              <strong>Note:</strong> You can browse all laptops freely. Please <a href="/login" className="underline font-semibold hover:text-white">sign in</a> or <a href="/register" className="underline font-semibold hover:text-white">register</a> to apply for a laptop.
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          renderErrorState()
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-4">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
                  <FilterBar
                    filters={filters}
                    onFilterChange={setFilters}
                    filterOptions={filterOptions}
                  />
                  <button
                    onClick={() => setFilters(getDefaultFilters())}
                    className="w-full mt-6 px-4 py-2 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content - Products */}
            <main className="flex-1">
              {/* Sort and Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                  <span className="font-semibold text-gray-900">{filteredAndSortedLaptops.length}</span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-900">{allLaptops.length}</span>
                  {' '}laptops found
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                    Sort by:
                  </label>
                  <select
                    id="sort-select"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value={SORT_OPTIONS.PRICE_LOW_TO_HIGH}>Price: Low to High</option>
                    <option value={SORT_OPTIONS.PRICE_HIGH_TO_LOW}>Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Laptop Grid */}
              {filteredAndSortedLaptops.length > 0 ? (
                <LaptopGrid
                  laptops={filteredAndSortedLaptops}
                  onApply={(laptop) => {
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
                    
                    if (!isLaptopAvailable(laptop)) {
                      return
                    }
                    setSelectedLaptop(laptop)
                    setIsApplyModalOpen(true)
                  }}
                />
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-600 text-lg mb-2">No laptops match your filters.</p>
                  <p className="text-gray-500 text-sm mb-6">Try adjusting your search criteria</p>
                  <button
                    onClick={() => setFilters(getDefaultFilters())}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </main>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => {
          setIsApplyModalOpen(false)
          setSelectedLaptop(null)
        }}
        laptop={selectedLaptop}
      />
    </div>
  )
}

export default LaptopCatalog
