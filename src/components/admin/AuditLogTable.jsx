import React from 'react';

/**
 * AuditLogTable Component
 * @param {Object} props
 * @param {Array} props.logs - Array of audit log objects
 */
const AuditLogTable = ({ logs }) => {
  return (
    <section aria-labelledby="audit-log-heading" className="mt-10">
      <h2 id="audit-log-heading" className="text-lg font-semibold text-gray-900 mb-4">Audit Log</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-100 rounded-md">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-gray-500 text-center">No admin actions yet.</td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{log.admin}</td>
                  <td className="px-4 py-3 text-gray-700">{log.action}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">
                    <pre className="whitespace-pre-wrap break-all bg-gray-50 rounded p-2">{JSON.stringify(log.details, null, 2)}</pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AuditLogTable;
