import React, { useState } from 'react';
import { processPayment } from '../../../../services/payment';

const PaymentModal = ({ order, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    {
      id: 'VNPAY',
      name: 'VnPay',
      description: 'Thanh toán qua VnPay (Thẻ ATM, Visa, MasterCard)',
      icon: '💳',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      id: 'CASH',
      name: 'Tiền mặt',
      description: 'Thanh toán bằng tiền mặt tại trạm',
      icon: '💵',
      color: 'bg-green-50 border-green-200 text-green-800'
    }
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('💳 Processing payment with method:', selectedMethod);
      console.log('📋 Transaction ID:', order.transactionId);

      // Call API: GET /api/payment/process?transactionId=xxx&method=VNPAY
      // Response: { message, data: "vnpay_url_string", timestamp }
      const paymentUrl = await processPayment({
        transactionId: order.transactionId,
        method: selectedMethod
      });

      if (selectedMethod === 'VNPAY') {
        // paymentUrl is the VNPay URL string from response.data
        if (paymentUrl && typeof paymentUrl === 'string') {
          console.log('🔗 Redirecting to VNPay:', paymentUrl);
          
          // Save transaction info to sessionStorage for return page
          sessionStorage.setItem('pendingPaymentTransaction', order.transactionId);
          sessionStorage.setItem('pendingPaymentOrderCode', order.code);
          
          // Redirect to VNPay payment page
          window.location.href = paymentUrl;
        } else {
          throw new Error('Không nhận được URL thanh toán từ VNPay');
        }
      } else if (selectedMethod === 'CASH') {
        // Cash payment returns payment ID
        console.log('✅ Cash payment processed:', paymentUrl);
        alert('Thanh toán bằng tiền mặt đã được ghi nhận. Vui lòng thanh toán tại trạm khi đến đổi pin.');
        onSuccess();
      }
    } catch (e) {
      console.error('❌ Payment error:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Đã xảy ra lỗi';
      setError('Không thể tạo thanh toán: ' + errorMessage);
      setLoading(false);
    }
    // Note: Don't set loading to false for VNPAY as we're redirecting
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Thanh toán đơn hàng</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-8 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4 text-lg">Thông tin đơn hàng</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mã đơn:</span>
              <span className="font-medium">#{order.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span className="font-medium text-green-600">Đã xác nhận</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-900">Tổng tiền:</span>
              <span className="text-lg font-bold text-[#0028b8]">{formatPrice(order.swapPrice)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-8">
          <h4 className="font-medium text-gray-900 mb-5 text-lg">Chọn phương thức thanh toán</h4>
          
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`block cursor-pointer border-2 rounded-lg p-5 transition-all ${
                  selectedMethod === method.id
                    ? 'border-[#0028b8] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3 w-full">
                    <div className="text-2xl">{method.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethod === method.id
                        ? 'border-[#0028b8] bg-[#0028b8]'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethod === method.id && (
                        <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Payment Info */}
          {selectedMethod === 'VNPAY' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Bạn sẽ được chuyển đến trang VnPay để hoàn tất thanh toán.
              </p>
            </div>
          )}

          {selectedMethod === 'CASH' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                💡 Vui lòng chuẩn bị tiền mặt và thanh toán khi đến trạm đổi pin.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 text-base"
            >
              Hủy
            </button>
            <button
              onClick={handlePayment}
              disabled={loading || !selectedMethod}
              className="flex-1 bg-[#0028b8] text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                `Thanh toán ${formatPrice(order.swapPrice)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;