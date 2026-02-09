/**
 * PaymentBreakdown Component
 * Displays the payment structure breakdown (70% on delivery, 30% later)
 * 
 * @param {Object} props
 * @param {number} props.discountedPrice - Discounted price in GHS
 */
const PaymentBreakdown = ({ discountedPrice }) => {
  // Calculate payment amounts
  const paymentOnDelivery = discountedPrice * 0.7
  const paymentLater = discountedPrice * 0.3

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Payment Structure
      </h3>
      
      <div className="space-y-4">
        <div className="bg-white rounded-md p-4 border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Payable on Delivery (70%)
            </span>
            <span className="text-xl font-bold text-blue-600">
              GHS {paymentOnDelivery.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            This amount is due when the laptop is delivered to you.
          </p>
        </div>

        <div className="bg-white rounded-md p-4 border border-blue-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Payable Later (30%)
            </span>
            <span className="text-xl font-bold text-blue-600">
              GHS {paymentLater.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            This amount can be paid at a later date as agreed.
          </p>
        </div>

        <div className="pt-4 border-t border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">
              Total Price
            </span>
            <span className="text-2xl font-bold text-gray-900">
              GHS {discountedPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> This flexible payment plan is designed to make laptops 
          more accessible to students. The 30% balance can be paid according to the 
          agreed schedule.
        </p>
      </div>
    </div>
  )
}

export default PaymentBreakdown
