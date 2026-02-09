import { useState } from 'react'

/**
 * PaymentModal Component
 * Modal for student to pay the 30% balance via Paystack
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback when modal closes
 * @param {Object} paymentData - Payment info (applicationRef, amount, dueDate)
 * @param {function} onSuccess - Callback on successful payment
 */
export default function PaymentModal({ isOpen, onClose, paymentData }) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !paymentData) return null

  const handlePaystackClick = async () => {
    setError('')
    setProcessing(true)

    try {
      // TODO: Integrate Paystack SDK
      // For now, show a placeholder alert
      alert(
        `Paystack integration pending.\n\n` +
        `Application: ${paymentData.applicationRef}\n` +
        `Amount: GHS ${paymentData.outstandingAmount?.toFixed(2)}\n` +
        `Due: ${new Date(paymentData.dueDate).toLocaleDateString()}\n\n` +
        `Contact admin@example.com to complete payment or enable Paystack.`
      )

      setProcessing(false)
      onClose()
    } catch (err) {
      setError(err.message || 'Payment processing failed')
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Pay 30% Balance</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={processing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">Application Reference</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{paymentData.applicationRef}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Amount Due</label>
                <p className="text-lg font-bold text-green-600 mt-1">GHS {paymentData.outstandingAmount?.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Due Date</label>
                <p className="text-sm text-gray-900 mt-1">{new Date(paymentData.dueDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-md p-3">
              <p className="text-xs text-blue-700">
                This is the final 30% payment for your laptop. Once paid, your delivery will be confirmed.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handlePaystackClick}
              disabled={processing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60 font-medium"
            >
              {processing ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
