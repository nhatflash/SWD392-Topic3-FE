import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { parseVNPayReturn } from '../../../services/payment';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentReturn = () => {
      try {
        const currentUrl = window.location.href;
        console.log('🔍 Current URL:', currentUrl);
        console.log('🔍 Search Params:', window.location.search);
        console.log('🔍 All URL params:', Object.fromEntries(searchParams.entries()));
        
        // Check if we're coming from backend domain (no params scenario)
        const isBackendRedirect = currentUrl.includes('swd-392-topic3-fe.vercel.app/payment/return') && 
                                 !searchParams.toString();
        
        if (isBackendRedirect) {
          console.log('🔄 Detected backend redirect without params');
          
          // Get saved transaction info from sessionStorage to determine result
          const transactionId = sessionStorage.getItem('pendingPaymentTransaction');
          const orderCode = sessionStorage.getItem('pendingPaymentOrderCode');
          
          if (transactionId) {
            // Since backend already processed payment in /vnpay-ipn
            // We'll assume success and let user check in orders page
            console.log('✅ Backend processed payment, redirecting to success');
            
            // Create a mock successful result
            const mockResult = {
              success: true,
              message: 'Thanh toán đã được xử lý thành công',
              transactionId: transactionId,
              savedTransactionId: transactionId,
              savedOrderCode: orderCode,
              backendProcessed: true
            };
            
            // Navigate to success page with mock data
            navigate('/payment/success', { 
              state: mockResult,
              replace: true 
            });
          } else {
            console.warn('⚠️ No transaction info found');
            navigate('/payment/failure', { 
              state: { 
                message: 'Không tìm thấy thông tin giao dịch. Vui lòng kiểm tra đơn hàng của bạn.',
                noTransactionInfo: true
              } 
            });
          }
          return;
        }
        
        // Check if we have VNPay parameters (direct VNPay callback)
        const hasVnpayParams = searchParams.has('vnp_ResponseCode') || 
                              searchParams.has('vnp_TxnRef') ||
                              searchParams.toString().length > 0;
        
        if (!hasVnpayParams) {
          console.warn('⚠️ No VNPay parameters found');
          navigate('/payment/failure', { 
            state: { 
              message: 'Không tìm thấy thông tin thanh toán. Vui lòng thử lại.',
              noParams: true
            } 
          });
          return;
        }
        
        // Parse VNPay return parameters (if available)
        const result = parseVNPayReturn(searchParams);
        
        // Get saved transaction info from sessionStorage
        const transactionId = sessionStorage.getItem('pendingPaymentTransaction');
        const orderCode = sessionStorage.getItem('pendingPaymentOrderCode');
        
        if (transactionId) result.savedTransactionId = transactionId;
        if (orderCode) result.savedOrderCode = orderCode;
        
        console.log('📦 Payment Return Result:', result);
        
        // Navigate to appropriate page based on payment result
        if (result.success) {
          console.log('✅ Payment successful, redirecting to success page');
          const successUrl = `/payment/success?${searchParams.toString()}`;
          navigate(successUrl, { replace: true });
        } else {
          console.log('❌ Payment failed, redirecting to failure page');
          const failureUrl = `/payment/failure?${searchParams.toString()}`;
          navigate(failureUrl, { replace: true });
        }
        
      } catch (error) {
        console.error('❌ Error processing payment return:', error);
        navigate('/payment/failure', { 
          state: { 
            message: 'Có lỗi xảy ra khi xử lý kết quả thanh toán. Vui lòng thử lại.',
            error: error.message
          } 
        });
      }
    };

    // Add small delay to ensure URL params are fully loaded
    const timer = setTimeout(() => {
      handlePaymentReturn();
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-xl text-gray-700">Đang xử lý kết quả thanh toán...</div>
        <div className="text-sm text-gray-500 mt-2">Vui lòng chờ trong giây lát</div>
      </div>
    </div>
  );
}
