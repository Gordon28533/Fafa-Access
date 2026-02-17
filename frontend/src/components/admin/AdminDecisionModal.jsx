import React, { useState, useEffect, useRef } from 'react';

const AdminDecisionModal = ({
  isOpen,
  application,
  onClose,
  onApprove,
  onReject,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // 'APPROVE' | 'REJECT'
  const textareaRef = useRef(null);

  // Reset state when modal opens/closes or application changes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setConfirmAction(null);
      // Focus the first actionable element for accessibility
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 0);
    }
  }, [isOpen, application]);

  // Keyboard accessibility: close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !application) return null;

  const handleApprove = () => {
    if (confirmAction !== 'APPROVE') {
      setConfirmAction('APPROVE');
      return;
    }
    onApprove(application);
    onClose();
  };

  const handleReject = () => {
    if (!reason.trim()) {
      setError('Rejection reason is required.');
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }
    if (confirmAction !== 'REJECT') {
      setConfirmAction('REJECT');
      return;
    }
    onReject(application, reason.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-decision-modal-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <h3
          id="admin-decision-modal-title"
          className="text-lg font-semibold text-gray-900 mb-4"
        >
          Admin Decision
        </h3>
        <div className="mb-4 text-sm text-gray-700 space-y-1">
          <div>
            <span className="font-medium">Reference:</span> {application.ref}
          </div>
          <div>
            <span className="font-medium">Student:</span> {application.studentName}
          </div>
          <div>
            <span className="font-medium">University:</span> {application.university}
          </div>
          <div>
            <span className="font-medium">Laptop:</span> {application.laptop}
          </div>
          <div>
            <span className="font-medium">SRC Approved:</span> {application.srcApprovedDate}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={handleApprove}
            type="button"
          >
            {confirmAction === 'APPROVE' ? 'Click again to confirm approve' : 'Approve'}
          </button>
          <textarea
            ref={textareaRef}
            className="border border-gray-300 rounded p-2 mt-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Reason for rejection (required)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            aria-label="Rejection reason"
          />
          {error && (
            <div className="text-red-600 text-xs mb-1" role="alert">
              {error}
            </div>
          )}
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={handleReject}
            type="button"
          >
            {confirmAction === 'REJECT' ? 'Click again to confirm reject' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDecisionModal;