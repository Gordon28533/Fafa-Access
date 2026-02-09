import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  createSupportTicket,
  listMyTickets,
  getTicketById,
  replyToTicket,
  closeTicket,
} from '../services/supportTicketService';
import { MessageSquare, Plus, ChevronLeft, Clock, AlertCircle, Lock, FileText, Send } from 'lucide-react';

const ISSUE_TYPE_LABELS = {
  VERIFICATION: '📋 Verification',
  PAYMENT: '💳 Payment',
  DELIVERY: '🚚 Delivery',
  OTHER: '❓ Other',
};

const ISSUE_TYPES = ['VERIFICATION', 'PAYMENT', 'DELIVERY', 'OTHER'];

const STATUS_COLORS = {
  OPEN: 'bg-blue-50 border-blue-200 text-blue-900',
  IN_PROGRESS: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  RESOLVED: 'bg-green-50 border-green-200 text-green-900',
  CLOSED: 'bg-gray-50 border-gray-200 text-gray-900',
};

const SupportTickets = () => {
  const { authFetch } = useAuth();

  // State: list / detail / create
  const [view, setView] = useState('list');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);

  // Create form state
  const [formData, setFormData] = useState({
    issueType: 'OTHER',
    subject: '',
    description: '',
    attachments: [],
  });

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load tickets on mount
  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listMyTickets(authFetch);
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId) => {
    try {
      setLoading(true);
      setError('');
      const data = await getTicketById(authFetch, ticketId);
      setSelectedTicket(data.ticket);
      setTicketMessages(data.messages || []);
      setView('detail');
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.issueType || !formData.subject.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const ticketData = {
        issueType: formData.issueType,
        subject: formData.subject,
        description: formData.description,
        attachments: formData.attachments,
      };

      await createSupportTicket(authFetch, ticketData);
      setSuccess('Ticket created successfully!');
      setFormData({
        issueType: 'OTHER',
        subject: '',
        description: '',
        attachments: [],
      });

      // Reload and return to list
      setTimeout(() => {
        loadTickets();
        setView('list');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setError('Reply message is required');
      return;
    }

    if (selectedTicket.status === 'CLOSED') {
      setError('This ticket is closed');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const result = await replyToTicket(authFetch, selectedTicket.id, {
        message: replyText,
        attachments: replyAttachments,
      });

      setSelectedTicket(result.ticket);
      setTicketMessages(result.messages);
      setReplyText('');
      setReplyAttachments([]);
      setSuccess('Reply added');
    } catch (err) {
      setError(err.message || 'Failed to add reply');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm('Close this ticket? You will not be able to reply once closed.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const result = await closeTicket(authFetch, selectedTicket.id);
      setSelectedTicket(result);
      setSuccess('Ticket closed');

      setTimeout(() => {
        loadTickets();
        setView('list');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to close ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ===== Render: List View =====
  if (view === 'list') {
    return (
      <div className="max-w-6xl mx-auto py-10 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <p className="text-sm uppercase tracking-wide text-gray-500">Support</p>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Ticket
            </button>
          </div>
          <p className="text-gray-600 mt-2">Create and manage your support requests</p>
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div
            className={`p-4 rounded-lg border ${
              error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}
          >
            <p className={`text-sm font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
              {error || success}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        )}

        {/* Tickets Grid */}
        {!loading && tickets.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-lg p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No support tickets yet</p>
            <p className="text-gray-500 text-sm mt-1">Create one to get help with any issues</p>
            <button
              onClick={() => setView('create')}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create First Ticket
            </button>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => loadTicketDetail(ticket.id)}
                className="bg-white border border-gray-100 rounded-lg p-6 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{ISSUE_TYPE_LABELS[ticket.issueType].split(' ')[0]}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{ticket.description.substring(0, 100)}...</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{ISSUE_TYPE_LABELS[ticket.issueType].split(' ')[1]}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(ticket.lastMessageAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      STATUS_COLORS[ticket.status]
                    }`}
                  >
                    {ticket.status}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== Render: Create Ticket View =====
  if (view === 'create') {
    return (
      <div className="max-w-3xl mx-auto py-10">
        {/* Back Button */}
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Tickets
        </button>

        {/* Form */}
        <div className="bg-white border border-gray-100 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Support Ticket</h2>

          {/* Alerts */}
          {(error || success) && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              }`}
            >
              <p className={`text-sm font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
                {error || success}
              </p>
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="space-y-6">
            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                value={formData.issueType}
                onChange={(e) => handleFormChange('issueType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ISSUE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleFormChange('subject', e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Provide details about your issue..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Attachments Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  You can add file attachments once the ticket is created.
                </p>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Ticket'}
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ===== Render: Ticket Detail View =====
  if (view === 'detail' && selectedTicket) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        {/* Back Button */}
        <button
          onClick={() => setView('list')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Tickets
        </button>

        {/* Ticket Header */}
        <div className="bg-white border border-gray-100 rounded-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.subject}</h2>
              <p className="text-gray-600">{ISSUE_TYPE_LABELS[selectedTicket.issueType]}</p>
            </div>
            <div
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                STATUS_COLORS[selectedTicket.status]
              }`}
            >
              {selectedTicket.status}
            </div>
          </div>

          {/* Ticket Info */}
          <div className="flex items-center gap-6 text-sm text-gray-600 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {ticketMessages.length} {ticketMessages.length === 1 ? 'message' : 'messages'}
            </div>
            {selectedTicket.status === 'CLOSED' && (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Closed (read-only)
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}
          >
            <p className={`text-sm font-medium ${error ? 'text-red-800' : 'text-green-800'}`}>
              {error || success}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="bg-white border border-gray-100 rounded-lg p-8 mb-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Conversation</h3>

          {loading && <p className="text-gray-600">Loading messages...</p>}

          {!loading && ticketMessages.length === 0 && (
            <p className="text-gray-600">No messages yet</p>
          )}

          {!loading &&
            ticketMessages.map((msg) => (
              <div key={msg.id} className="border-b border-gray-200 pb-4 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-900">{msg.senderRole}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{msg.message}</p>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-green-600 hover:text-green-700"
                      >
                        <FileText className="w-4 h-4" />
                        {att.name || `Attachment ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Reply Form - only if open */}
        {selectedTicket.status !== 'CLOSED' && (
          <div className="bg-white border border-gray-100 rounded-lg p-8 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Reply</h3>
            <form onSubmit={handleAddReply} className="space-y-4">
              <div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving || !replyText.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {saving ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Close Ticket Button */}
        {selectedTicket.status !== 'CLOSED' && (
          <div className="flex gap-3">
            <button
              onClick={handleCloseTicket}
              disabled={saving}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Close Ticket
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return <div className="max-w-6xl mx-auto py-10">Loading...</div>;
};

export default SupportTickets;
