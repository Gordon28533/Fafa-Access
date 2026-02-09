import React from 'react';

const formatPrice = (value) => {
  const numeric = Number(value || 0);
  return numeric.toFixed(2);
};

const LaptopInventoryTable = ({ laptops, onEdit, onToggleStatus, togglingId }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left font-semibold">Laptop</th>
            <th className="px-6 py-3 text-left font-semibold">Price (GHS)</th>
            <th className="px-6 py-3 text-center font-semibold">Stock</th>
            <th className="px-6 py-3 text-center font-semibold">Status</th>
            <th className="px-6 py-3 text-center font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {laptops.map((laptop) => (
            <tr key={laptop.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                    {laptop.imageUrl ? (
                      <img
                        src={laptop.imageUrl}
                        alt={`${laptop.brand} ${laptop.model}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-xs text-gray-400">No Image</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {laptop.brand} {laptop.model}
                    </p>
                    <p className="text-sm text-gray-500">
                      {laptop.processor || 'Processor -'} · {laptop.ram || 'RAM -'} · {laptop.storage || 'Storage -'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm line-through text-gray-500">
                    GHS {formatPrice(laptop.originalPrice)}
                  </p>
                  <p className="font-semibold text-green-600">
                    GHS {formatPrice(laptop.discountedPrice)}
                  </p>
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="font-semibold">{laptop.stockQuantity}</span>
              </td>
              <td className="px-6 py-4 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    laptop.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {laptop.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => onEdit(laptop)}
                    className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onToggleStatus(laptop)}
                    className={`px-3 py-1 rounded text-sm ${
                      laptop.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    disabled={togglingId === laptop.id}
                  >
                    {togglingId === laptop.id
                      ? 'Updating...'
                      : laptop.isActive
                        ? 'Deactivate'
                        : 'Activate'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LaptopInventoryTable;
