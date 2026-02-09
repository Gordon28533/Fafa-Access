import StockBadge from './StockBadge'
import { isLaptopAvailable } from '../../utils/stockUtils'

/**
 * LaptopCard Component
 * Clean laptop product card with image, specs, price, and apply button
 * 
 * @param {Object} props
 * @param {Object} props.laptop - Laptop object
 * @param {Function} props.onApply - Callback when Apply is clicked
 */
const LaptopCard = ({ laptop, onApply }) => {
  const available = isLaptopAvailable(laptop)
  const active = Boolean(laptop.isActive)

  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
        {laptop.imageUrl ? (
          <img
            src={laptop.imageUrl}
            alt={`${laptop.brand} ${laptop.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <svg
            className="w-24 h-24 text-gray-300"
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
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 left-3">
          <StockBadge stockQuantity={laptop.stockQuantity} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Brand + Model */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
          {laptop.brand} {laptop.model}
        </h3>

        {/* Specs */}
        <div className="mb-4 space-y-1.5 text-sm text-gray-600 flex-grow">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">RAM</span>
            <span>{laptop.specs?.ram || laptop.ram || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Storage</span>
            <span>{laptop.specs?.storage || laptop.storage || 'N/A'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-4"></div>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-gray-900">
            GH₵{(laptop.discountedPrice || laptop.price || 0).toLocaleString()}
          </p>
        </div>

        {/* Apply Button */}
        <button
          disabled={!available || !active}
          onClick={() => available && active && onApply && onApply(laptop)}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 text-sm ${
            available && active
              ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm hover:shadow-md'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {available && active ? 'Apply for Laptop' : 'Out of Stock'}
        </button>
      </div>
    </div>
  )
}

export default LaptopCard
