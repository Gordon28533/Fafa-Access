import LaptopCard from './LaptopCard'

/**
 * LaptopGrid Component
 * Displays laptops in a responsive 3-column grid layout
 * 
 * @param {Object} props
 * @param {Array} props.laptops - Array of laptop objects
 * @param {Function} props.onApply - Callback when Apply is clicked
 */
const LaptopGrid = ({ laptops, onApply }) => {
  if (!laptops || laptops.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {laptops.map((laptop) => (
        <LaptopCard key={laptop.id} laptop={laptop} onApply={onApply} />
      ))}
    </div>
  )
}

export default LaptopGrid
