import React from 'react'

const AdminStatsCard = ({ label, value, icon }) => {
  return (
    <article className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-md shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="flex-none w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-xl font-medium text-gray-900">{value}</p>
        </div>
      </div>
    </article>
  )
}

export default AdminStatsCard
