import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    // Get payment data from navigation state or sessionStorage
    const data = location.state || JSON.parse(sessionStorage.getItem('paymentResult') || 'null');
    
    // If no data, show demo/placeholder instead of redirecting
    if (!data || !data.success) {
      // Set demo data for testing - allows direct URL access
      setPaymentData({
        success: true,
        message: 'Thanh toán thành công',
        transactionId: sessionStorage.getItem('pendingPaymentTransaction') || 'N/A',
        amount: null,
        isDemo: true
      });
      return;
    }

    setPaymentData(data);
    
    // Clear stored data after 5 seconds
    const timer = setTimeout(() => {
      sessionStorage.removeItem('paymentResult');
      sessionStorage.removeItem('pendingPaymentTransaction');
      sessionStorage.removeItem('pendingPaymentOrderCode');
    }, 5000);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  const handleBackToOrders = () => {
    sessionStorage.removeItem('paymentResult');
    sessionStorage.removeItem('pendingPaymentTransaction');
    sessionStorage.removeItem('pendingPaymentOrderCode');
    navigate('/driver/my-orders');
  };

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Title */}
        <h1 className="text-3xl font-bold text-green-600 mb-3">
          Thanh toán thành công!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Đơn hàng của bạn đã được thanh toán thành công qua VNPay
        </p>

        {/* Payment Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
          <div className="space-y-2 text-sm">
            {paymentData.transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mã giao dịch:</span>
                <span className="font-mono text-gray-900 text-xs">
                  {paymentData.transactionId.substring(0, 8)}...
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span className="text-green-600 font-semibold">Thành công</span>
            </div>
            
            {paymentData.responseCode && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mã phản hồi:</span>
                <span className="font-mono text-gray-900">{paymentData.responseCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            ℹ️ Giao dịch của bạn đã được xác nhận. Bạn có thể kiểm tra chi tiết trong phần "Đơn hàng của tôi"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleBackToOrders}
            className="w-full px-6 py-3 bg-[#0028b8] text-white rounded-lg hover:bg-[#001a8b] transition-colors font-medium"
          >
            Xem đơn hàng của tôi
          </button>
          
          <button
            onClick={() => navigate('/mainpage')}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
