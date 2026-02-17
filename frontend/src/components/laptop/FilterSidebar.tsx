import { useState } from 'react'

/**
 * FilterSidebar Component
 * Desktop-first filter sidebar for laptop catalog
 * 
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Array} props.universities - Available universities for filtering
 */

interface Filters {
  universities: string[]
  brands: string[]
  ramSizes: string[]
  storageSizes: string[]
}

interface FilterSidebarProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  universities: string[]
}

const FilterSidebar = ({ filters, onFilterChange, universities }: FilterSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // Available filter options
  const BRANDS = ['HP', 'Lenovo', 'Dell', 'Apple']
  const RAM_OPTIONS = ['8', '16']
  const STORAGE_OPTIONS = ['256', '512']

  const handleUniversityToggle = (university: string) => {
    const newUniversities = filters.universities.includes(university)
      ? filters.universities.filter(u => u !== university)
      : [...filters.universities, university]
    onFilterChange({ ...filters, universities: newUniversities })
  }

  const handleBrandToggle = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand]
    onFilterChange({ ...filters, brands: newBrands })
  }

  const handleRamToggle = (ram: string) => {
    const newRamSizes = filters.ramSizes.includes(ram)
      ? filters.ramSizes.filter(r => r !== ram)
      : [...filters.ramSizes, ram]
    onFilterChange({ ...filters, ramSizes: newRamSizes })
  }

  const handleStorageToggle = (storage: string) => {
    const newStorageSizes = filters.storageSizes.includes(storage)
      ? filters.storageSizes.filter(s => s !== storage)
      : [...filters.storageSizes, storage]
    onFilterChange({ ...filters, storageSizes: newStorageSizes })
  }

  const handleClearFilters = () => {
    onFilterChange({
      universities: [],
      brands: [],
      ramSizes: [],
      storageSizes: []
    })
  }

  const hasActiveFilters = 
    filters.universities.length > 0 ||
    filters.brands.length > 0 ||
    filters.ramSizes.length > 0 ||
    filters.storageSizes.length > 0

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 tracking-tight">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  )

  const CheckboxItem = ({ 
    id, 
    label, 
    checked, 
    onChange 
  }: { 
    id: string; 
    label: string; 
    checked: boolean; 
    onChange: () => void 
  }) => (
    <label 
      htmlFor={id} 
      className="flex items-center cursor-pointer group"
    >
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer transition-colors"
        />
      </div>
      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
        {label}
      </span>
    </label>
  )

  const filterContent = (
    <div className="space-y-6">
      {/* University Filter */}
      {universities.length > 0 && (
        <FilterSection title="University">
          <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {universities.map((university) => (
              <CheckboxItem
                key={university}
                id={`university-${university}`}
                label={university}
                checked={filters.universities.includes(university)}
                onChange={() => handleUniversityToggle(university)}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brand Filter */}
      <FilterSection title="Brand">
        {BRANDS.map((brand) => (
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
        {RAM_OPTIONS.map((ram) => (
          <CheckboxItem
            key={ram}
            id={`ram-${ram}`}
            label={`${ram}GB`}
            checked={filters.ramSizes.includes(ram)}
            onChange={() => handleRamToggle(ram)}
          />
        ))}
      </FilterSection>

      {/* Storage Filter */}
      <FilterSection title="Storage">
        {STORAGE_OPTIONS.map((storage) => (
          <CheckboxItem
            key={storage}
            id={`storage-${storage}`}
            label={`${storage}GB`}
            checked={filters.storageSizes.includes(storage)}
            onChange={() => handleStorageToggle(storage)}
          />
        ))}
      </FilterSection>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleClearFilters}
            className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile: Collapsible Filter */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="font-semibold text-gray-900">
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                {filters.universities.length + filters.brands.length + filters.ramSizes.length + filters.storageSizes.length}
              </span>
            )}
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-6">
            {filterContent}
          </div>
        )}
      </div>

      {/* Desktop: Always Visible Sidebar */}
      <div className="hidden lg:block">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm sticky top-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            {hasActiveFilters && (
              <span className="text-xs font-medium text-gray-500">
                {filters.universities.length + filters.brands.length + filters.ramSizes.length + filters.storageSizes.length} active
              </span>
            )}
          </div>
          {filterContent}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  )
}

export default FilterSidebar
