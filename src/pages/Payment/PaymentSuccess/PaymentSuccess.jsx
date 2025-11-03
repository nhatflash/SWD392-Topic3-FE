import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { parseVNPayReturn } from '../../../services/payment';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    // Check if we have data from navigation state (backend processed case)
    const navigationState = location.state;
    
    let result;
    
    if (navigationState && navigationState.backendProcessed) {
      // Case: Backend already processed payment, no VNPay params available
      result = navigationState;
      console.log('💚 Payment Success - From backend processing:', result);
    } else {
      // Case: Normal VNPay return with parameters
      result = parseVNPayReturn(searchParams);
      
      // Get saved transaction info from sessionStorage
      const transactionId = sessionStorage.getItem('pendingPaymentTransaction');
      const orderCode = sessionStorage.getItem('pendingPaymentOrderCode');
      
      if (transactionId) result.savedTransactionId = transactionId;
      if (orderCode) result.savedOrderCode = orderCode;
      
      console.log('💚 Payment Success - From VNPay params:', result);
    }
    
    setPaymentResult(result);
    
    // Clear sessionStorage after successful payment
    sessionStorage.removeItem('pendingPaymentTransaction');
    sessionStorage.removeItem('pendingPaymentOrderCode');
  }, [searchParams, location.state]);

  const handleGoToOrders = () => {
    navigate('/driver/my-orders');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (!paymentResult) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Đang xử lý kết quả thanh toán...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-center border border-green-100">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Title */}
        <h1 className="text-4xl font-bold text-green-600 mb-4">
          🎉 Thanh toán thành công!
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Đơn hàng của bạn đã được thanh toán thành công qua VNPay.
        </p>

        {/* Payment Details */}
        <div className="bg-green-50 rounded-xl p-6 mb-8 text-left border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4 text-center">
            📋 Chi tiết thanh toán
          </h3>
          
          {paymentResult.savedOrderCode && (
            <div className="flex justify-between mb-4 pb-3 border-b border-green-200">
              <span className="text-sm text-gray-600 font-medium">Mã đơn hàng:</span>
              <span className="font-bold text-green-800 text-lg">#{paymentResult.savedOrderCode}</span>
            </div>
          )}
          
          {(paymentResult.transactionId || paymentResult.savedTransactionId) && (
            <div className="flex justify-between mb-4 pb-3 border-b border-green-200">
              <span className="text-sm text-gray-600 font-medium">Mã giao dịch:</span>
              <span className="font-mono text-xs text-green-800 break-all bg-green-100 px-2 py-1 rounded">
                {paymentResult.transactionId || paymentResult.savedTransactionId}
              </span>
            </div>
          )}

          {paymentResult.txnRef && (
            <div className="flex justify-between mb-4 pb-3 border-b border-green-200">
              <span className="text-sm text-gray-600 font-medium">Mã tham chiếu VNPay:</span>
              <span className="font-mono text-xs text-green-800 break-all bg-green-100 px-2 py-1 rounded">
                {paymentResult.txnRef}
              </span>
            </div>
          )}

          {paymentResult.bankTranNo && (
            <div className="flex justify-between mb-4 pb-3 border-b border-green-200">
              <span className="text-sm text-gray-600 font-medium">Mã GD ngân hàng:</span>
              <span className="font-medium text-green-800">
                {paymentResult.bankTranNo}
              </span>
            </div>
          )}
          
          {paymentResult.amount && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-gray-600 font-medium">Số tiền đã thanh toán:</span>
              <span className="text-3xl font-bold text-green-600">
                {paymentResult.amount.toLocaleString('vi-VN')} VND
              </span>
            </div>
          )}

          {paymentResult.payDate && (
            <div className="flex justify-between items-center pt-3 border-t border-green-200 mt-3">
              <span className="text-sm text-gray-600 font-medium">Thời gian thanh toán:</span>
              <span className="text-sm text-green-800 font-medium">
                {paymentResult.payDate}
              </span>
            </div>
          )}

          {paymentResult.bankCode && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-gray-600 font-medium">Ngân hàng:</span>
              <span className="text-sm text-green-800 font-medium uppercase">
                {paymentResult.bankCode}
              </span>
            </div>
          )}

          {paymentResult.backendProcessed && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-800 font-medium">
                  Thanh toán đã được xử lý thành công bởi hệ thống
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button
            onClick={handleGoToOrders}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            📋 Xem đơn hàng của tôi
          </button>
          <button
            onClick={handleGoHome}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl transition font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🏠 Về trang chủ
          </button>
        </div>

        {/* Success Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-2 mt-1">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-blue-800 mb-2">🔋 Bước tiếp theo</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                {paymentResult.backendProcessed ? (
                  <>
                    Thanh toán của bạn đã được xử lý thành công. Bạn có thể kiểm tra chi tiết trong phần{' '}
                    <strong>"Đơn hàng của tôi"</strong> và đến trạm để đổi pin theo lịch đã đặt.
                  </>
                ) : (
                  <>
                    Bạn có thể đến trạm để đổi pin theo lịch đã đặt. Vui lòng mang theo <strong>mã đơn hàng</strong> và <strong>giấy tờ tùy thân</strong> để xác nhận.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Celebration Animation */}
        <div className="mt-6 text-4xl animate-bounce">
          🎊🎉🎊
        </div>
      </div>
    </div>
  );
}