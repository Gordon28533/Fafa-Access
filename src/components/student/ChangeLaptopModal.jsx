import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createLaptopService } from '../../services/laptopService';

/**
 * ChangeLaptopModal Component
 * Allows students to change their laptop choice before SRC review
 */
const ChangeLaptopModal = ({ isOpen, onClose, application, onSuccess }) => {
  const { authFetch } = useAuth();
  const [laptops, setLaptops] = useState([]);
  const [selectedLaptopId, setSelectedLaptopId] = useState(application?.laptopId || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLaptops = useCallback(async () => {
    try {
      setLoading(true);
      const laptopService = createLaptopService(authFetch);
      const response = await laptopService.getActiveLaptops();
      setLaptops(response.data?.laptops || []);
    } catch (err) {
      setError('Failed to load laptops');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (isOpen) {
      fetchLaptops();
      setSelectedLaptopId(application?.laptopId || '');
      setError('');
    }
  }, [isOpen, application, fetchLaptops]);

  const handleSave = async () => {
    if (!selectedLaptopId) {
      setError('Please select a laptop');
      return;
    }

    if (selectedLaptopId === application?.laptopId) {
      setError('Please select a different laptop');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await authFetch(`/api/applications/${application.id}/laptop`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ laptopId: selectedLaptopId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update laptop');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update laptop choice');
    } finally {
      setSaving(false);
    }
  };

  const filteredLaptops = laptops.filter(laptop =>
    `${laptop.brand} ${laptop.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentLaptop = laptops.find(l => String(l.id) === String(application?.laptopId));
  const selectedLaptop = laptops.find(l => String(l.id) === String(selectedLaptopId));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Change Laptop Choice</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl leading-none"
            disabled={saving}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Laptop */}
          {currentLaptop && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Current Selection:</h3>
              <p className="text-lg font-medium text-gray-900">
                {currentLaptop.brand} {currentLaptop.model}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {currentLaptop.processor || '-'} • {currentLaptop.ram || '-'} • {currentLaptop.storage || '-'}
              </p>
              <p className="text-green-600 font-semibold mt-2">
                GHS {currentLaptop.discountedPrice?.toLocaleString()}
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You can only change your laptop choice before SRC reviews your application.
              Once reviewed, this option will no longer be available.
            </p>
          </div>

          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Laptops
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by brand or model..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Laptop List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
              <p className="text-gray-600 mt-2">Loading laptops...</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLaptops.map((laptop) => (
                <div
                  key={laptop.id}
                  onClick={() => setSelectedLaptopId(laptop.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedLaptopId === laptop.id
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 bg-white'
                  } ${laptop.id === application?.laptopId ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {laptop.brand} {laptop.model}
                        {laptop.id === application?.laptopId && (
                          <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {laptop.processor || '-'}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>RAM: {laptop.ram || '-'}</span>
                        <span>Storage: {laptop.storage || '-'}</span>
                      </div>
                      {laptop.stockQuantity !== undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          Stock: {laptop.stockQuantity} available
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-lg font-bold text-green-600">
                        GHS {laptop.discountedPrice?.toLocaleString()}
                      </p>
                      {laptop.originalPrice > laptop.discountedPrice && (
                        <p className="text-sm text-gray-500 line-through">
                          GHS {laptop.originalPrice?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredLaptops.length === 0 && !loading && (
                <p className="text-center text-gray-500 py-8">No laptops found</p>
              )}
            </div>
          )}

          {/* New Selection Preview */}
          {selectedLaptop && selectedLaptopId !== application?.laptopId && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">New Selection:</h3>
              <p className="text-lg font-medium text-gray-900">
                {selectedLaptop.brand} {selectedLaptop.model}
              </p>
              <p className="text-green-600 font-semibold mt-2">
                GHS {selectedLaptop.discountedPrice?.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedLaptopId || selectedLaptopId === application?.laptopId}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeLaptopModal;
