import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const mockQueue = [
  {
    ref: 'APP-2024-0021',
    studentName: 'Kojo Mensah',
    university: 'University of Ghana',
    laptop: 'HP ProBook 450',
    address: 'Legon Hall, Block B',
    phone: '+233 24 123 4567',
    status: 'Awaiting pickup',
    delivered: false,
    paymentCollected: false,
    receiptRef: '',
  },
  {
    ref: 'APP-2024-0022',
    studentName: 'Abena Owusu',
    university: 'University of Cape Coast',
    laptop: 'Lenovo ThinkPad E14',
    address: 'SRC Office, Main Campus',
    phone: '+233 20 987 6543',
    status: 'Ready for delivery',
    delivered: false,
    paymentCollected: false,
    receiptRef: '',
  },
]

export default function DeliveryQueue() {
  const [queue, setQueue] = useState(mockQueue)
  const { getAccessToken, authFetch } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [activeRef, setActiveRef] = useState(null)
  const [receiptRef, setReceiptRef] = useState('')
  const [paymentChecked, setPaymentChecked] = useState(false)
  const [error, setError] = useState('')

  const openConfirmModal = (ref) => {
    setActiveRef(ref)
    setReceiptRef('')
    setPaymentChecked(false)
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setActiveRef(null)
    setReceiptRef('')
    setPaymentChecked(false)
    setError('')
  }

  const confirmDelivered = async () => {
    if (!receiptRef.trim() || !paymentChecked) return
    try {
      const response = await (authFetch 
        ? authFetch('/api/delivery/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ref: activeRef, receiptRef: receiptRef.trim(), paymentCollected: true }),
          })
        : fetch('/api/delivery/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAccessToken()}`,
            },
            body: JSON.stringify({ ref: activeRef, receiptRef: receiptRef.trim(), paymentCollected: true }),
          })
      )
      
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to confirm delivery')
        return
      }

      // Update local UI state
      setQueue(prev => prev.map(item => {
        if (item.ref === activeRef) {
          return {
            ...item,
            delivered: true,
            paymentCollected: true,
            receiptRef: receiptRef.trim(),
            status: 'Delivered',
          }
        }
        return item
      }))

      // Persist for Admin view (temporary until backend wiring in Admin)
      try {
        const key = 'delivery_confirmations'
        const raw = localStorage.getItem(key)
        const arr = raw ? JSON.parse(raw) : []
        arr.push({
          ref: activeRef,
          receiptRef: receiptRef.trim(),
          paymentCollected: true,
          delivered: true,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(key, JSON.stringify(arr))
      } catch (e) {
        console.warn('Failed to persist delivery confirmation:', e)
      }

      closeModal()
    } catch (err) {
      setError(err.message || 'Failed to confirm delivery')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Delivery Queue</h1>
        <p className="text-gray-600">
          Deliver laptops assigned to you. Update status as you complete each drop-off.
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-gray-700 font-semibold mb-2">No deliveries assigned</p>
          <p className="text-gray-500">You have no pending deliveries right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div key={item.ref} className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Ref: {item.ref}</p>
                <p className="text-lg font-semibold text-gray-900">{item.studentName}</p>
                <p className="text-sm text-gray-600">{item.university}</p>
                <p className="text-sm text-gray-600">Laptop: {item.laptop}</p>
                <p className="text-sm text-gray-600">Address: {item.address}</p>
                <p className="text-sm text-gray-600">Phone: {item.phone}</p>
                {item.delivered && item.receiptRef && (
                  <p className="text-sm text-gray-600">Receipt: <span className="font-medium">{item.receiptRef}</span></p>
                )}
              </div>
              <div className="mt-4 md:mt-0 flex items-center gap-3">
                <span className="text-sm font-semibold text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full">
                  {item.status}
                </span>
                {item.delivered ? (
                  <span className="px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-md">Locked</span>
                ) : (
                  <button
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md"
                    onClick={() => openConfirmModal(item.ref)}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Confirm Delivery</h2>
              <p className="text-sm text-gray-600">Provide receipt reference and confirm 70% payment collected.</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Receipt Reference</label>
                <input
                  type="text"
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., RECEIPT-UG-2024-00021"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={paymentChecked}
                  onChange={(e) => setPaymentChecked(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                Confirm 70% payment collected
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-semibold text-white ${receiptRef.trim() && paymentChecked ? 'bg-green-600 hover:bg-green-700' : 'bg-green-300 cursor-not-allowed'}`}
                disabled={!receiptRef.trim() || !paymentChecked}
                onClick={confirmDelivered}
              >
                Confirm Delivered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
