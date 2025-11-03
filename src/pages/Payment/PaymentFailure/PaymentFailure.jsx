import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { parseVNPayReturn } from '../../../services/payment';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    // Parse VNPay return parameters or get from navigation state
    const navigationState = location.state;
    
    let result;
    
    if (navigationState && navigationState.noParams) {
      // Case: No parameters from VNPay, came directly
      result = {
        success: false,
        message: navigationState.message || 'Không tìm thấy thông tin thanh toán.',
        responseCode: null,
        transactionStatus: null,
        transactionId: null,
        amount: null
      };
    } else if (navigationState && navigationState.error) {
      // Case: Error during processing
      result = {
        success: false,
        message: navigationState.message || 'Có lỗi xảy ra khi xử lý thanh toán.',
        error: navigationState.error,
        responseCode: null,
        transactionStatus: null,
        transactionId: null,
        amount: null
      };
    } else {
      // Case: Normal VNPay return with parameters
      result = parseVNPayReturn(searchParams);
    }
    
    // Get saved transaction info from sessionStorage
    const transactionId = sessionStorage.getItem('pendingPaymentTransaction');
    const orderCode = sessionStorage.getItem('pendingPaymentOrderCode');
    
    if (transactionId) result.savedTransactionId = transactionId;
    if (orderCode) result.savedOrderCode = orderCode;
    
    console.log('❌ Payment Failure - Parsed result:', result);
    
    setPaymentResult(result);
  }, [searchParams, location.state]);

  const handleRetryPayment = () => {
    // Navigate back to booking or payment page to retry
    if (paymentResult.savedTransactionId) {
      navigate('/driver/book-swap', { 
        state: { retryTransactionId: paymentResult.savedTransactionId } 
      });
    } else {
      navigate('/driver/book-swap');
    }
  };

  const handleGoToOrders = () => {
    navigate('/driver/my-orders');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleContactSupport = () => {
    // Navigate to support page or open support chat
    navigate('/support', { 
      state: { 
        issue: 'payment_failed',
        transactionId: paymentResult.savedTransactionId,
        orderCode: paymentResult.savedOrderCode 
      } 
    });
  };

  if (!paymentResult) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Đang xử lý kết quả thanh toán...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-center border border-red-100">
        {/* Failure Icon */}
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Failure Title */}
        <h1 className="text-4xl font-bold text-red-600 mb-4">
          😞 Thanh toán thất bại
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          {paymentResult.message || 'Giao dịch không thành công. Vui lòng thử lại.'}
        </p>

        {/* Payment Details */}
        <div className="bg-red-50 rounded-xl p-6 mb-8 text-left border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-4 text-center">
            📋 Chi tiết giao dịch
          </h3>
          
          {paymentResult.savedOrderCode && (
            <div className="flex justify-between mb-4 pb-3 border-b border-red-200">
              <span className="text-sm text-gray-600 font-medium">Mã đơn hàng:</span>
              <span className="font-bold text-red-800 text-lg">#{paymentResult.savedOrderCode}</span>
            </div>
          )}
          
          {(paymentResult.transactionId || paymentResult.savedTransactionId) && (
            <div className="flex justify-between mb-4 pb-3 border-b border-red-200">
              <span className="text-sm text-gray-600 font-medium">Mã giao dịch:</span>
              <span className="font-mono text-xs text-red-800 break-all bg-red-100 px-2 py-1 rounded">
                {paymentResult.transactionId || paymentResult.savedTransactionId}
              </span>
            </div>
          )}

          {paymentResult.txnRef && (
            <div className="flex justify-between mb-4 pb-3 border-b border-red-200">
              <span className="text-sm text-gray-600 font-medium">Mã tham chiếu VNPay:</span>
              <span className="font-mono text-xs text-red-800 break-all bg-red-100 px-2 py-1 rounded">
                {paymentResult.txnRef}
              </span>
            </div>
          )}

          {paymentResult.bankTranNo && (
            <div className="flex justify-between mb-4 pb-3 border-b border-red-200">
              <span className="text-sm text-gray-600 font-medium">Mã GD ngân hàng:</span>
              <span className="font-medium text-red-800">
                {paymentResult.bankTranNo}
              </span>
            </div>
          )}
          
          {paymentResult.amount && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-gray-600 font-medium">Số tiền giao dịch:</span>
              <span className="text-2xl font-bold text-red-600">
                {paymentResult.amount.toLocaleString('vi-VN')} VND
              </span>
            </div>
          )}

          {paymentResult.responseCode && (
            <div className="flex justify-between items-center pt-3 border-t border-red-200 mt-3">
              <span className="text-sm text-gray-600 font-medium">Mã lỗi:</span>
              <span className="text-sm text-red-800 font-bold bg-red-100 px-2 py-1 rounded">
                {paymentResult.responseCode}
              </span>
            </div>
          )}

          {paymentResult.bankCode && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-gray-600 font-medium">Ngân hàng:</span>
              <span className="text-sm text-red-800 font-medium uppercase">
                {paymentResult.bankCode}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={handleRetryPayment}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🔄 Thử lại thanh toán
          </button>
          <button
            onClick={handleGoToOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            📋 Xem đơn hàng
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={handleContactSupport}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🎧 Liên hệ hỗ trợ
          </button>
          <button
            onClick={handleGoHome}
            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🏠 Về trang chủ
          </button>
        </div>

        {/* Failure Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-4">
          <div className="flex items-start space-x-3">
            <div className="bg-yellow-100 rounded-full p-2 mt-1">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-yellow-800 mb-2">💰 Về việc hoàn tiền</h4>
              <p className="text-sm text-yellow-700 leading-relaxed">
                Nếu bạn đã bị trừ tiền nhưng giao dịch thất bại, số tiền sẽ được <strong>hoàn lại tự động</strong> trong <strong>1-3 ngày làm việc</strong>. Vui lòng kiểm tra tài khoản ngân hàng của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="text-left">
            <h4 className="font-semibold text-blue-800 mb-3 text-center">🛠️ Gợi ý khắc phục</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span>Kiểm tra số dư tài khoản ngân hàng</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span>Đảm bảo thẻ/tài khoản đã kích hoạt thanh toán online</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span>Thử lại với thẻ/tài khoản khác</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600">•</span>
                <span>Liên hệ ngân hàng nếu vấn đề tiếp tục xảy ra</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}