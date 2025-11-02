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
  const responseCode = searchParams.get('vnp_ResponseCode') || searchParams.get('status');
  const transactionStatus = searchParams.get('vnp_TransactionStatus') || searchParams.get('txnStatus');
  const transactionId = searchParams.get('vnp_TxnRef') || searchParams.get('ref');
  const amount = searchParams.get('vnp_Amount') || searchParams.get('amount');
  const bankCode = searchParams.get('vnp_BankCode') || searchParams.get('bankCode');
  const payDate = searchParams.get('vnp_PayDate') || searchParams.get('payDate');
  const bankTranNo = searchParams.get('vnp_BankTranNo');
  const transactionNo = searchParams.get('vnp_TransactionNo');
  
  console.log('🔍 Parsing VNPay return params:', {
    responseCode,
    transactionStatus, 
    transactionId,
    amount,
    bankCode,
    payDate
  });
  
  const isSuccess = responseCode === '00' && transactionStatus === '00';
  
  return {
    success: isSuccess,
    responseCode,
    transactionStatus,
    transactionId,
    amount: amount ? parseInt(amount) / 100 : null, // VNPay returns amount in cents
    bankCode,
    payDate,
    bankTranNo,
    transactionNo,
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
