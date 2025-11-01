import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getOperationalStations, getStationById } from '../../../services/station';
import { createScheduledSwap } from '../../../services/swapTransaction';
import { getUserVehicles } from '../../../services/vehicle';
import { getBatteriesByStationAndStatus } from '../../../services/battery';

export default function BookSwap() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedVehicle = location.state?.vehicle;

  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [availableBatteries, setAvailableBatteries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    vehicleId: preselectedVehicle?.id || preselectedVehicle?.vehicleId || '',
    stationId: '',
    scheduledTime: '',
    notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.stationId) {
      loadStationBatteries(formData.stationId);
    }
  }, [formData.stationId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, stationsData] = await Promise.all([
        getUserVehicles().catch(err => {
          console.error('Error loading vehicles:', err);
          return [];
        }),
        getOperationalStations().catch(err => {
          console.error('Error loading stations:', err);
          // Backend error with average_rating column - show user-friendly message
          if (err.response?.data?.message?.includes('average_rating')) {
            Swal.fire({
              icon: 'warning',
              title: 'Lỗi cơ sở dữ liệu',
              text: 'Backend đang gặp lỗi database (cột average_rating). Vui lòng liên hệ admin để fix migration.',
              footer: '<small>Tip: Kiểm tra schema trong database có cột average_rating chưa</small>'
            });
          }
          return [];
        })
      ]);
      setVehicles(vehiclesData);
      setStations(stationsData);
      
      if (stationsData.length === 0 && vehiclesData.length > 0) {
        Swal.fire({
          icon: 'info',
          title: 'Không có trạm nào',
          text: 'Hiện không có trạm nào đang hoạt động. Vui lòng thử lại sau.'
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStationBatteries = async (stationId) => {
    try {
      const batteries = await getBatteriesByStationAndStatus(stationId, 'FULL', 0);
      setAvailableBatteries(batteries);
      const station = await getStationById(stationId);
      setSelectedStation(station);
    } catch (error) {
      console.error('Error loading station batteries:', error);
      setAvailableBatteries([]);
      setSelectedStation(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate vehicle battery type matches station
    const selectedVehicle = vehicles.find(v => 
      (v.id || v.vehicleId) === formData.vehicleId
    );
    
    if (!selectedVehicle) {
      Swal.fire('Lỗi', 'Vui lòng chọn xe', 'error');
      return;
    }

    const vehicleBatteryType = selectedVehicle.batteryType?.value || selectedVehicle.batteryType;
    const hasMatchingBatteries = availableBatteries.some(b => 
      (b.model?.type?.value || b.model?.type || b.batteryType) === vehicleBatteryType
    );

    if (availableBatteries.length === 0 || !hasMatchingBatteries) {
      Swal.fire({
        icon: 'warning',
        title: 'Không có pin phù hợp',
        text: `Trạm này hiện không có pin loại ${vehicleBatteryType} sẵn sàng.`,
        confirmButtonText: 'Đồng ý'
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Xác nhận đặt lịch',
        html: `
          <div class="text-left">
            <p><strong>Xe:</strong> ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.licensePlate})</p>
            <p><strong>Trạm:</strong> ${selectedStation?.name}</p>
            <p><strong>Thời gian:</strong> ${new Date(formData.scheduledTime).toLocaleString('vi-VN')}</p>
            <p><strong>Pin cần:</strong> ${selectedVehicle.batteryCapacity} pin loại ${vehicleBatteryType}</p>
            ${formData.notes ? `<p><strong>Ghi chú:</strong> ${formData.notes}</p>` : ''}
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Đặt lịch',
        cancelButtonText: 'Hủy'
      });

      if (result.isConfirmed) {
        await createScheduledSwap(formData);
        
        Swal.fire({
          icon: 'success',
          title: 'Đặt lịch thành công!',
          text: 'Vui lòng đến trạm đúng giờ. Nhân viên sẽ xác nhận và chuẩn bị pin cho bạn.',
          confirmButtonText: 'Về trang chủ'
        }).then(() => {
          navigate('/');
        });
      }
    } catch (error) {
      console.error('Error creating swap:', error);
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể đặt lịch', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  const selectedVehicle = vehicles.find(v => 
    (v.id || v.vehicleId) === formData.vehicleId
  );

  const minDateTime = new Date();
  minDateTime.setHours(minDateTime.getHours() + 1); // Tối thiểu 1 giờ sau
  const minDateTimeString = minDateTime.toISOString().slice(0, 16);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Đặt Lịch Thay Pin</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Vehicle */}
          <div>
            <label className="block text-sm font-medium mb-2">Chọn xe *</label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleInputChange}
              required
              className="w-full border rounded-lg px-4 py-3 text-base"
            >
              <option value="">-- Chọn xe --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id || vehicle.vehicleId} value={vehicle.id || vehicle.vehicleId}>
                  {vehicle.make} {vehicle.model} - {vehicle.licensePlate} 
                  (Pin: {vehicle.batteryType?.value || vehicle.batteryType})
                </option>
              ))}
            </select>
            {vehicles.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Bạn chưa có xe. <button type="button" onClick={() => navigate('/driver/vehicles')} className="underline">Đăng ký xe ngay</button>
              </p>
            )}
          </div>

          {/* Select Station */}
          <div>
            <label className="block text-sm font-medium mb-2">Chọn trạm *</label>
            <select
              name="stationId"
              value={formData.stationId}
              onChange={handleInputChange}
              required
              disabled={!formData.vehicleId}
              className="w-full border rounded-lg px-4 py-3 text-base disabled:bg-gray-100"
            >
              <option value="">-- Chọn trạm --</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} - {station.address}
                  {station.averageRating && ` ⭐${station.averageRating.rate || station.averageRating}`} 
                  ({station.currentCapacity}/{station.totalCapacity} pin)
                </option>
              ))}
            </select>
          </div>

          {/* Station Info */}
          {selectedStation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{selectedStation.name}</h3>
                {selectedStation.averageRating && (
                  <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
                    <span className="text-yellow-600">⭐</span>
                    <span className="font-semibold text-yellow-700">
                      {selectedStation.averageRating.rate || selectedStation.averageRating}/5
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <p><span className="font-medium">Địa chỉ:</span> {selectedStation.address}</p>
                <p><span className="font-medium">Giờ mở cửa:</span> {selectedStation.openingTime} - {selectedStation.closingTime}</p>
                <p><span className="font-medium">Pin sẵn sàng:</span> {availableBatteries.length} pin</p>
                <p><span className="font-medium">Bãi đổi:</span> {selectedStation.idleSwapBays}/{selectedStation.totalSwapBays} trống</p>
                {selectedStation.contactPhone && (
                  <p><span className="font-medium">Điện thoại:</span> {selectedStation.contactPhone}</p>
                )}
              </div>
              {selectedVehicle && (
                <div className="mt-3 pt-3 border-t border-blue-300">
                  {availableBatteries.length > 0 ? (
                    <p className="text-green-700 font-medium">
                      ✓ Trạm có {availableBatteries.filter(b => 
                        (b.model?.type?.value || b.model?.type || b.batteryType) === (selectedVehicle.batteryType?.value || selectedVehicle.batteryType)
                      ).length} pin loại {selectedVehicle.batteryType?.value || selectedVehicle.batteryType} sẵn sàng
                    </p>
                  ) : (
                    <p className="text-red-700 font-medium">
                      ✗ Trạm hiện không có pin loại {selectedVehicle.batteryType?.value || selectedVehicle.batteryType}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-medium mb-2">Thời gian đặt lịch *</label>
            <input
              type="datetime-local"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleInputChange}
              min={minDateTimeString}
              required
              className="w-full border rounded-lg px-4 py-3 text-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Vui lòng đặt lịch trước ít nhất 1 giờ
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Ghi chú (tùy chọn)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full border rounded-lg px-4 py-3 text-base"
              placeholder="Thêm ghi chú cho nhân viên (nếu có)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-lg transition text-base"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={!formData.vehicleId || !formData.stationId || availableBatteries.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Đặt lịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
