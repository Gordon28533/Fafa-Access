import React from 'react';

const DeliveryQueueTable = ({ applications }) => {
  if (!applications || applications.length === 0) {
    return (
      <div className="py-8 text-gray-500 text-center">
        No applications currently in the delivery queue.
      </div>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Queue</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-100 rounded-md">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Application Ref
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Staff
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivered
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                70% Paid
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, idx) => (
              <tr key={app.ref} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{app.ref}</td>
                <td className="px-4 py-3 text-gray-700">{app.studentName}</td>
                <td className="px-4 py-3 text-gray-700">{app.delivery?.staffName}</td>
                <td className="px-4 py-3 text-gray-700">{app.delivery?.deliveryDate}</td>
                <td className="px-4 py-3 text-gray-700">{app.delivery?.location}</td>
                <td className="px-4 py-3 text-gray-700">{app.delivered ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-gray-700">{app.paymentCollected ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-gray-700">Awaiting delivery staff confirmation</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DeliveryQueueTable;
