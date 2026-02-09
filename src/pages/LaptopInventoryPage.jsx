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

  // Fetch data on mount
  useEffect(() => {
    if (user && !isAdmin(user)) {
      navigate('/unauthorized', { replace: true });
      return;
    }
    fetchData();
  }, [fetchData, navigate, user]);

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
    });
    setImagePreview(laptop.imageUrl || '');
    setShowAddForm(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Image size must be 2MB or less');
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

      if (!formData.originalPrice || !formData.discountedPrice) {
        setError('Original and Discounted prices are required');
        return;
      }

      const originalPrice = Number(formData.originalPrice);
      const discountedPrice = Number(formData.discountedPrice);
      const stockQuantity = parseInt(formData.stockQuantity || '0', 10);

      if (Number.isNaN(originalPrice) || Number.isNaN(discountedPrice)) {
        setError('Prices must be valid numbers');
        return;
      }

      if (discountedPrice > originalPrice) {
        setError('Discounted price cannot exceed original price');
        return;
      }

      const payload = {
        ...formData,
        originalPrice,
        discountedPrice,
        stockQuantity: Number.isNaN(stockQuantity) ? 0 : stockQuantity,
      };

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
        throw new Error(data.message || 'Failed to save laptop');
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
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {editingId ? 'Edit Laptop' : 'Add New Laptop'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                      className="border rounded px-3 py-2"
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
                      type="number"
                      name="originalPrice"
                      placeholder="Original Price (GHS)"
                      value={formData.originalPrice}
                      onChange={handleFormChange}
                      className="border rounded px-3 py-2"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      name="discountedPrice"
                      placeholder="Discounted Price (GHS)"
                      value={formData.discountedPrice}
                      onChange={handleFormChange}
                      className="border rounded px-3 py-2"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      name="stockQuantity"
                      placeholder="Stock Quantity"
                      value={formData.stockQuantity}
                      onChange={handleFormChange}
                      className="border rounded px-3 py-2"
                      min="0"
                    />
                    <div className="md:col-span-2">
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
                      className="border rounded px-3 py-2 md:col-span-2"
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
                <th className="px-6 py-3 text-left font-semibold">Brand/Model</th>
                <th className="px-6 py-3 text-left font-semibold">Serial</th>
                <th className="px-6 py-3 text-left font-semibold">Specs</th>
                <th className="px-6 py-3 text-right font-semibold">Price (GHS)</th>
                <th className="px-6 py-3 text-center font-semibold">Stock</th>
                <th className="px-6 py-3 text-center font-semibold">Status</th>
                <th className="px-6 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {laptops.map((laptop) => (
                <tr key={laptop.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold">{laptop.brand} {laptop.model}</p>
                      {laptop.imageUrl && (
                        <img
                          src={laptop.imageUrl}
                          alt={`${laptop.brand} ${laptop.model}`}
                          className="w-12 h-12 mt-2 rounded"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{laptop.serialNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    {laptop.processor && <p>{laptop.processor}</p>}
                    {laptop.ram && <p>{laptop.ram}</p>}
                    {laptop.storage && <p>{laptop.storage}</p>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div>
                      <p className="text-sm line-through text-gray-500">
                        {laptop.originalPrice.toFixed(2)}
                      </p>
                      <p className="font-semibold text-green-600">
                        {laptop.discountedPrice.toFixed(2)}
                      </p>
                    </div>
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
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        laptop.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {laptop.isActive ? 'Active' : 'Inactive'}
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
                        {laptop.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
