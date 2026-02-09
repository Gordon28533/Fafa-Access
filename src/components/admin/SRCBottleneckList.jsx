import React from 'react'

/**
 * SRCBottleneckList Component
 * @param {Object} props
 * @param {Array} props.bottlenecks - Array of SRC bottleneck objects
 * Each object: { university: string, pendingCount: number, oldestSubmissionDate: string }
 */
const SRCBottleneckList = ({ bottlenecks }) => {
  if (!bottlenecks || bottlenecks.length === 0) {
    return (
      <div className="py-6 text-gray-500 text-center">No SRC bottlenecks at this time.</div>
    )
  }
  return (
    <section aria-labelledby="src-bottleneck-heading" className="mt-10">
      <h2 id="src-bottleneck-heading" className="text-lg font-semibold text-gray-900 mb-4">Pending SRC Bottlenecks</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-100 rounded-md">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oldest Submission</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Pending</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {bottlenecks.map((item, idx) => {
              const daysPending = Math.max(0, Math.floor((Date.now() - new Date(item.oldestSubmissionDate).getTime()) / (1000 * 60 * 60 * 24)))
              const isCritical = daysPending >= 5
              return (
                <tr key={item.university} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{item.university}</td>
                  <td className="px-4 py-3 text-gray-700">{item.pendingCount}</td>
                  <td className="px-4 py-3 text-gray-700">{item.oldestSubmissionDate}</td>
                  <td className={`px-4 py-3 ${isCritical ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>{daysPending} day{daysPending === 1 ? '' : 's'}</td>
                  <td className="px-4 py-3 text-yellow-700 font-medium">Awaiting SRC Review</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default SRCBottleneckList