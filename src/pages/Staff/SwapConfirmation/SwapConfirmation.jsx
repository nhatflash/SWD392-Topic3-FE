import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getAllUnconfirmedSwaps, confirmScheduledSwap } from '../../../services/swapTransaction';
import { getBatteriesByStationAndStatus } from '../../../services/battery';
import { getSwapStatusText, getSwapTypeText } from '../../../services/swapTransaction';
import { getVehiclesByDriverId, getUserVehicles } from '../../../services/vehicle';

export default function SwapConfirmation() {
  console.log('🚀 SwapConfirmation render - timestamp:', new Date().toLocaleTimeString());
  
  const [swaps, setSwaps] = useState([]);
  const [availableBatteries, setAvailableBatteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [selectedBatteryIds, setSelectedBatteryIds] = useState([]);
  const [vehicleCache, setVehicleCache] = useState({}); // Cache vehicle data

  useEffect(() => {
    console.log('🔥 SwapConfirmation component loaded - check if this appears in console');
    loadSwaps();
  }, []);

  // Utility function to get battery type from vehicleId
  const getBatteryTypeFromVehicleId = async (vehicleId, driverId) => {
    try {
      // Check cache first
      if (vehicleCache[vehicleId]) {
        return vehicleCache[vehicleId].batteryType;
      }

      // Fetch vehicle data by driverId
      const driverVehicles = await getVehiclesByDriverId(driverId);
      const vehicle = driverVehicles.find(v => v.vehicleId === vehicleId || v.id === vehicleId);
      
      if (vehicle) {
        // Cache the vehicle data
        setVehicleCache(prev => ({ ...prev, [vehicleId]: vehicle }));
        return vehicle.batteryType?.value || vehicle.batteryType?.type || vehicle.batteryType;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching vehicle battery type:', error);
      return null;
    }
  };

  // Utility function to extract battery type from vehicle data
  const extractBatteryType = (vehicle) => {
    if (!vehicle) {
      console.log('extractBatteryType: No vehicle data');
      return null;
    }
    
    console.log('extractBatteryType: Vehicle data:', vehicle);
    
    const batteryType = vehicle.batteryType?.value || 
                       vehicle.batteryType?.type ||
                       vehicle.batteryType ||
                       vehicle.batteryModel?.type ||
                       vehicle.batteryModel ||
                       vehicle.battery?.type ||
                       vehicle.battery?.model ||
                       vehicle.type; // Sometimes type is directly on vehicle
    
    console.log('extractBatteryType: Extracted battery type:', batteryType);
    return batteryType;
  };

  // Alternative: Extract battery type from notes field 
  const extractBatteryTypeFromNotes = (notes) => {
    if (!notes) return null;
    
    // Look for patterns like "model LI-75", "pin model LI-75", etc.
    const modelMatch = notes.match(/model\s+([A-Z0-9-]+)/i);
    if (modelMatch) {
      console.log('Found battery type in notes:', modelMatch[1]);
      return modelMatch[1];
    }
    
    // Also try pattern like "LI-75", "APL-2025", etc. (common battery naming)
    const typeMatch = notes.match(/([A-Z]{2,3}-\d{2,4})/i);
    if (typeMatch) {
      console.log('Found battery type pattern in notes:', typeMatch[1]);
      return typeMatch[1];
    }
    
    return null;
  };

  // Since SwapTransactionResponse doesn't include Vehicle info, focus on notes extraction
  const getBatteryTypeForSwap = (swap) => {
    // First try: Extract from notes
    const notesType = extractBatteryTypeFromNotes(swap.notes);
    if (notesType) {
      return { type: notesType, source: 'notes' };
    }
    
    // Second try: From vehicle if enriched
    const vehicleType = extractBatteryType(swap.vehicle);
    if (vehicleType) {
      return { type: vehicleType, source: 'vehicle' };
    }
    
    return { type: null, source: null };
  };

  // Enhanced function to enrich swap data with vehicle info
  const enrichSwapWithVehicleData = async (swap) => {
    if (swap.vehicle) {
      console.log('Swap already has vehicle data:', swap.vehicle);
      return swap; // Already has vehicle data
    }

    console.log('Enriching swap with vehicle data:', {
      swapId: swap.transactionId,
      vehicleId: swap.vehicleId,
      driverId: swap.driverId
    });

    try {
      // First try: Use staff API to get driver's vehicles
      let driverVehicles = [];
      try {
        driverVehicles = await getVehiclesByDriverId(swap.driverId);
        console.log('Driver vehicles response (staff API):', driverVehicles);
      } catch (staffApiError) {
        console.warn('Staff API failed, trying fallback:', staffApiError);
        // Fallback: Use general vehicle API (might work in some cases)
        try {
          driverVehicles = await getUserVehicles();
          console.log('Driver vehicles response (fallback API):', driverVehicles);
        } catch (fallbackError) {
          console.error('Both APIs failed:', fallbackError);
        }
      }
      
      const vehicle = driverVehicles.find(v => {
        const vehicleIdMatch = v.vehicleId === swap.vehicleId || v.id === swap.vehicleId;
        console.log('Checking vehicle match:', {
          vehicleInArray: { id: v.id, vehicleId: v.vehicleId },
          targetVehicleId: swap.vehicleId,
          match: vehicleIdMatch
        });
        return vehicleIdMatch;
      });
      
      if (vehicle) {
        console.log('Found matching vehicle:', vehicle);
        // Cache the vehicle data
        setVehicleCache(prev => ({ ...prev, [swap.vehicleId]: vehicle }));
        const enrichedSwap = { ...swap, vehicle };
        console.log('Enriched swap result:', enrichedSwap);
        return enrichedSwap;
      } else {
        console.warn('No matching vehicle found for vehicleId:', swap.vehicleId);
      }
    } catch (error) {
      console.error('Error enriching swap with vehicle data:', error);
    }
    
    return swap; // Return original if enrichment fails
  };

  useEffect(() => {
    loadSwaps();
  }, []);

  const loadSwaps = async () => {
    try {
      setLoading(true);
      const data = await getAllUnconfirmedSwaps();
      
      // Enrich swap data with vehicle information
      const enrichedSwaps = await Promise.all(
        data.map(async (swap) => {
          if (!swap.vehicle && swap.vehicleId && swap.driverId) {
            return await enrichSwapWithVehicleData(swap);
          }
          return swap;
        })
      );
      
      setSwaps(enrichedSwaps);
      console.log('Enriched swaps with vehicle data:', enrichedSwaps);
    } catch (error) {
      console.error('Error loading swaps:', error);
      Swal.fire('Lỗi', 'Không thể tải danh sách đặt lịch', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSwap = async (swap) => {
    try {
      // Try to enrich with vehicle data if not already present
      const enrichedSwap = await enrichSwapWithVehicleData(swap);
      setSelectedSwap(enrichedSwap);
      setSelectedBatteryIds([]);
      
      // Debug: Log swap data structure
      console.log('Selected swap data:', enrichedSwap);
      console.log('Vehicle data:', enrichedSwap.vehicle);
      console.log('Battery type data:', enrichedSwap.vehicle?.batteryType);
      
      // Load available batteries at the station
      const batteries = await getBatteriesByStationAndStatus(swap.stationId, 'FULL', 0);
      console.log('Available batteries response:', batteries);
      if (batteries.length > 0) {
        console.log('Sample battery structure:', batteries[0]);
      }
      setAvailableBatteries(batteries);
    } catch (error) {
      console.error('Error loading batteries:', error);
      Swal.fire('Lỗi', 'Không thể tải danh sách pin', 'error');
    }
  };

  const handleBatteryToggle = (batteryId) => {
    setSelectedBatteryIds(prev => {
      if (prev.includes(batteryId)) {
        return prev.filter(id => id !== batteryId);
      } else {
        return [...prev, batteryId];
      }
    });
  };

  const handleConfirm = async () => {
    if (!selectedSwap) return;

    // Validate battery count matches vehicle requirement
    const requiredCount = selectedSwap.vehicle?.batteryCapacity || 1;
    if (selectedBatteryIds.length !== requiredCount) {
      Swal.fire({
        icon: 'warning',
        title: 'Số lượng pin không đúng',
        text: `Xe này cần ${requiredCount} pin, bạn đã chọn ${selectedBatteryIds.length} pin.`
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Xác nhận đặt lịch',
        html: `
          <div class="text-left">
            <p><strong>Mã giao dịch:</strong> ${selectedSwap.code}</p>
            <p><strong>Khách hàng:</strong> ${selectedSwap.driver?.firstName} ${selectedSwap.driver?.lastName}</p>
            <p><strong>Xe:</strong> ${selectedSwap.vehicle?.make} ${selectedSwap.vehicle?.model}</p>
            <p><strong>Số pin:</strong> ${selectedBatteryIds.length}</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        await confirmScheduledSwap({
          transactionId: selectedSwap.transactionId,
          batteryIds: selectedBatteryIds
        });

        Swal.fire({
          icon: 'success',
          title: 'Xác nhận thành công!',
          text: 'Đã gán pin cho giao dịch. Chờ khách hàng đến.'
        });

        setSelectedSwap(null);
        setSelectedBatteryIds([]);
        loadSwaps();
      }
    } catch (error) {
      console.error('Error confirming swap:', error);
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể xác nhận', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang tải... (Updated: {new Date().toLocaleTimeString()})</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full px-6 py-6">
      <h1 className="text-3xl font-bold mb-6">Xác Nhận Đặt Lịch Thay Pin (Updated: {new Date().toLocaleTimeString()})</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8" style={{ height: 'calc(100vh - 120px)' }}>
        {/* Left: Swap List */}
        <div className="h-full">
          <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4">
              Danh sách chờ xác nhận ({swaps.length})
            </h2>

            {swaps.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Không có đặt lịch nào chờ xác nhận
              </p>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                {swaps.map((swap) => (
                  <div
                    key={swap.transactionId}
                    onClick={() => handleSelectSwap(swap)}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      selectedSwap?.transactionId === swap.transactionId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">#{swap.code}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        swap.status === 'SCHEDULED' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200'
                      }`}>
                        {getSwapStatusText(swap.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Khách:</span>{' '}
                        {swap.driver?.firstName} {swap.driver?.lastName}
                      </p>
                      <p>
                        <span className="font-medium">Xe:</span>{' '}
                        {swap.vehicle ? 
                          `${swap.vehicle.make} ${swap.vehicle.model} (${swap.vehicle.licensePlate})` :
                          `Vehicle ID: ${swap.vehicleId?.slice(0, 8)}...`
                        }
                      </p>
                      <p>
                        <span className="font-medium">Loại pin:</span>{' '}
                        {(() => {
                          const result = getBatteryTypeForSwap(swap);
                          if (result.type) {
                            return <span className="text-blue-600">{result.type}</span>;
                          } else {
                            return <span className="text-orange-600">Cần xác định tại trạm</span>;
                          }
                        })()}
                      </p>
                      <p>
                        <span className="font-medium">Số pin cần:</span>{' '}
                        {swap.vehicle?.batteryCapacity || 1}
                      </p>
                      <p>
                        <span className="font-medium">Thời gian:</span>{' '}
                        {new Date(swap.scheduledTime).toLocaleString('vi-VN')}
                      </p>
                      {swap.notes && (
                        <p className="text-xs italic text-gray-500">
                          Ghi chú: {swap.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Battery Selection */}
        <div className="h-full">
          {selectedSwap ? (
            <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4">
                Chọn pin cho giao dịch #{selectedSwap.code}
              </h2>

              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm">
                  <strong>Số lượng:</strong> {selectedSwap.vehicle?.batteryCapacity || 1} pin
                </p>
                <p className="text-sm">
                  <strong>Đã chọn:</strong> {selectedBatteryIds.length} pin
                </p>
                {!selectedSwap.vehicle && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ Thông tin xe chưa đầy đủ. Nhân viên sẽ xác định loại pin khi khách hàng đến.
                  </p>
                )}
                {/* Debug button - remove in production */}
                <button 
                  onClick={() => {
                    console.log('=== DEBUG INFO ===');
                    console.log('Selected swap:', selectedSwap);
                    console.log('Vehicle data:', selectedSwap.vehicle);
                    console.log('Vehicle cache:', vehicleCache);
                    console.log('Extracted battery type:', extractBatteryType(selectedSwap.vehicle));
                    console.log('Available batteries:', availableBatteries);
                    if (availableBatteries.length > 0) {
                      console.log('Sample battery structure:', availableBatteries[0]);
                      console.log('Sample battery SoH extraction:', {
                        stateOfHealth: availableBatteries[0].stateOfHealth,
                        percentage: availableBatteries[0].stateOfHealth?.percentage,
                        soh: availableBatteries[0].soh,
                        health: availableBatteries[0].health
                      });
                    }
                    alert('Debug info printed to console. Press F12 to see details.');
                  }}
                  className="text-xs bg-gray-200 px-2 py-1 rounded mt-2"
                >
                  🐛 Debug Info
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                {availableBatteries.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Không có pin sẵn sàng
                  </p>
                ) : !selectedSwap.vehicle ? (
                  // Show all batteries if vehicle info is not available
                  <div>
                    <p className="text-orange-600 text-sm mb-3 p-2 bg-orange-50 rounded border border-orange-200">
                      ⚠️ Hiển thị tất cả pin có sẵn vì thông tin xe chưa đầy đủ. 
                      Nhân viên vui lòng xác định loại pin phù hợp khi khách hàng đến.
                    </p>
                    {availableBatteries.map((battery) => (
                      <div
                        key={battery.id}
                        onClick={() => handleBatteryToggle(battery.id)}
                        className={`border rounded-lg p-3 cursor-pointer transition mb-2 ${
                          selectedBatteryIds.includes(battery.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              {battery.serialNumber || `Pin #${battery.id.slice(0, 8)}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              Loại: {battery.batteryType || battery.model?.type || 'N/A'} | 
                              Charge: {battery.chargeLevel || battery.currentChargePercentage || battery.chargePercentage || battery.charge || 100}%
                            </p>
                          </div>
                          {selectedBatteryIds.includes(battery.id) && (
                            <span className="text-green-600 font-bold text-xl">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  availableBatteries
                    .filter(battery => {
                      // Backend BatteryState has batteryType as String directly
                      const batteryType = battery.batteryType || battery.model?.type || battery.model?.type?.value;
                      const swapBatteryInfo = getBatteryTypeForSwap(selectedSwap);
                      
                      // Match with swap's required battery type
                      return batteryType === swapBatteryInfo.type;
                    })
                    .map((battery) => (
                      <div
                        key={battery.id}
                        onClick={() => handleBatteryToggle(battery.id)}
                        className={`border rounded-lg p-3 cursor-pointer transition ${
                          selectedBatteryIds.includes(battery.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              {battery.serialNumber || `Pin #${battery.id.slice(0, 8)}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              Charge: {battery.chargeLevel || battery.currentChargePercentage || battery.chargePercentage || battery.charge || 100}%
                            </p>
                          </div>
                          {selectedBatteryIds.includes(battery.id) && (
                            <span className="text-green-600 font-bold text-xl">✓</span>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={handleConfirm}
                  disabled={selectedBatteryIds.length !== (selectedSwap.vehicle?.batteryCapacity || 1)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Xác nhận ({selectedBatteryIds.length}/{selectedSwap.vehicle?.batteryCapacity || 1})
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-12 text-center text-gray-500 h-full flex items-center justify-center">
              <p>Chọn một đặt lịch để xem chi tiết và gán pin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
