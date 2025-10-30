import React, { useState, useEffect } from 'react';
import { getAllUnconfirmedSwaps, confirmScheduledSwap, getSwapStatusText } from '../../../services/swapTransaction';
import { getAllBatteries, getBatteriesByStation } from '../../../services/battery';
import { getVehiclesByDriverId } from '../../../services/vehicle';
import { getStationById } from '../../../services/station';
import { getUsers } from '../../../services/admin';

const SwapConfirmationTab = ({ onUpdate }) => {
  const [swaps, setSwaps] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [selectedBatteries, setSelectedBatteries] = useState([]);
  const [confirming, setConfirming] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [swapsData, usersData] = await Promise.all([
        getAllUnconfirmedSwaps(),
        getUsers({ page: 1, size: 100 })
      ]);
      
      // Filter only unconfirmed swaps (SCHEDULED status)
      const unconfirmedSwaps = swapsData.filter(swap => {
        const isUnconfirmed = swap.status === 'SCHEDULED' || swap.status === 'PENDING';
        return isUnconfirmed;
      });
      
      // Get station ID from first swap to load station-specific batteries
      let stationId = null;
      if (unconfirmedSwaps.length > 0) {
        stationId = unconfirmedSwaps[0].stationId;
      }
      
      // Load batteries for this station only
      const batteriesData = stationId ? await getBatteriesByStation(stationId) : [];
      
      // Enrich swaps with driver info and fetch vehicle/station
      const enrichedSwaps = await Promise.all(
        unconfirmedSwaps.map(async (swap) => {
          try {
            // Check if BE already returned embedded data
            const hasVehicleData = swap.vehicle || swap.vehicleResponse || swap.vehicleInfo;
            const hasStationData = swap.station || swap.stationResponse || swap.stationInfo;
            const hasDriverData = swap.driver || swap.driverResponse;
            
            // Get driver info
            const driver = hasDriverData 
              ? (swap.driver || swap.driverResponse)
              : usersData.find(u => u.userId === swap.driverId || u.id === swap.driverId);
            
            // Get vehicle info: Try from embedded data first, then from driverId → vehicles
            let vehicle = null;
            if (hasVehicleData) {
              vehicle = swap.vehicle || swap.vehicleResponse || swap.vehicleInfo;
            } else if (swap.driverId) {
              // Fetch all vehicles of this driver, then find by vehicleId
              const driverVehicles = await getVehiclesByDriverId(swap.driverId).catch(() => []);
              vehicle = driverVehicles.find(v => 
                (v.vehicleId === swap.vehicleId || v.id === swap.vehicleId)
              ) || null;
            }
            
            // Get station info
            const station = hasStationData 
              ? (swap.station || swap.stationResponse || swap.stationInfo)
              : (swap.stationId ? await getStationById(swap.stationId).catch(() => null) : null);
            
            return {
              ...swap,
              driverInfo: driver,
              vehicleInfo: vehicle,
              stationInfo: station
            };
          } catch (e) {
            return swap;
          }
        })
      );
      
      setSwaps(enrichedSwaps);
      setBatteries(batteriesData);
      if (onUpdate) onUpdate();
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể tải dữ liệu';
      setError('Lỗi: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSwap = (swap) => {
    setSelectedSwap(swap);
    setSelectedBatteries([]);
    setError('');
  };

  const handleToggleBattery = (batteryId) => {
    // Check if battery is already assigned - if so, don't allow selection
    if (isBatteryAssigned(batteryId)) {
      setError('Pin này đã được gán cho giao dịch khác');
      return;
    }
    
    setSelectedBatteries(prev => {
      if (prev.includes(batteryId)) {
        return prev.filter(id => id !== batteryId);
      }
      return [...prev, batteryId];
    });
    
    // Clear error when successfully selecting
    setError('');
  };

  const handleConfirm = async () => {
    if (!selectedSwap) return;
    if (selectedBatteries.length === 0) {
      setError('Vui lòng chọn ít nhất 1 pin');
      return;
    }

    try {
      setConfirming(true);
      setError('');
      await confirmScheduledSwap(selectedSwap.transactionId, selectedBatteries);
      setSelectedSwap(null);
      setSelectedBatteries([]);
      await loadData();
      
      // Also update parent component count
      if (onUpdate) {
        onUpdate();
      }
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể duyệt đơn';
      setError('Lỗi: ' + errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  const getAvailableBatteriesForSwap = (swap) => {
    if (!swap || !batteries.length) return [];
    
    const vehicleBatteryType = swap.vehicleInfo?.batteryType;
    
    // Filter batteries that are available and match vehicle battery type
    return batteries.filter(b => 
      b.status === 'FULL' && // Changed from AVAILABLE to FULL (ready to use)
      (!vehicleBatteryType || b.type === vehicleBatteryType) // b.type instead of b.batteryType
    );
  };

  // Check if battery is already assigned to other confirmed swaps
  const isBatteryAssigned = (batteryId) => {
    // Check if battery is already selected for other confirmed swaps
    const assignedInOtherSwaps = swaps.some(otherSwap => {
      // Skip current selected swap
      if (otherSwap.transactionId === selectedSwap?.transactionId) return false;
      
      // Check if this swap is confirmed and has this battery assigned
      return otherSwap.status === 'CONFIRMED' && 
             otherSwap.batteryTransactions?.some(bt => 
               bt.newBattery?.batteryId === batteryId || 
               bt.newBattery?.id === batteryId
             );
    });
    
    return assignedInOtherSwaps;
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
        <h2 className="text-xl font-semibold text-gray-900">Đơn chờ duyệt</h2>
        <button
          onClick={loadData}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có đơn chờ duyệt</h3>
          <p className="mt-1 text-sm text-gray-500">Tất cả đơn đặt lịch đã được xử lý</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Swaps List */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Danh sách đơn ({swaps.length})</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {swaps.map(swap => (
                <div
                  key={swap.transactionId}
                  onClick={() => handleSelectSwap(swap)}
                  className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedSwap?.transactionId === swap.transactionId
                      ? 'border-[#0028b8] bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">#{swap.code || swap.transactionId?.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Khách: {swap.driverInfo?.firstName && swap.driverInfo?.lastName 
                          ? `${swap.driverInfo.firstName} ${swap.driverInfo.lastName}` 
                          : swap.driverInfo?.email || 'N/A'}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      {getSwapStatusText(swap.status)}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>🚗 Xe: {swap.vehicleInfo?.make || ''} {swap.vehicleInfo?.model || ''} ({swap.vehicleInfo?.licensePlate || 'N/A'})</p>
                    <p>📍 Trạm: {swap.stationInfo?.name || 'N/A'}</p>
                    <p>🔋 Loại pin: {swap.vehicleInfo?.batteryType || 'N/A'}</p>
                    <p>📅 Đặt lúc: {new Date(swap.scheduledTime).toLocaleString('vi-VN')}</p>
                    {swap.notes && <p>📝 Ghi chú: {swap.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Battery Selection */}
          <div>
            {selectedSwap ? (
              <div className="sticky top-4">
                <h3 className="font-medium text-gray-700 mb-4">Chọn pin cho đơn</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Thông tin đơn</p>
                  <p className="text-sm text-gray-700">Mã: #{selectedSwap.code || selectedSwap.transactionId?.slice(0, 8)}</p>
                  <p className="text-sm text-gray-700">Số lượng: {selectedSwap.vehicleBatteryCapacity || 1}</p>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {getAvailableBatteriesForSwap(selectedSwap).map(battery => {
                    const batteryId = battery.batteryId || battery.id;
                    const isAssigned = isBatteryAssigned(batteryId);
                    const isSelected = selectedBatteries.includes(batteryId);
                    
                    return (
                      <div
                        key={batteryId}
                        onClick={() => !isAssigned && handleToggleBattery(batteryId)}
                        className={`
                          p-3 border-2 rounded-lg transition-all
                          ${isAssigned 
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60' 
                            : isSelected
                              ? 'border-green-500 bg-green-50 cursor-pointer'
                              : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
                          }
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className={`font-medium ${isAssigned ? 'text-gray-500' : 'text-gray-900'}`}>
                              {battery.model}
                            </p>
                            <p className={`text-sm ${isAssigned ? 'text-gray-400' : 'text-gray-600'}`}>
                              SN: {battery.serialNumber}
                              {isAssigned && <span className="ml-2 text-red-500 font-medium">(Đã gán)</span>}
                            </p>
                          </div>
                          
                          {isSelected && !isAssigned && (
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          
                          {isAssigned && (
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {getAvailableBatteriesForSwap(selectedSwap).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Không có pin khả dụng phù hợp</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedSwap(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={confirming || selectedBatteries.length === 0}
                    className="flex-1 px-4 py-2 bg-[#0028b8] text-white rounded-lg hover:bg-[#001a8b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {confirming ? 'Đang xử lý...' : `Duyệt (${selectedBatteries.length} pin)`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p>Chọn đơn để xem chi tiết và duyệt</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapConfirmationTab;
