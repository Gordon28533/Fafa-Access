import { getStockStatus, getStockLabel } from '../../utils/stockUtils'

/**
 * StockBadge Component
 * Displays stock status with color-coded badges
 * - Green: In Stock
 * - Orange: Low Stock
 * - Grey: Out of Stock
 * 
 * @param {Object} props
 * @param {number} props.stockQuantity - Current stock quantity
 */
const StockBadge = ({ stockQuantity }) => {
  const status = getStockStatus(stockQuantity)
  const label = getStockLabel(status)

  const getBadgeColor = () => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-700 border border-green-300'
      case 'low_stock':
        return 'bg-orange-100 text-orange-700 border border-orange-300'
      case 'out_of_stock':
        return 'bg-gray-100 text-gray-600 border border-gray-300'
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-300'
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getBadgeColor()}`}>
      {label}
    </span>
  )
}

export default StockBadge
