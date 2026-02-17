/**
 * usePayment Hook
 * Manages payment initialization and verification API calls
 * 
 * Usage:
 * const { initializing, initiatePayment } = usePayment();
 * await initiatePayment(applicationId);
 */

import { useState } from 'react';

export const usePayment = () => {
  const [initializing, setInitializing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  /**
   * Initialize payment for an application
   * @param {string} applicationId - Application ID to pay for
   * @returns {Promise<{success: boolean, authorizationUrl?: string}>}
   */
  const initiatePayment = async (applicationId) => {
    setInitializing(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ applicationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to initialize payment';
        setError({
          message: errorMessage,
          code: result.code,
          status: response.status,
          ...result,
        });
        return { success: false, error: errorMessage };
      }

      setPaymentData(result.data);

      // Redirect to Paystack hosted page
      if (result.data.authorizationUrl) {
        window.location.href = result.data.authorizationUrl;
      }

      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err.message || 'Payment initialization failed. Please try again.';
      setError({
        message: errorMessage,
        code: 'NETWORK_ERROR',
        original: err,
      });
      return { success: false, error: errorMessage };
    } finally {
      setInitializing(false);
    }
  };

  /**
   * Verify payment after Paystack redirect
   * @param {string} reference - Payment reference from Paystack
   * @returns {Promise<{success: boolean, verified?: boolean}>}
   */
  const verifyPayment = async (reference) => {
    setVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reference }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to verify payment';
        setError({
          message: errorMessage,
          code: result.code,
          status: response.status,
          ...result,
        });
        return { success: false, error: errorMessage };
      }

      setPaymentData(result.payment);
      return { success: true, verified: result.verified, payment: result.payment };
    } catch (err) {
      const errorMessage = err.message || 'Payment verification failed. Please try again.';
      setError({
        message: errorMessage,
        code: 'NETWORK_ERROR',
        original: err,
      });
      return { success: false, error: errorMessage };
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Get payment status
   * @param {string} reference - Payment reference
   * @returns {Promise<{success: boolean, data?: object}>}
   */
  const getPaymentStatus = async (reference) => {
    try {
      const response = await fetch(`/api/payments/status/${reference}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const clearError = () => setError(null);
  const clearPaymentData = () => setPaymentData(null);

  return {
    initializing,
    verifying,
    error,
    paymentData,
    initiatePayment,
    verifyPayment,
    getPaymentStatus,
    clearError,
    clearPaymentData,
  };
};

export default usePayment;
