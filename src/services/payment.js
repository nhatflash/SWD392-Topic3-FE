import API from './auth';

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

/**
 * Parse VNPay return parameters from URL
 * Used on the return page after VNPay redirect
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Parsed payment result
 */
export function parseVNPayReturn(searchParams) {
  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionId = searchParams.get('vnp_TxnRef');
  const amount = searchParams.get('vnp_Amount');
  
  return {
    success: responseCode === '00',
    responseCode,
    transactionId,
    amount: amount ? parseInt(amount) / 100 : null, // VNPay returns amount in cents
    message: responseCode === '00' ? 'Thanh toán thành công' : 'Thanh toán thất bại'
  };
}
