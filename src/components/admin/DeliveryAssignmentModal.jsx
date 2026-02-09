import React, { useState, useEffect, useRef } from 'react';

const DeliveryAssignmentModal = ({
  isOpen,
  application,
  onClose,
  onAssignDelivery,
}) => {
  const [staffName, setStaffName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const staffInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStaffName('');
      setDeliveryDate('');
      setLocation('');
      setError('');
      setTimeout(() => {
        if (staffInputRef.current) staffInputRef.current.focus();
      }, 0);
    }
  }, [isOpen, application]);

  if (!isOpen || !application) return null;

  const handleAssign = () => {
    if (!staffName.trim() || !deliveryDate || !location.trim()) {
      setError('All fields are required for assignment.');
      return;
    }
    const deliveryData = {
      staffName: staffName.trim(),
      deliveryDate,
      location: location.trim()
    };
    onAssignDelivery(application, deliveryData);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-assignment-modal-title"
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
          id="delivery-assignment-modal-title"
          className="text-lg font-semibold text-gray-900 mb-4"
        >
          Delivery Assignment
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
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Delivery Staff Name
          </label>
          <input
            ref={staffInputRef}
            type="text"
            className="w-full border rounded p-2 mb-2"
            value={staffName}
            onChange={e => setStaffName(e.target.value)}
          />
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Delivery Date
          </label>
          <input
            type="date"
            className="w-full border rounded p-2 mb-2"
            value={deliveryDate}
            onChange={e => setDeliveryDate(e.target.value)}
          />
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Delivery Location
          </label>
          <input
            type="text"
            className="w-full border rounded p-2 mb-2"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mt-2"
            onClick={handleAssign}
            type="button"
          >
            Assign Delivery
          </button>
        </div>
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-600">
            Note: Admin assigns delivery only. Delivery staff will confirm delivery and payment on their dashboard.
          </p>
        </div>
        {error && (
          <div className="text-red-600 text-xs mt-2" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryAssignmentModal;