import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdmin } from '../utils/permissions'
import { getStockStatus, STOCK_STATUS } from '../utils/stockUtils'
import LaptopFormModal from '../components/admin/LaptopFormModal'

const AdminProductManagement = () => {
  const { authFetch, user } = useAuth()
  const navigate = useNavigate()

  const [laptops, setLaptops] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingLaptop, setEditingLaptop] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch all laptops (including inactive)
      const laptopsRes = await authFetch('/api/laptops/admin/all')
      if (!laptopsRes.ok) throw new Error('Failed to fetch laptops')
      const laptopsData = await laptopsRes.json()

      // Fetch summary stats
      const summaryRes = await authFetch('/api/laptops/admin/summary')
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        setSummary(summaryData.data)
      }

      setLaptops(laptopsData.data?.laptops || [])
    } catch (err) {
      if (!err.message?.includes('Session expired') && !err.message?.includes('permission')) {
        setError(err.message)
      }
      console.error('Error fetching laptops:', err)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (user && !isAdmin(user)) {
      navigate('/unauthorized', { replace: true })
      return
    }
    fetchData()
  }, [fetchData, navigate, user])

  const handleAddClick = () => {
    setEditingLaptop(null)
    setShowFormModal(true)
  }

  const handleEditClick = (laptop) => {
    setEditingLaptop(laptop)
    setShowFormModal(true)
  }

  const handleFormClose = () => {
    setShowFormModal(false)
    setEditingLaptop(null)
  }

  const handleFormSuccess = async () => {
    setShowFormModal(false)
    setEditingLaptop(null)
    await fetchData()
  }

  const handleToggleActive = async (laptopId, currentStatus) => {
    try {
      setActionLoading(laptopId)
      setError('')

      const url = currentStatus
        ? `/api/laptops/admin/${laptopId}`
        : `/api/laptops/admin/${laptopId}/activate`
      const method = currentStatus ? 'DELETE' : 'POST'

      const res = await authFetch(url, { method })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to update laptop status')
      }

      await fetchData()
    } catch (err) {
      setError(err.message)
      console.error('Error toggling laptop status:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const getStockBadge = (laptop) => {
    const status = getStockStatus(laptop.stockQuantity)
    const config = {
      [STOCK_STATUS.IN_STOCK]: { label: 'In Stock', color: 'bg-green-100 text-green-800' },
      [STOCK_STATUS.LOW_STOCK]: { label: 'Low Stock', color: 'bg-orange-100 text-orange-800' },
      [STOCK_STATUS.OUT_OF_STOCK]: { label: 'Out of Stock', color: 'bg-red-100 text-red-800' },
    }
    const badge = config[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label} ({laptop.stockQuantity})
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-2">
              <ol className="flex items-center gap-2">
                <li>
                  <Link to="/admin" className="hover:text-gray-700">
                    Admin
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-900 font-medium">Product Management</li>
              </ol>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Manage laptop inventory and availability</p>
          </div>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalLaptops}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Active</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{summary.activeLaptops}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Stock</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{summary.totalStock}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Inventory Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    GH₵{summary.totalValue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Specs
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {laptops.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No products yet</p>
                        <p className="text-sm text-gray-400">Add your first product to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  laptops.map((laptop) => (
                    <tr key={laptop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {laptop.imageUrl ? (
                            <img
                              src={laptop.imageUrl}
                              alt={`${laptop.brand} ${laptop.model}`}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{laptop.brand} {laptop.model}</p>
                            <p className="text-sm text-gray-500">SN: {laptop.serialNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {laptop.ram && <p>{laptop.ram} RAM</p>}
                          {laptop.storage && <p>{laptop.storage}</p>}
                          {laptop.processor && <p className="text-xs text-gray-500">{laptop.processor}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-bold text-gray-900">
                            GH₵{laptop.discountedPrice.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                          </p>
                          {laptop.originalPrice !== laptop.discountedPrice && (
                            <p className="text-xs text-gray-500 line-through">
                              GH₵{laptop.originalPrice.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStockBadge(laptop)}
                      </td>
                      <td className="px-6 py-4">
                        {laptop.isActive ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(laptop)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleActive(laptop.id, laptop.isActive)}
                            disabled={actionLoading === laptop.id}
                            className={`p-2 rounded-lg transition-colors ${
                              laptop.isActive
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={laptop.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {actionLoading === laptop.id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : laptop.isActive ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <LaptopFormModal
          laptop={editingLaptop}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

export default AdminProductManagement
