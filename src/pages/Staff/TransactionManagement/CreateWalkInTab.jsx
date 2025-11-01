import React, { useState, useEffect } from 'react';
import { createWalkInSwap } from '../../../services/swapTransaction';
import { getAllBatteries, getBatteriesByStation } from '../../../services/battery';
import { getUsers } from '../../../services/admin';
import { getVehiclesByDriverId } from '../../../services/vehicle';

const CreateWalkInTab = () => {
  const [drivers, setDrivers] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stationId, setStationId] = useState(null);

  const [formData, setFormData] = useState({
    driverId: '',
    vehicleId: '',
    batteryIds: [],
    notes: ''
  });

  const [driverVehicles, setDriverVehicles] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers({ page: 1, size: 100 });
      
      // Filter for drivers only
      const driversOnly = usersData.filter(u => u.role === 'DRIVER');
      setDrivers(driversOnly);
      
      // For walk-in, we'll load batteries when vehicle is selected and we have station context
      // For now, load all batteries as fallback
      const batteriesData = await getAllBatteries(1, 100);
      setBatteries(batteriesData.filter(b => b.status === 'FULL'));
    } catch (e) {
      setError('Không thể tải dữ liệu: ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Load batteries for specific station when vehicle is selected
  const handleVehicleChange = async (vehicleId) => {
    setFormData(prev => ({ ...prev, vehicleId, batteryIds: [] }));
    
    if (!vehicleId) return;
    
    // Try to load station-specific batteries
    // For walk-in scenario, we assume staff is creating for their own station
    // Get station context from existing swap transactions or staff context
    try {
      // Import station staff service to get staff station
      const { getAllUnconfirmedSwaps } = await import('../../../services/swapTransaction');
      const swaps = await getAllUnconfirmedSwaps();
      
      if (swaps && swaps.length > 0) {
        // Get station ID from existing swaps (staff's station)
        const staffStationId = swaps[0]?.stationId;
        if (staffStationId) {
          const stationBatteries = await getBatteriesByStation(staffStationId);
          setBatteries(stationBatteries.filter(b => b.status === 'FULL'));
          setStationId(staffStationId);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load station-specific batteries, using all batteries:', e);
    }
    
    // Fallback to all batteries if station detection fails
    const allBatteries = await getAllBatteries(1, 100);
    setBatteries(allBatteries.filter(b => b.status === 'FULL'));
  };

  const handleDriverChange = async (driverId) => {
    setFormData(prev => ({ ...prev, driverId, vehicleId: '', batteryIds: [] }));
    
    if (!driverId) {
      setDriverVehicles([]);
      return;
    }

    try {
      // Try to load driver's vehicles from BE endpoint
      const vehiclesData = await getVehiclesByDriverId(driverId);
      
      if (vehiclesData && vehiclesData.length > 0) {
        setDriverVehicles(vehiclesData.filter(v => v.isActive !== false));
        setError(''); // Clear any previous errors
      } else {
        // Fallback: Check if driver object has embedded vehicles
        const selectedDriver = drivers.find(d => d.userId === driverId || d.id === driverId);
        if (selectedDriver?.vehicles) {
          setDriverVehicles(selectedDriver.vehicles.filter(v => v.isActive !== false));
          setError('');
        } else {
          setError('Không tìm thấy xe của tài xế này. BE endpoint GET /api/vehicle/all/{driverId} chưa sẵn sàng hoặc driver chưa có xe.');
          setDriverVehicles([]);
        }
      }
    } catch (e) {
      console.error('Error loading driver vehicles:', e);
      setError('Không thể tải xe của tài xế: ' + (e?.response?.data?.message || e?.message || 'Lỗi không xác định'));
      setDriverVehicles([]);
    }
  };

  const handleToggleBattery = (batteryId) => {
    setFormData(prev => ({
      ...prev,
      batteryIds: prev.batteryIds.includes(batteryId)
        ? prev.batteryIds.filter(id => id !== batteryId)
        : [...prev.batteryIds, batteryId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.driverId) {
      setError('Vui lòng chọn tài xế');
      return;
    }
    if (!formData.vehicleId) {
      setError('Vui lòng chọn xe');
      return;
    }
    if (formData.batteryIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 pin');
      return;
    }

    try {
      setLoading(true);
      await createWalkInSwap({
        driverId: formData.driverId,
        vehicleId: formData.vehicleId,
        batteryIds: formData.batteryIds,
        notes: formData.notes.trim() || undefined
      });
      
      setSuccess('Tạo đơn walk-in thành công!');
      setFormData({ driverId: '', vehicleId: '', batteryIds: [], notes: '' });
      setDriverVehicles([]);
      
      // Reload data
      await loadInitialData();
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể tạo đơn walk-in';
      setError('Lỗi: ' + errorMessage);
      console.error('Create walk-in error:', e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = driverVehicles.find(v => v.vehicleId === formData.vehicleId || v.id === formData.vehicleId);
  const availableBatteriesForVehicle = selectedVehicle
    ? batteries.filter(b => b.type === selectedVehicle.batteryType) // b.type instead of b.model
    : batteries;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Tạo đơn Walk-in</h2>
        <p className="text-sm text-gray-600 mt-1">Tạo giao dịch đổi pin cho khách hàng đến trực tiếp (không đặt lịch trước)</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Driver & Vehicle Selection */}
          <div className="space-y-6">
            {/* Select Driver */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn tài xế <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.driverId}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0028b8] focus:border-transparent"
                required
              >
                <option value="">-- Chọn tài xế --</option>
                {drivers.map(driver => (
                  <option key={driver.userId || driver.id} value={driver.userId || driver.id}>
                    {driver.firstName} {driver.lastName} ({driver.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Vehicle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn xe <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0028b8] focus:border-transparent disabled:bg-gray-100"
                required
                disabled={!formData.driverId}
              >
                <option value="">-- Chọn xe --</option>
                {driverVehicles.map(vehicle => (
                  <option key={vehicle.vehicleId || vehicle.id} value={vehicle.vehicleId || vehicle.id}>
                    {vehicle.make} {vehicle.model} - {vehicle.licensePlate} (Pin: {vehicle.batteryType})
                  </option>
                ))}
              </select>
              {formData.driverId && driverVehicles.length === 0 && (
                <p className="mt-2 text-sm text-amber-600">Tài xế chưa đăng ký xe nào</p>
              )}
            </div>

            {/* Vehicle Info */}
            {selectedVehicle && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Thông tin xe</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>🚗 {selectedVehicle.make} {selectedVehicle.model}</p>
                  <p>🔢 Biển số: {selectedVehicle.licensePlate}</p>
                  <p>🔋 Loại pin: {selectedVehicle.batteryType}</p>
                  <p>⚡ Dung lượng: {selectedVehicle.batteryCapacity} kWh</p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0028b8] focus:border-transparent resize-none"
                placeholder="Ghi chú thêm về giao dịch (nếu có)..."
              />
            </div>
          </div>

          {/* Right Column: Battery Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn pin <span className="text-red-500">*</span>
            </label>
            
            {!formData.vehicleId ? (
              <div className="flex items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">Chọn xe để xem pin khả dụng</p>
              </div>
            ) : availableBatteriesForVehicle.length === 0 ? (
              <div className="flex items-center justify-center h-64 bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-amber-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-amber-700">Không có pin khả dụng phù hợp</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {availableBatteriesForVehicle.map(battery => (
                  <div
                    key={battery.batteryId || battery.id}
                    onClick={() => handleToggleBattery(battery.batteryId || battery.id)}
                    className={`
                      p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${formData.batteryIds.includes(battery.batteryId || battery.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{battery.model}</p>
                        <p className="text-sm text-gray-600">SN: {battery.serialNumber}</p>
                      </div>
                      {formData.batteryIds.includes(battery.batteryId || battery.id) && (
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.batteryIds.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  Đã chọn {formData.batteryIds.length} pin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              setFormData({ driverId: '', vehicleId: '', batteryIds: [], notes: '' });
              setSelectedDriver(null);
              setDriverVehicles([]);
              setError('');
              setSuccess('');
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đặt lại
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#0028b8] text-white rounded-lg hover:bg-[#001a8b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Đang tạo...' : 'Tạo đơn Walk-in'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWalkInTab;
