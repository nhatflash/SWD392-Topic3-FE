import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleReturn = async () => {
      try {
        console.log('🚀 NEW PaymentReturn.jsx loaded - v2');
        
        // Get VNPay response code from URL
        const responseCode = searchParams.get('vnp_ResponseCode');
        const txnRef = searchParams.get('vnp_TxnRef');
        
        console.log('🔍 VNPay Return:', { 
          responseCode, 
          txnRef,
          fullURL: window.location.href,
          search: window.location.search 
        });

        // Extract transaction ID from txnRef or sessionStorage
        let transactionId = sessionStorage.getItem('pendingPaymentTransaction');
        
        if (txnRef && txnRef.length >= 36) {
          transactionId = txnRef.substring(0, 36);
        }

        // Case 1: Has VNPay parameters (direct callback with params)
        if (responseCode) {
          console.log('✅ Has VNPay params - checking response code');
          
          if (responseCode === '00') {
            // Success
            const paymentData = {
              transactionId,
              responseCode,
              success: true,
              message: 'Thanh toán thành công'
            };
            
            sessionStorage.setItem('paymentResult', JSON.stringify(paymentData));
            navigate('/payment/success', { state: paymentData, replace: true });
          } else {
            // Failure
            const paymentData = {
              transactionId,
              responseCode,
              success: false,
              message: getErrorMessage(responseCode)
            };
            
            navigate('/payment/failure', { state: paymentData, replace: true });
          }
        } 
        // Case 2: No VNPay parameters (backend already processed via /vnpay-ipn)
        else if (transactionId) {
          console.log('ℹ️ No VNPay params but has transaction ID - assuming backend processed');
          console.log('📝 Backend processes payment via /vnpay-ipn, so we assume success');
          
          // Backend redirect without params means payment was processed
          // Navigate to success (backend only redirects on success)
          const paymentData = {
            transactionId,
            success: true,
            message: 'Thanh toán thành công',
            backendProcessed: true
          };
          
          sessionStorage.setItem('paymentResult', JSON.stringify(paymentData));
          navigate('/payment/success', { state: paymentData, replace: true });
        }
        // Case 3: No params and no transaction ID
        else {
          console.warn('⚠️ No VNPay params and no transaction ID');
          navigate('/payment/failure', { 
            state: { 
              message: 'Không tìm thấy thông tin thanh toán',
              noData: true
            },
            replace: true
          });
        }
      } catch (error) {
        console.error('Error processing payment return:', error);
        navigate('/payment/failure', { 
          state: { 
            message: 'Có lỗi xảy ra khi xử lý thanh toán',
            error: error.message 
          },
          replace: true
        });
      } finally {
        setChecking(false);
      }
    };

    handleReturn();
  }, [searchParams, navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0028b8] mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Đang xử lý kết quả thanh toán...</div>
          <div className="text-sm text-gray-500 mt-2">Vui lòng không đóng trang</div>
        </div>
      </div>
    );
  }

  return null;
}

function getErrorMessage(responseCode) {
  const errorMessages = {
    '01': 'Giao dịch chưa hoàn tất',
    '02': 'Giao dịch bị lỗi',
    '04': 'Giao dịch đảo - Vui lòng liên hệ ngân hàng',
    '05': 'VNPAY đang xử lý giao dịch',
    '07': 'Giao dịch bị nghi ngờ gian lận',
    '09': 'Thẻ chưa đăng ký dịch vụ Internet Banking',
    '10': 'Xác thực thông tin thẻ không đúng quá 3 lần',
    '11': 'Đã hết hạn chờ thanh toán',
    '12': 'Thẻ/Tài khoản bị khóa',
    '13': 'Sai mật khẩu xác thực giao dịch (OTP)',
    '24': 'Khách hàng hủy giao dịch',
    '51': 'Tài khoản không đủ số dư',
    '65': 'Vượt quá hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng đang bảo trì',
    '79': 'Nhập sai mật khẩu quá số lần quy định',
    '99': 'Lỗi không xác định'
  };
  
  return errorMessages[responseCode] || 'Giao dịch không thành công';
}
