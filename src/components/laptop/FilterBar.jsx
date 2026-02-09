import { useState } from 'react'
import { STOCK_STATUS } from '../../utils/stockUtils'

/**
 * FilterBar Component
 * Provides filtering options for the laptop catalog
 * 
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Object} props.filterOptions - Available filter options (brands, ramSizes, storageTypes)
 */
const FilterBar = ({ filters, onFilterChange, filterOptions }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleBrandToggle = (brand) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand]
    onFilterChange({ ...filters, brands: newBrands })
  }

  const handleRamToggle = (ram) => {
    const newRamSizes = filters.ramSizes.includes(ram)
      ? filters.ramSizes.filter(r => r !== ram)
      : [...filters.ramSizes, ram]
    onFilterChange({ ...filters, ramSizes: newRamSizes })
  }

  const handleStorageToggle = (storage) => {
    const newStorageTypes = filters.storageTypes.includes(storage)
      ? filters.storageTypes.filter(s => s !== storage)
      : [...filters.storageTypes, storage]
    onFilterChange({ ...filters, storageTypes: newStorageTypes })
  }

  const handleStockStatusToggle = (status) => {
    const newStockStatuses = filters.stockStatuses.includes(status)
      ? filters.stockStatuses.filter(s => s !== status)
      : [...filters.stockStatuses, status]
    onFilterChange({ ...filters, stockStatuses: newStockStatuses })
  }

  const handleClearFilters = () => {
    onFilterChange({
      brands: [],
      ramSizes: [],
      storageTypes: [],
      stockStatuses: []
    })
  }

  const hasActiveFilters = 
    filters.brands.length > 0 ||
    filters.ramSizes.length > 0 ||
    filters.storageTypes.length > 0 ||
    filters.stockStatuses.length > 0

  // Calculate active filter count
  const activeFilterCount = 
    filters.brands.length + 
    filters.ramSizes.length + 
    filters.storageTypes.length + 
    filters.stockStatuses.length

  const stockStatusLabels = {
    [STOCK_STATUS.IN_STOCK]: 'In Stock',
    [STOCK_STATUS.LOW_STOCK]: 'Low Stock',
    [STOCK_STATUS.OUT_OF_STOCK]: 'Out of Stock'
  }

  const FilterSection = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )

  const CheckboxItem = ({ id, label, checked, onChange }) => (
    <label htmlFor={id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="ml-2 text-sm text-gray-700">{label}</span>
    </label>
  )

  const filterContent = (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Brand Filter */}
        <FilterSection title="Brand">
          {filterOptions.brands.map((brand) => (
            <CheckboxItem
              key={brand}
              id={`brand-${brand}`}
              label={brand}
              checked={filters.brands.includes(brand)}
              onChange={() => handleBrandToggle(brand)}
            />
          ))}
        </FilterSection>

        {/* RAM Filter */}
        <FilterSection title="RAM">
          {filterOptions.ramSizes.map((ram) => (
            <CheckboxItem
              key={ram}
              id={`ram-${ram}`}
              label={`${ram}GB`}
              checked={filters.ramSizes.includes(ram)}
              onChange={() => handleRamToggle(ram)}
            />
          ))}
        </FilterSection>

        {/* Storage Type Filter */}
        <FilterSection title="Storage Type">
          {filterOptions.storageTypes.map((storage) => (
            <CheckboxItem
              key={storage}
              id={`storage-${storage}`}
              label={storage}
              checked={filters.storageTypes.includes(storage)}
              onChange={() => handleStorageToggle(storage)}
            />
          ))}
        </FilterSection>

        {/* Stock Status Filter */}
        <FilterSection title="Stock Status">
          {Object.entries(STOCK_STATUS).map(([, value]) => (
            <CheckboxItem
              key={value}
              id={`stock-${value}`}
              label={stockStatusLabels[value]}
              checked={filters.stockStatuses.includes(value)}
              onChange={() => handleStockStatusToggle(value)}
            />
          ))}
        </FilterSection>
      </div>
    </div>
  )

  return (
    <div className="mb-6">
      {/* Mobile: Collapsible Filter Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">
            Filters {hasActiveFilters && `(${activeFilterCount})`}
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && <div className="mt-4">{filterContent}</div>}
      </div>

      {/* Desktop: Always Visible */}
      <div className="hidden md:block">{filterContent}</div>
    </div>
  )
}

export default FilterBar
