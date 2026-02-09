import React, { useMemo, useState } from 'react';
import NotificationService from '../../services/NotificationService';

const roles = ['All', 'Student', 'SRC', 'Admin', 'Delivery'];
const channels = ['All', 'sms', 'whatsapp', 'email'];
const statuses = ['All', 'sent', 'failed', 'exhausted'];

const NotificationLog = () => {
  const [roleFilter, setRoleFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const notifications = useMemo(() => NotificationService.getStatusLog(), []);

  const filtered = useMemo(() => {
    return notifications.filter(n =>
      (roleFilter === 'All' || n.recipientRole === roleFilter) &&
      (channelFilter === 'All' || n.channel === channelFilter) &&
      (statusFilter === 'All' || n.status === statusFilter)
    );
  }, [notifications, roleFilter, channelFilter, statusFilter]);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Log</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          Role:
          <select
            className="border rounded px-2 py-1"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Channel:
          <select
            className="border rounded px-2 py-1"
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
          >
            {channels.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Status:
          <select
            className="border rounded px-2 py-1"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-100 rounded-md">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correlation ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-gray-500 text-center">No notifications found.</td>
              </tr>
            ) : (
              filtered.map((n, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{new Date(n.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{n.recipientName}</td>
                  <td className="px-4 py-3 text-gray-700">{n.recipientRole}</td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{n.channel}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    <span className={`px-2 py-1 rounded text-xs ${
                      n.status === 'sent' ? 'bg-green-100 text-green-800' :
                      n.status === 'failed' ? 'bg-yellow-100 text-yellow-800' :
                      n.status === 'exhausted' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {n.status || 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{n.title}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs font-mono break-all">{n.correlationId}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default NotificationLog;
