import API from './auth';

/**
 * Check payment status by transaction ID
 * @param {string} transactionId - UUID of the swap transaction
 * @returns {Promise<Object>} Payment status result
 */
export async function checkPaymentStatus(transactionId) {
  try {
    // Since we don't have direct API, we'll use the stored result
    // This is a workaround until backend provides payment status API
    const res = await API.get(`/api/transactions/${transactionId}`);
    return res?.data?.data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
}

/**
 * Payment Processing APIs
 * Handles payment for battery swap transactions
 */

/**
 * Process payment for a swap transaction
 * Role: DRIVER or STAFF
 * @param {object} payload
 * @param {string} payload.transactionId - UUID of the swap transaction
 * @param {string} payload.method - Payment method: "VNPAY" or "CASH"
 * @returns {Promise<string>} For VNPAY: returns payment URL to redirect. For CASH: returns success message
 */
export async function processPayment({ transactionId, method }) {
  const res = await API.get('/api/payment/process', {
    params: {
      transactionId,
      method
    }
  });
  return res?.data?.data;
}

/**
 * Process payment with VNPay
 * @param {string} transactionId - UUID of the swap transaction
 * @returns {Promise<string>} VNPay payment URL
 */
export async function processVNPayPayment(transactionId) {
  const paymentUrl = await processPayment({
    transactionId,
    method: 'VNPAY'
  });
  return paymentUrl;
}

/**
 * Process cash payment
 * @param {string} transactionId - UUID of the swap transaction
 * @returns {Promise<string>} Success message
 */
export async function processCashPayment(transactionId) {
  const result = await processPayment({
    transactionId,
    method: 'CASH'
  });
  return result;
}

/**
 * Payment method options
 */
export const PaymentMethods = {
  VNPAY: 'VNPAY',
  CASH: 'CASH'
};

/**
 * Get payment method display text
 * @param {string} method - PaymentMethod enum value
 * @returns {string} Vietnamese display text
 */
export function getPaymentMethodText(method) {
  const methodMap = {
    VNPAY: 'VNPay',
    CASH: 'Tiền mặt'
  };
  return methodMap[method] || method;
}