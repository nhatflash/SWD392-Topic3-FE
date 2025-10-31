import React, { useState, useEffect } from 'react';
import { getAllUnconfirmedSwaps, confirmArrival, startSwapping, completeSwapping, getSwapStatusText } from '../../../services/swapTransaction';
import { getPaymentStatus } from '../../../services/driverOrders';
import { getVehiclesByDriverId } from '../../../services/vehicle';
import { getStationById } from '../../../services/station';
import { getUsers } from '../../../services/admin';

const SwapProcessingTab = () => {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [paymentStatuses, setPaymentStatuses] = useState({}); // Track payment status for each transaction

  const loadSwaps = async () => {
    try {
      setLoading(true);
      setError('');
      // This gets all swaps, we'll filter for processing states
      const [data, usersData] = await Promise.all([
        getAllUnconfirmedSwaps(),
        getUsers({ page: 1, size: 100 })
      ]);
      
      // Filter for: CONFIRMED, IN_PROGRESS
      const processing = data.filter(s => 
        s.status === 'CONFIRMED' || s.status === 'IN_PROGRESS'
      );
      
      // Enrich with details
      const enriched = await Promise.all(
        processing.map(async (swap) => {
          try {
            // Check embedded data
            const hasVehicleData = swap.vehicle || swap.vehicleResponse || swap.vehicleInfo;
            const hasStationData = swap.station || swap.stationResponse || swap.stationInfo;
            const hasDriverData = swap.driver || swap.driverResponse;
            
            // Get driver
            const driver = hasDriverData 
              ? (swap.driver || swap.driverResponse)
              : usersData.find(u => u.userId === swap.driverId || u.id === swap.driverId);
            
            // Get vehicle from driverId → vehicles → find by vehicleId
            let vehicle = null;
            if (hasVehicleData) {
              vehicle = swap.vehicle || swap.vehicleResponse || swap.vehicleInfo;
            } else if (swap.driverId) {
              const driverVehicles = await getVehiclesByDriverId(swap.driverId).catch(() => []);
              vehicle = driverVehicles.find(v => 
                (v.vehicleId === swap.vehicleId || v.id === swap.vehicleId)
              ) || null;
            }
            
            // Get station
            const station = hasStationData 
              ? (swap.station || swap.stationResponse || swap.stationInfo)
              : (swap.stationId ? await getStationById(swap.stationId).catch(() => null) : null);
            
            return { ...swap, driverInfo: driver, vehicleInfo: vehicle, stationInfo: station };
          } catch (e) {
            return swap;
          }
        })
      );
      
      setSwaps(enriched);
      
      // Load payment status for each CONFIRMED transaction
      const paymentStatusPromises = enriched
        .filter(s => s.status === 'CONFIRMED')
        .map(async (swap) => {
          try {
            const status = await getPaymentStatus(swap.transactionId);
            return { transactionId: swap.transactionId, status };
          } catch (e) {
            console.warn(`Failed to get payment status for ${swap.transactionId}:`, e);
            return { transactionId: swap.transactionId, status: null };
          }
        });
      
      const statuses = await Promise.all(paymentStatusPromises);
      const statusMap = {};
      statuses.forEach(({ transactionId, status }) => {
        statusMap[transactionId] = status;
        console.log(`💳 Payment status for ${transactionId.slice(0, 8)}:`, status);
      });
      setPaymentStatuses(statusMap);
      
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể tải dữ liệu';
      setError('Lỗi: ' + errorMessage);
      console.error('Load swaps error:', e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSwaps();
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadSwaps, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmArrival = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      setError('');
      await confirmArrival(transactionId);
      await loadSwaps(); // This will also reload payment statuses
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể xác nhận đến trạm';
      setError('Lỗi: ' + errorMessage);
      console.error('Confirm arrival error:', e?.response?.data || e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartSwapping = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      setError('');
      
      // Check payment status before allowing swap to start
      const paymentStatus = paymentStatuses[transactionId];
      
      // Skip payment check if transaction has arrivalTime (means customer is at station)
      // For cash payment, payment will be done at the station
      const swap = swaps.find(s => s.transactionId === transactionId);
      const hasArrived = swap?.arrivalTime;
      
      if (!hasArrived && (!paymentStatus || paymentStatus.status !== 'COMPLETED')) {
        setError('❌ Không thể bắt đầu đổi pin: Đơn hàng chưa được thanh toán!');
        setProcessingId(null);
        return;
      }
      
      await startSwapping(transactionId);
      await loadSwaps();
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể bắt đầu đổi pin';
      setError('Lỗi: ' + errorMessage);
      console.error('Start swapping error:', e?.response?.data || e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteSwapping = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      setError('');
      await completeSwapping(transactionId);
      await loadSwaps();
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể hoàn thành đổi pin';
      setError('Lỗi: ' + errorMessage);
      console.error('Complete swapping error:', e?.response?.data || e);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã xác nhận' },
      IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Đang đổi pin' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getActionButtons = (swap) => {
    const id = swap.transactionId;
    const isProcessing = processingId === id;
    const paymentStatus = paymentStatuses[id];
    const isPaymentCompleted = paymentStatus?.status === 'COMPLETED';
    const hasArrived = !!swap.arrivalTime; // Check if already confirmed arrival

    // Debug log
    console.log(`🔍 Transaction ${id.slice(0, 8)}:`, {
      status: swap.status,
      hasArrived,
      paymentStatus,
      isPaymentCompleted
    });

    if (swap.status === 'CONFIRMED') {
      // Can confirm arrival or start swapping (only if paid)
      // For cash payment: allow start swapping after arrival confirmation
      const canStartSwapping = hasArrived || isPaymentCompleted;
      
      return (
        <div className="space-y-2">
          {/* Payment Status Indicator */}
          {paymentStatus && (
            <div className={`p-2 rounded-lg text-xs font-medium text-center ${
              isPaymentCompleted 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              {isPaymentCompleted ? '✓ Đã thanh toán' : '⚠️ Chưa thanh toán'}
            </div>
          )}
          
          {/* Arrival confirmation info for cash payment */}
          {!paymentStatus && hasArrived && (
            <div className="p-2 rounded-lg text-xs font-medium text-center bg-blue-50 text-blue-700 border border-blue-200">
              💵 Thanh toán tiền mặt tại trạm
            </div>
          )}
          
          <div className="flex gap-2">
            {/* Only show "Xác nhận đến" if arrivalTime is not set */}
            {!hasArrived && (
              <button
                onClick={() => handleConfirmArrival(id)}
                disabled={isProcessing}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Đang xử lý...' : '✓ Xác nhận đến'}
              </button>
            )}
            <button
              onClick={() => handleStartSwapping(id)}
              disabled={isProcessing || !canStartSwapping}
              title={!canStartSwapping ? 'Cần xác nhận đến hoặc thanh toán trước' : ''}
              className={`${!hasArrived ? 'flex-1' : 'w-full'} px-3 py-2 bg-[#0028b8] text-white text-sm rounded-lg hover:bg-[#001a8b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
            >
              {isProcessing ? 'Đang xử lý...' : '▶ Bắt đầu đổi'}
            </button>
          </div>
        </div>
      );
    }

    if (swap.status === 'IN_PROGRESS') {
      // Can complete swapping
      return (
        <button
          onClick={() => handleCompleteSwapping(id)}
          disabled={isProcessing}
          className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isProcessing ? 'Đang xử lý...' : '✓ Hoàn thành đổi pin'}
        </button>
      );
    }

    return null;
  };

  if (loading && !swaps.length) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0028b8]"></div>
        <p className="mt-2 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Giao dịch đang xử lý</h2>
        <button
          onClick={loadSwaps}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#0028b8] hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {swaps.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có giao dịch đang xử lý</h3>
          <p className="mt-1 text-sm text-gray-500">Các giao dịch đang chờ xác nhận hoặc đang đổi pin sẽ hiện ở đây</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {swaps.map(swap => (
            <div
              key={swap.transactionId}
              className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-gray-900 text-lg">#{swap.code || swap.transactionId?.slice(0, 8)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {swap.driverInfo?.firstName && swap.driverInfo?.lastName 
                      ? `${swap.driverInfo.firstName} ${swap.driverInfo.lastName}` 
                      : swap.driverInfo?.email || 'Khách hàng'}
                  </p>
                </div>
                {getStatusBadge(swap.status)}
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">🚗</span>
                  <span className="text-gray-700">{swap.vehicleInfo?.make || ''} {swap.vehicleInfo?.model || ''}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">🔢</span>
                  <span className="text-gray-700">{swap.vehicleInfo?.licensePlate || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">🔋</span>
                  <span className="text-gray-700">{swap.vehicleInfo?.batteryType || 'N/A'}</span>
                </div>
                {swap.scheduledTime && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">📅</span>
                    <span className="text-gray-700">{new Date(swap.scheduledTime).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {swap.arrivalTime && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">✓</span>
                    <span className="text-gray-700">Đến: {new Date(swap.arrivalTime).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {swap.swapStartTime && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">▶</span>
                    <span className="text-gray-700">Bắt đầu: {new Date(swap.swapStartTime).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {swap.notes && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">📝</span>
                    <span className="text-gray-700">{swap.notes}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-200">
                {getActionButtons(swap)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SwapProcessingTab;
