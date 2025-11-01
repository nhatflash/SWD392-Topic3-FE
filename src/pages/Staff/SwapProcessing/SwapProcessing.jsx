import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { confirmArrival, startSwapping, completeSwapping } from '../../../services/swapTransaction';
import { processPayment, PaymentMethods, getPaymentMethodText } from '../../../services/payment';

export default function SwapProcessing() {
  const navigate = useNavigate();
  const [transactionCode, setTransactionCode] = useState('');
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Mock - In real app, you'd fetch transaction by code from BE
  const handleLookupTransaction = async () => {
    if (!transactionCode.trim()) {
      Swal.fire('Lỗi', 'Vui lòng nhập mã giao dịch', 'warning');
      return;
    }

    // TODO: Add actual API call to get transaction by code
    // For now, show input for transaction ID
    const { value: transactionId } = await Swal.fire({
      title: 'Nhập Transaction ID',
      input: 'text',
      inputLabel: 'UUID của giao dịch',
      inputPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      showCancelButton: true,
      confirmButtonText: 'Tiếp tục',
      cancelButtonText: 'Hủy'
    });

    if (transactionId) {
      setActiveTransaction({
        transactionId,
        code: transactionCode,
        status: 'CONFIRMED' // Mock status
      });
    }
  };

  const handleConfirmArrival = async () => {
    if (!activeTransaction) return;

    try {
      setProcessing(true);
      const result = await Swal.fire({
        title: 'Xác nhận khách đã đến?',
        text: `Giao dịch #${activeTransaction.code}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        await confirmArrival(activeTransaction.transactionId);
        
        Swal.fire({
          icon: 'success',
          title: 'Đã xác nhận!',
          text: 'Khách hàng đã đến. Tiến hành thanh toán.',
          confirmButtonText: 'OK'
        });

        // Update transaction status
        setActiveTransaction(prev => ({
          ...prev,
          status: 'CONFIRMED',
          arrivalConfirmed: true
        }));
      }
    } catch (error) {
      console.error('Error confirming arrival:', error);
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể xác nhận', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!activeTransaction) return;

    try {
      const { value: paymentMethod } = await Swal.fire({
        title: 'Chọn phương thức thanh toán',
        input: 'select',
        inputOptions: {
          [PaymentMethods.CASH]: getPaymentMethodText(PaymentMethods.CASH),
          [PaymentMethods.VNPAY]: getPaymentMethodText(PaymentMethods.VNPAY)
        },
        inputPlaceholder: 'Chọn phương thức',
        showCancelButton: true,
        confirmButtonText: 'Tiếp tục',
        cancelButtonText: 'Hủy'
      });

      if (paymentMethod) {
        setProcessing(true);
        const result = await processPayment({
          transactionId: activeTransaction.transactionId,
          method: paymentMethod
        });

        if (paymentMethod === PaymentMethods.VNPAY) {
          // Redirect to VNPay
          Swal.fire({
            icon: 'info',
            title: 'Chuyển đến trang thanh toán',
            text: 'Đang chuyển hướng...',
            timer: 2000,
            showConfirmButton: false
          });
          setTimeout(() => {
            window.location.href = result; // VNPay URL
          }, 2000);
        } else {
          // Cash payment
          Swal.fire({
            icon: 'success',
            title: 'Thanh toán thành công!',
            text: 'Đã nhận tiền mặt. Tiến hành thay pin.',
            confirmButtonText: 'OK'
          });
          
          setActiveTransaction(prev => ({
            ...prev,
            paymentCompleted: true
          }));
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      Swal.fire('Lỗi', error.response?.data?.message || 'Lỗi thanh toán', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartSwapping = async () => {
    if (!activeTransaction) return;

    try {
      setProcessing(true);
      const result = await Swal.fire({
        title: 'Bắt đầu thay pin?',
        text: `Giao dịch #${activeTransaction.code}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Bắt đầu',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        await startSwapping(activeTransaction.transactionId);
        
        Swal.fire({
          icon: 'success',
          title: 'Đang thay pin...',
          text: 'Hãy hoàn thành việc thay pin.',
          confirmButtonText: 'OK'
        });

        setActiveTransaction(prev => ({
          ...prev,
          status: 'IN_PROGRESS',
          swappingStarted: true
        }));
      }
    } catch (error) {
      console.error('Error starting swap:', error);
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể bắt đầu', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteSwapping = async () => {
    if (!activeTransaction) return;

    try {
      setProcessing(true);
      const result = await Swal.fire({
        title: 'Hoàn thành thay pin?',
        text: `Giao dịch #${activeTransaction.code}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Hoàn thành',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        await completeSwapping(activeTransaction.transactionId);
        
        Swal.fire({
          icon: 'success',
          title: 'Hoàn thành!',
          text: 'Đã hoàn thành giao dịch thay pin.',
          confirmButtonText: 'OK'
        }).then(() => {
          // Reset for next transaction
          setActiveTransaction(null);
          setTransactionCode('');
        });
      }
    } catch (error) {
      console.error('Error completing swap:', error);
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể hoàn thành', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Xử Lý Thay Pin</h1>

      {/* Transaction Lookup */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Tra cứu giao dịch</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value)}
            placeholder="Nhập mã giao dịch (VD: TXN001)"
            className="flex-1 border rounded-lg px-4 py-2"
            onKeyPress={(e) => e.key === 'Enter' && handleLookupTransaction()}
          />
          <button
            onClick={handleLookupTransaction}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Tra cứu
          </button>
        </div>
      </div>

      {/* Active Transaction */}
      {activeTransaction && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Giao dịch #{activeTransaction.code}
          </h2>

          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {[
                { key: 'arrival', label: 'Xác nhận đến' },
                { key: 'payment', label: 'Thanh toán' },
                { key: 'swap', label: 'Thay pin' },
                { key: 'complete', label: 'Hoàn thành' }
              ].map((step, index) => (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      (step.key === 'arrival' && activeTransaction.arrivalConfirmed) ||
                      (step.key === 'payment' && activeTransaction.paymentCompleted) ||
                      (step.key === 'swap' && activeTransaction.swappingStarted) ||
                      (step.key === 'complete' && activeTransaction.status === 'COMPLETED')
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-xs mt-1 text-center">{step.label}</span>
                  </div>
                  {index < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      index === 0 && activeTransaction.arrivalConfirmed ? 'bg-green-500' :
                      index === 1 && activeTransaction.paymentCompleted ? 'bg-green-500' :
                      index === 2 && activeTransaction.swappingStarted ? 'bg-green-500' :
                      'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!activeTransaction.arrivalConfirmed && (
              <button
                onClick={handleConfirmArrival}
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition disabled:bg-gray-400"
              >
                1. Xác nhận khách đã đến
              </button>
            )}

            {activeTransaction.arrivalConfirmed && !activeTransaction.paymentCompleted && (
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition disabled:bg-gray-400"
              >
                2. Thanh toán
              </button>
            )}

            {activeTransaction.paymentCompleted && !activeTransaction.swappingStarted && (
              <button
                onClick={handleStartSwapping}
                disabled={processing}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition disabled:bg-gray-400"
              >
                3. Bắt đầu thay pin
              </button>
            )}

            {activeTransaction.swappingStarted && activeTransaction.status !== 'COMPLETED' && (
              <button
                onClick={handleCompleteSwapping}
                disabled={processing}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition disabled:bg-gray-400"
              >
                4. Hoàn thành thay pin
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setActiveTransaction(null);
              setTransactionCode('');
            }}
            className="w-full mt-4 bg-gray-300 hover:bg-gray-400 px-6 py-2 rounded-lg transition"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
}
