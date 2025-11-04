import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { parseVNPayReturn } from '../../services/payment';
import API from '../../services/auth';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    const checkPayment = async () => {
      const result = parseVNPayReturn(searchParams);
      
      // Get saved transaction info from sessionStorage
      const transactionId = sessionStorage.getItem('pendingPaymentTransaction');
      const orderCode = sessionStorage.getItem('pendingPaymentOrderCode');
      
      if (transactionId) result.savedTransactionId = transactionId;
      if (orderCode) result.savedOrderCode = orderCode;
      
      console.log('📦 Payment Return - URL Params:', result);
      
      // Check if we have params from URL (VNPay redirect directly)
      if (result.responseCode) {
        console.log('✅ Has VNPay params from URL');
        setPaymentResult(result);
        
        if (result.success) {
          sessionStorage.removeItem('pendingPaymentTransaction');
          sessionStorage.removeItem('pendingPaymentOrderCode');
        }
      } 
      // No params - BE already processed via IPN, need to check DB
      else if (transactionId) {
        console.log('ℹ️ No params, checking payment status from API...');
        
        try {
          const response = await API.get(`/api/transactions/${transactionId}`);
          const transaction = response?.data?.data;
          
          console.log('📝 Transaction from API:', transaction);
          
          // Check if payment exists and is completed
          const hasCompletedPayment = transaction?.payments?.some(
            payment => payment.status === 'COMPLETED'
          );
          
          if (hasCompletedPayment) {
            console.log('✅ Payment COMPLETED in database');
            setPaymentResult({
              success: true,
              message: 'Thanh toán thành công',
              transactionId,
              savedTransactionId: transactionId,
              savedOrderCode: orderCode,
              amount: transaction.swapPrice?.amount || null
            });
            sessionStorage.removeItem('pendingPaymentTransaction');
            sessionStorage.removeItem('pendingPaymentOrderCode');
          } else {
            console.log('❌ Payment NOT completed in database');
            setPaymentResult({
              success: false,
              message: 'Thanh toán thất bại hoặc chưa hoàn tất',
              transactionId,
              savedTransactionId: transactionId,
              savedOrderCode: orderCode
            });
          }
        } catch (error) {
          console.error('❌ Error checking payment:', error);
          setPaymentResult({
            success: false,
            message: 'Không thể xác minh trạng thái thanh toán. Vui lòng kiểm tra lại đơn hàng.',
            error: error.message
          });
        }
      }
      // No params and no transactionId - something wrong
      else {
        console.log('⚠️ No params and no transactionId');
        setPaymentResult({
          success: false,
          message: 'Không tìm thấy thông tin thanh toán'
        });
      }
    };
    
    checkPayment();
  }, [searchParams]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Đang xử lý kết quả thanh toán...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full text-center">
        {paymentResult.success ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 mb-6">
              Đơn hàng của bạn đã được thanh toán thành công qua VNPay.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-600 mb-6">
              {paymentResult.message || 'Giao dịch không thành công. Vui lòng thử lại.'}
            </p>
          </>
        )}

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          {paymentResult.savedOrderCode && (
            <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Mã đơn hàng:</span>
              <span className="font-medium text-gray-800">#{paymentResult.savedOrderCode}</span>
            </div>
          )}
          
          {(paymentResult.transactionId || paymentResult.savedTransactionId) && (
            <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
              <span className="text-sm text-gray-600">Mã giao dịch:</span>
              <span className="font-mono text-xs text-gray-800 break-all">
                {paymentResult.transactionId || paymentResult.savedTransactionId}
              </span>
            </div>
          )}
          
          {paymentResult.amount && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-gray-600">Số tiền:</span>
              <span className="text-2xl font-bold text-blue-600">
                {paymentResult.amount.toLocaleString('vi-VN')} VND
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoToOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition font-medium"
          >
            Xem đơn hàng của tôi
          </button>
          <button
            onClick={handleGoHome}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-lg transition font-medium"
          >
            Về trang chủ
          </button>
        </div>

        {/* Additional Info */}
        {paymentResult.success && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Bạn có thể đến trạm để đổi pin theo lịch đã đặt. Vui lòng mang theo mã đơn hàng.
            </p>
          </div>
        )}
        
        {!paymentResult.success && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 Nếu bạn đã bị trừ tiền nhưng giao dịch thất bại, số tiền sẽ được hoàn lại trong 1-3 ngày làm việc.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}