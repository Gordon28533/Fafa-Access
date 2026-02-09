import React from 'react';

/**
 * DeliveredApplicationsHistory Component
 * @param {Object} props
 * @param {Array} props.applications - Array of delivered application objects
 */
const DeliveredApplicationsHistory = ({ applications }) => {
  if (!applications || applications.length === 0) {
    return (
      <div className="py-6 text-gray-500 text-center">
        No delivered applications yet.
      </div>
    );
  }
  return (
    <section aria-labelledby="delivered-applications-history-heading" className="mt-10">
      <h2 id="delivered-applications-history-heading" className="text-lg font-semibold text-gray-900 mb-4">
        Delivered Applications History
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-100 rounded-md">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application Ref</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">University</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laptop</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Agent</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, idx) => (
              <tr key={app.ref} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{app.ref}</td>
                <td className="px-4 py-3 text-gray-700">{app.studentName}</td>
                <td className="px-4 py-3 text-gray-700">{app.university}</td>
                <td className="px-4 py-3 text-gray-700">{app.laptop}</td>
                <td className="px-4 py-3 text-gray-700">{app.deliveredDate}</td>
                <td className="px-4 py-3 text-gray-700">{app.deliveryAgent}</td>
                <td className="px-4 py-3">
                  <span className={
                    app.paymentStatus === 'Paid'
                      ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold'
                      : 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold'
                  }>
                    {app.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DeliveredApplicationsHistory;
