import React from 'react';

const AdminApprovalQueue = ({ applications, onDecisionClick, lockedRefs = new Set() }) => {
  if (!applications || applications.length === 0) {
    return (
      <div className="py-8 text-gray-500 text-center">
        No applications pending admin approval.
      </div>
    );
  }

  return (
    <section aria-labelledby="admin-approval-queue-heading" className="mt-10">
      <h2
        id="admin-approval-queue-heading"
        className="text-lg font-semibold text-gray-900 mb-4"
      >
        Pending Admin Approval Queue
      </h2>
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
                University
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Laptop
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SRC Approved Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, idx) => (
              <tr key={app.ref} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{app.ref}</td>
                <td className="px-4 py-3 text-gray-700">{app.studentName}</td>
                <td className="px-4 py-3 text-gray-700">{app.university}</td>
                <td className="px-4 py-3 text-gray-700">{app.laptop}</td>
                <td className="px-4 py-3 text-gray-700">{app.srcApprovedDate}</td>
                <td className="px-4 py-3 text-indigo-700 font-medium">Pending Admin Review</td>
                <td className="px-4 py-3">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-3 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => onDecisionClick(app)}
                    disabled={lockedRefs.has(app.ref)}
                  >
                    {lockedRefs.has(app.ref) ? 'Decided' : 'Decide'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AdminApprovalQueue;
