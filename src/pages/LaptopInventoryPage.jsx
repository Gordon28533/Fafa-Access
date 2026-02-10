import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../utils/permissions';

/**
 * Admin Laptop Inventory Management Page
 * Allows admins to:
 * - View all laptops (active and inactive)
 * - Add new laptops
 * - Edit laptop details
 * - Manage stock
 * - Activate/deactivate laptops
 */
function LaptopInventoryPage() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
  const [laptops, setLaptops] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    processor: '',
    ram: '',
    storage: '',
    screen: '',
    serialNumber: '',
    originalPrice: '',
    discountedPrice: '',
    stockQuantity: '0',
    imageUrl: '',
    universityId: '',
    isActive: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all laptops
      const laptopsRes = await authFetch('/api/laptops/admin/all');
      if (!laptopsRes.ok) throw new Error('Failed to fetch laptops');
      const laptopsData = await laptopsRes.json();

      // Fetch summary
      const summaryRes = await authFetch('/api/laptops/admin/summary');
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData.data);
      }

      setLaptops(laptopsData.data?.laptops || []);
    } catch (err) {
      // Auth errors (401/403) handled by AuthContext with redirect
      // Only show business errors to user
      if (!err.message?.includes('Session expired') && !err.message?.includes('permission')) {
        setError(err.message);
      }
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  const fetchUniversities = useCallback(async () => {
    try {
      setUniversitiesLoading(true);
      const res = await authFetch('/api/admin/universities');
      if (!res.ok) {
        throw new Error('Failed to fetch universities');
      }
      const data = await res.json();
      setUniversities(data.data?.universities || []);
    } catch (err) {
      console.error('Error fetching universities:', err);
      setUniversities([]);
    } finally {
      setUniversitiesLoading(false);
    }
  }, [authFetch]);

  // Fetch data on mount
  useEffect(() => {
    if (user && !isAdmin(user)) {
      navigate('/unauthorized', { replace: true });
      return;
    }
    fetchData();
    fetchUniversities();
  }, [fetchData, fetchUniversities, navigate, user]);

  useEffect(() => {
    if (formData.imageUrl) {
      setImagePreview(formData.imageUrl);
    } else {
      setImagePreview('');
    }
  }, [formData.imageUrl]);

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      brand: '',
      model: '',
      processor: '',
      ram: '',
      storage: '',
      screen: '',
      serialNumber: '',
      originalPrice: '',
      discountedPrice: '',
      stockQuantity: '0',
      imageUrl: '',
      universityId: '',
      isActive: false,
    });
    setImagePreview('');
    setShowAddForm(true);
  };

  const handleEditClick = (laptop) => {
    setEditingId(laptop.id);
    setFormData({
      brand: laptop.brand,
      model: laptop.model,
      processor: laptop.processor || '',
      ram: laptop.ram || '',
      storage: laptop.storage || '',
      screen: laptop.screen || '',
      serialNumber: laptop.serialNumber,
      originalPrice: laptop.originalPrice.toString(),
      discountedPrice: laptop.discountedPrice.toString(),
      stockQuantity: laptop.stockQuantity.toString(),
      imageUrl: laptop.imageUrl || '',
      universityId: laptop.universityId || '',
      isActive: Boolean(laptop.isActive),
    });
    setImagePreview(laptop.imageUrl || '');
    setShowAddForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Image size must be 2MB or less');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() || '';
      setFormData((prev) => ({
        ...prev,
        imageUrl: result,
      }));
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validate
      if (!formData.brand || !formData.model || !formData.serialNumber) {
        setError('Brand, Model, and Serial Number are required');
        return;
      }

      if (!formData.discountedPrice) {
        setError('Program price is required');
        return;
      }

      const discountedPrice = Number(formData.discountedPrice);
      const originalPrice = Number(formData.originalPrice || formData.discountedPrice);
      const stockQuantity = parseInt(formData.stockQuantity || '0', 10);

      if (Number.isNaN(originalPrice) || Number.isNaN(discountedPrice)) {
        setError('Prices must be valid numbers');
        return;
      }

      if (originalPrice < discountedPrice) {
        setError('Reference price cannot be lower than program price');
        return;
      }

      const payload = {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        processor: formData.processor?.trim() || null,
        ram: formData.ram?.trim() || null,
        storage: formData.storage?.trim() || null,
        screen: formData.screen?.trim() || null,
        serialNumber: formData.serialNumber.trim(),
        originalPrice,
        discountedPrice,
        stockQuantity: Number.isNaN(stockQuantity) ? 0 : stockQuantity,
        imageUrl: formData.imageUrl?.trim() || null,
        universityId: formData.universityId || null,
        isActive: Boolean(formData.isActive),
      };

      console.log('[LaptopInventory] Submitting payload:', payload);

      const url = editingId
        ? `/api/laptops/admin/${editingId}`
        : '/api/laptops/admin';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        // Show detailed validation errors if available
        const errorMessage = data.errors && data.errors.length > 0
          ? data.errors.join(', ')
          : (data.message || 'Failed to save laptop');
        throw new Error(errorMessage);
      }

      setShowAddForm(false);
      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error('Error saving laptop:', err);
    }
  };

  const handleToggleActive = async (laptopId, currentStatus) => {
    try {
      setError('');

      const url = currentStatus
        ? `/api/laptops/admin/${laptopId}`
        : `/api/laptops/admin/${laptopId}/activate`;
      const method = currentStatus ? 'DELETE' : 'POST';

      const res = await authFetch(url, { method });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update laptop status');
      }

      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error('Error toggling laptop status:', err);
    }
  };

  const handleAdjustStock = async (laptopId, change) => {
    try {
      setError('');

      const res = await authFetch(`/api/laptops/admin/${laptopId}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: change, reason: 'Manual adjustment' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to adjust stock');
      }

      await fetchData();
    } catch (err) {
      setError(err.message);
      console.error('Error adjusting stock:', err);
    }
  };

  const formatCurrency = (value) => {
    const numeric = Number(value || 0);
    return numeric.toFixed(2);
  };

  const getStockStatus = (laptop) => {
    if (!laptop.isActive) {
      return { label: 'Draft', className: 'bg-slate-100 text-slate-700' };
    }
    if ((laptop.stockQuantity || 0) <= 0) {
      return { label: 'Out of Stock', className: 'bg-rose-100 text-rose-700' };
    }
    if ((laptop.stockQuantity || 0) <= 5) {
      return { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'In Stock', className: 'bg-emerald-100 text-emerald-700' };
  };

  const getUniversityName = (universityId) => {
    if (!universityId) return 'All Universities';
    const match = universities.find((uni) => uni.id === universityId);
    return match ? match.name : 'Unknown University';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
              <ol className="flex items-center gap-2">
                <li>
                  <Link to="/admin" className="hover:text-gray-700">Admin</Link>
                </li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-900 font-medium">Inventory</li>
              </ol>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900">Laptop Inventory</h1>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
          >
            + Add Laptop
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Total Laptops</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalLaptops}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-600">{summary.activeLaptops}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Total Stock</p>
              <p className="text-3xl font-bold text-blue-600">{summary.totalStock}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-500 text-sm">Inventory Value</p>
              <p className="text-3xl font-bold text-gray-900">
                GHS {summary.totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between gap-6 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {editingId ? 'Edit Laptop' : 'Add New Laptop'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Internal inventory management only. Pricing is split 70% on delivery and 30% later.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <section className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="brand"
                        placeholder="Brand"
                        value={formData.brand}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                        required
                      />
                      <input
                        type="text"
                        name="model"
                        placeholder="Model"
                        value={formData.model}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                        required
                      />
                      <input
                        type="text"
                        name="serialNumber"
                        placeholder="Serial Number"
                        value={formData.serialNumber}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                        required
                      />
                      <input
                        type="text"
                        name="processor"
                        placeholder="Processor"
                        value={formData.processor}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        name="ram"
                        placeholder="RAM (e.g., 8GB)"
                        value={formData.ram}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        name="storage"
                        placeholder="Storage (e.g., 512GB SSD)"
                        value={formData.storage}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        name="screen"
                        placeholder="Screen (e.g., 15.6 FHD)"
                        value={formData.screen}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2 md:col-span-2"
                      />
                    </div>
                  </section>

                  <section className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Pricing (Fixed Split)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="number"
                        name="discountedPrice"
                        placeholder="Program Price (Total GHS)"
                        value={formData.discountedPrice}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                        step="0.01"
                        required
                      />
                      <input
                        type="number"
                        name="originalPrice"
                        placeholder="Reference Price (Optional)"
                        value={formData.originalPrice}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                        step="0.01"
                      />
                    </div>
                    <div className="mt-3 text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs uppercase text-gray-500">Pay on Delivery (70%)</p>
                        <p className="font-semibold text-gray-900">
                          GHS {formatCurrency(Number(formData.discountedPrice || 0) * 0.7)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs uppercase text-gray-500">Pay Later (30%)</p>
                        <p className="font-semibold text-gray-900">
                          GHS {formatCurrency(Number(formData.discountedPrice || 0) * 0.3)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs uppercase text-gray-500">Program Total</p>
                        <p className="font-semibold text-gray-900">
                          GHS {formatCurrency(formData.discountedPrice || 0)}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Availability & Stock</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        name="universityId"
                        value={formData.universityId}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                      >
                        <option value="">All Universities</option>
                        {universities.map((uni) => (
                          <option key={uni.id} value={uni.id}>
                            {uni.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        name="stockQuantity"
                        placeholder="Stock Quantity"
                        value={formData.stockQuantity}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                        min="0"
                      />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleFormChange}
                          className="h-4 w-4"
                        />
                        Published (visible to students)
                      </label>
                      <span className={`text-xs px-2 py-1 rounded-full ${formData.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {formData.isActive ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {universitiesLoading && (
                      <p className="text-xs text-gray-500 mt-2">Loading universities...</p>
                    )}
                  </section>

                  <section className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Media</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image Upload (JPG, PNG, WEBP)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          You can also paste a hosted image URL below.
                        </p>
                      </div>
                      <input
                        type="url"
                        name="imageUrl"
                        placeholder="Image URL (optional)"
                        value={formData.imageUrl}
                        onChange={handleFormChange}
                        className="border rounded px-3 py-2"
                      />
                    </div>

                    {imagePreview && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                        <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                          <img
                            src={imagePreview}
                            alt="Laptop preview"
                            className="max-h-48 rounded shadow"
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  <div className="flex gap-4 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium"
                    >
                      {editingId ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-gray-300 text-gray-900 py-2 rounded hover:bg-gray-400 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Laptops Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Laptop</th>
                <th className="px-6 py-3 text-left font-semibold">Availability</th>
                <th className="px-6 py-3 text-left font-semibold">Pricing (GHS)</th>
                <th className="px-6 py-3 text-center font-semibold">Stock</th>
                <th className="px-6 py-3 text-center font-semibold">State</th>
                <th className="px-6 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {laptops.map((laptop) => {
                const stockStatus = getStockStatus(laptop);
                return (
                  <tr key={laptop.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                          {laptop.imageUrl ? (
                            <img
                              src={laptop.imageUrl}
                              alt={`${laptop.brand} ${laptop.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">No Image</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {laptop.brand} {laptop.model}
                          </p>
                          <p className="text-xs text-gray-500">
                            {laptop.processor || 'Processor'} · {laptop.ram || 'RAM'} · {laptop.storage || 'Storage'}
                          </p>
                          <p className="text-xs text-gray-400">Serial: {laptop.serialNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium text-gray-900">
                        {getUniversityName(laptop.universityId)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {laptop.universityId ? 'University-only listing' : 'Visible to all campuses'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">Program Total</p>
                      <p className="font-semibold text-gray-900">GHS {formatCurrency(laptop.discountedPrice)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        70%: GHS {formatCurrency(laptop.discountedPrice * 0.7)} · 30%: GHS {formatCurrency(laptop.discountedPrice * 0.3)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleAdjustStock(laptop.id, -1)}
                          className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm hover:bg-red-200"
                          disabled={laptop.stockQuantity === 0}
                        >
                          -
                        </button>
                        <span className="font-semibold w-8 text-center">
                          {laptop.stockQuantity}
                        </span>
                        <button
                          onClick={() => handleAdjustStock(laptop.id, 1)}
                          className="bg-green-100 text-green-600 px-2 py-1 rounded text-sm hover:bg-green-200"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.className}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditClick(laptop)}
                          className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleToggleActive(laptop.id, laptop.isActive)
                          }
                          className={`px-3 py-1 rounded text-sm ${
                            laptop.isActive
                              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {laptop.isActive ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {laptops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No laptops found. Create your first laptop!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LaptopInventoryPage;
