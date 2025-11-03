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

/**
 * Parse VNPay return parameters from URL
 * Used on the return page after VNPay redirect from backend
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Parsed payment result
 */
export function parseVNPayReturn(searchParams) {
  // Debug: log all available params
  console.log('🔍 All available searchParams:', Array.from(searchParams.entries()));
  
  // Extract VNPay parameters based on VNPay documentation
  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionStatus = searchParams.get('vnp_TransactionStatus'); 
  const txnRef = searchParams.get('vnp_TxnRef');
  const amount = searchParams.get('vnp_Amount');
  const bankCode = searchParams.get('vnp_BankCode');
  const payDate = searchParams.get('vnp_PayDate');
  const bankTranNo = searchParams.get('vnp_BankTranNo');
  const transactionNo = searchParams.get('vnp_TransactionNo');
  const orderInfo = searchParams.get('vnp_OrderInfo');
  const cardType = searchParams.get('vnp_CardType');
  const tmnCode = searchParams.get('vnp_TmnCode');
  const secureHash = searchParams.get('vnp_SecureHash');
  
  console.log('🔍 Parsing VNPay return params:', {
    responseCode,
    transactionStatus, 
    txnRef,
    amount,
    bankCode,
    payDate,
    bankTranNo,
    transactionNo
  });
  
  // Parse transaction ID from vnp_TxnRef (backend format: uuid-timestamp)
  let transactionId = null;
  if (txnRef) {
    // Backend VnPayService creates: transaction.getId() + "-" + System.currentTimeMillis()
    // So format is: uuid-timestamp, extract first 36 chars for UUID
    if (txnRef.length >= 36) {
      transactionId = txnRef.substring(0, 36);
    }
  }
  
  // Parse payment date
  let formattedPayDate = null;
  if (payDate && payDate.length === 14) {
    // Format: yyyyMMddHHmmss -> dd/MM/yyyy HH:mm:ss
    const year = payDate.substring(0, 4);
    const month = payDate.substring(4, 6);
    const day = payDate.substring(6, 8);
    const hour = payDate.substring(8, 10);
    const minute = payDate.substring(10, 12);
    const second = payDate.substring(12, 14);
    formattedPayDate = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }
  
  // Check success condition
  const isSuccess = responseCode === '00';
  
  // Parse amount (VNPay returns in VND cents, so divide by 100)
  const parsedAmount = amount ? parseInt(amount) / 100 : null;
  
  return {
    success: isSuccess,
    responseCode,
    transactionStatus,
    transactionId, // Extracted UUID from vnp_TxnRef
    txnRef, // Full vnp_TxnRef for reference
    amount: parsedAmount,
    bankCode,
    payDate: formattedPayDate,
    rawPayDate: payDate,
    bankTranNo,
    transactionNo,
    orderInfo,
    cardType,
    tmnCode,
    secureHash,
    message: isSuccess ? 'Thanh toán thành công' : getVNPayErrorMessage(responseCode)
  };
}

/**
 * Get Vietnamese error message for VNPay response codes
 * @param {string} responseCode - VNPay response code
 * @returns {string} Vietnamese error message
 */
function getVNPayErrorMessage(responseCode) {
  const errorMessages = {
    '01': 'Giao dịch chưa hoàn tất',
    '02': 'Giao dịch bị lỗi',
    '04': 'Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)',
    '05': 'VNPAY đang xử lý giao dịch này (GD có thể thành công hoặc thất bại)',
    '06': 'VNPAY đã gửi yêu cầu truy vấn sang Ngân hàng (GD có thể thành công hoặc thất bại)',
    '07': 'Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng thanh toán đang bảo trì',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
    '99': 'Các lỗi khác (lỗi không xác định)'
  };
  
  return errorMessages[responseCode] || 'Giao dịch không thành công. Vui lòng thử lại.';
}
