import React from 'react';
import { CreditCard, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';

/**
 * PaymentDeliveryStatus Component
 * 
 * Displays read-only payment and delivery information for a student's application.
 * Shows:
 * - Laptop price
 * - 70% initial payment status
 * - 30% outstanding balance
 * - Payment due date
 * - Delivery status (Assigned/Out for delivery/Delivered)
 * - Delivery staff and date
 * 
 * All fields are read-only - students cannot manually edit payment/delivery data.
 */
const PaymentDeliveryStatus = ({ application }) => {
  if (!application) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Payment & Delivery Status
        </h2>
        <p className="text-gray-500 text-sm">No active application selected</p>
      </div>
    );
  }

  const { totalPrice, payments, delivery } = application;

  // Calculate payment amounts
  const initial70Amount = totalPrice * 0.7;
  const final30Amount = totalPrice * 0.3;

  // Get payment statuses
  const initial70Paid = payments?.initial70?.status === 'COLLECTED';
  const final30Paid = payments?.final30?.status === 'COLLECTED';
  const paymentDueDate = payments?.final30?.dueDate;

  // Determine delivery status
  const getDeliveryStatus = () => {
    if (!delivery) return 'Pending Assignment';
    if (delivery.delivered) return 'Delivered';
    if (delivery.deliveryDate) return 'Out for Delivery';
    return 'Assigned';
  };

  const deliveryStatus = getDeliveryStatus();

  // Status badge colors
  const getPaymentBadge = (paid) => {
    if (paid) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4" />
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-4 h-4" />
        Not Paid
      </span>
    );
  };

  const getDeliveryBadge = () => {
    const statusConfig = {
      'Delivered': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Out for Delivery': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Truck },
      'Assigned': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Clock },
      'Pending Assignment': { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle },
    };

    const config = statusConfig[deliveryStatus];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {deliveryStatus}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'GH₵ 0.00';
    }
    return `GH₵ ${Number(amount).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Payment & Delivery Status
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Read-only information about your payment and delivery
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Payment Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            Payment Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Price */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">Laptop Price</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrice)}</div>
            </div>

            {/* 70% Payment */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Initial Payment (70%)</div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-blue-900">{formatCurrency(initial70Amount)}</div>
                {getPaymentBadge(initial70Paid)}
              </div>
              {initial70Paid && payments?.initial70?.collectedAt && (
                <div className="text-xs text-gray-600 mt-2">
                  Collected on {formatDate(payments.initial70.collectedAt)}
                </div>
              )}
            </div>

            {/* 30% Outstanding */}
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Outstanding Balance (30%)</div>
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-amber-900">{formatCurrency(final30Amount)}</div>
                {getPaymentBadge(final30Paid)}
              </div>
              {final30Paid && payments?.final30?.collectedAt && (
                <div className="text-xs text-gray-600 mt-2">
                  Collected on {formatDate(payments.final30.collectedAt)}
                </div>
              )}
            </div>

            {/* Payment Due Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">Payment Due Date</div>
              <div className="text-lg font-semibold text-gray-900">
                {paymentDueDate ? formatDate(paymentDueDate) : '—'}
              </div>
              {paymentDueDate && !final30Paid && (
                <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Payment pending
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-gray-600" />
            Delivery Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Delivery Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Delivery Status</div>
              <div>{getDeliveryBadge()}</div>
            </div>

            {/* Delivery Staff */}
            {delivery?.staffName && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">Delivery Staff</div>
                <div className="text-lg font-semibold text-gray-900">{delivery.staffName}</div>
              </div>
            )}

            {/* Delivery Date */}
            {delivery?.deliveryDate && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {delivery.delivered ? 'Delivered On' : 'Scheduled For'}
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatDate(delivery.deliveryDate)}
                </div>
              </div>
            )}

            {/* Delivery Location */}
            {delivery?.location && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">Delivery Location</div>
                <div className="text-sm text-gray-900">{delivery.location}</div>
              </div>
            )}
          </div>

          {/* No delivery assigned message */}
          {!delivery && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Delivery has not been assigned yet. You will be notified once your application is approved and a delivery is scheduled.
              </p>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Important Information</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Payment and delivery information is managed by administrators</li>
                <li>You cannot manually edit these details</li>
                <li>Contact support if you notice any discrepancies</li>
                <li>All payments must be verified before delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDeliveryStatus;
