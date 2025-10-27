/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../../context/AuthContext';
import { getAllBatteryModels, getAllBatteries } from '../../../services/battery';
import { getOperationalStations } from '../../../services/station';
import Header from '../../../components/Header';

const BatteryManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batteryModels, setBatteryModels] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [stationName, setStationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('models'); // 'models', 'batteries'

  // Load data when component mounts
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load models and batteries in parallel
      const [modelsData, batteriesData, stationsData] = await Promise.all([
        getAllBatteryModels().catch(() => []),
        getAllBatteries().catch(() => []),
        getOperationalStations().catch(() => [])
      ]);

      setBatteryModels(modelsData);

      // Try to find staff's station name
      // For now, we'll need to determine which station this staff belongs to
      // If user object has station info, use it; otherwise filter might show all batteries
      let staffStationName = null;
      
      // Check if user has station information (this depends on your backend user response)
      if (user?.stationName) {
        staffStationName = user.stationName;
      } else if (user?.stationId && stationsData.length > 0) {
        const staffStation = stationsData.find(s => 
          String(s.id) === String(user.stationId) || 
          String(s.stationId) === String(user.stationId)
        );
        if (staffStation) {
          staffStationName = staffStation.name;
        }
      }

      setStationName(staffStationName || '');

      // Filter batteries for this station
      let filteredBatteries = batteriesData;
      if (staffStationName) {
        filteredBatteries = batteriesData.filter(b => {
          if (!b?.currentStationName) return false;
          const batteryStation = String(b.currentStationName).trim().toLowerCase();
          const currentStation = String(staffStationName).trim().toLowerCase();
          return batteryStation === currentStation;
        });
      }

      setBatteries(filteredBatteries);
    } catch (e) {
      console.error('Failed to load battery management data:', e);
      setError(e?.response?.data?.message || e?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewBatteryDetail = (battery) => {
    Swal.fire({
      title: 'Chi tiết pin',
      width: '700px',
      html: `
        <div class="space-y-4 text-left">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Số serial</label>
              <p class="text-gray-900 font-mono">${battery.serialNumber}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Loại pin</label>
              <p class="text-gray-900">${battery.type}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <p class="text-gray-900">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                  battery.status === 'FULL' ? 'bg-green-100 text-green-800' :
                  battery.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                  battery.status === 'CHARGING' ? 'bg-yellow-100 text-yellow-800' :
                  battery.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' :
                  battery.status === 'FAULTY' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }">
                  ${battery.status}
                </span>
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trạm hiện tại</label>
              <p class="text-gray-900">${battery.currentStationName || 'N/A'}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dung lượng</label>
              <p class="text-gray-900 font-semibold">${battery.capacityKwh} kWh</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mức sạc hiện tại</label>
              <p class="text-gray-900 font-semibold">${battery.currentChargePercentage || 0}%</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Chu kỳ sạc</label>
              <p class="text-gray-900">${battery.totalChargeCycles || 0}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Lượt đổi</label>
              <p class="text-gray-900">${battery.totalSwapCount || 0}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ngày sản xuất</label>
              <p class="text-gray-900">${battery.manufactureDate || 'N/A'}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hết bảo hành</label>
              <p class="text-gray-900">${battery.warrantyExpiryDate || 'N/A'}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Giá thuê</label>
            <p class="font-semibold text-green-600">
              ${new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(battery.rentalPrice || 0)}
            </p>
          </div>

          ${battery.notes ? `
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <p class="text-gray-900 text-sm italic">${battery.notes}</p>
            </div>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Đóng',
      confirmButtonColor: '#0028b8'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00b894] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <Header />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Quay lại"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold">Quản lý pin</h1>
            <p className="text-sm text-gray-500">
              {stationName ? `Trạm: ${stationName}` : 'Xem thông tin model và pin'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('models')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'models'
                  ? 'border-[#0028b8] text-[#0028b8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Model pin ({batteryModels.length})
            </button>
            <button
              onClick={() => setActiveTab('batteries')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'batteries'
                  ? 'border-[#0028b8] text-[#0028b8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pin trong trạm ({batteries.length})
            </button>
          </nav>
        </div>

        {/* Tab Content: Battery Models */}
        {activeTab === 'models' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">
              Danh sách Model pin ({batteryModels.length})
            </h3>
            
            {batteryModels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <p>Chưa có thông tin loại pin</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batteryModels.map((model) => {
                  const modelId = model.modelId || model.batteryModelId || model.id;
                  return (
                    <div key={modelId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="mb-3">
                        <h4 className="font-semibold text-lg text-[#0028b8]">{model.type}</h4>
                        <p className="text-sm text-gray-600">{model.manufacturer}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Công nghệ:</span>
                          <span className="font-medium">{model.chemistry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Trọng lượng:</span>
                          <span className="font-medium">{model.weightKg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bảo hành:</span>
                          <span className="font-medium">{model.warrantyMonths || 0} tháng</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Công suất sạc:</span>
                          <span className="font-medium">{model.maxChargePowerKwh || 0} kWh</span>
                        </div>
                        {model.minSohThreshold && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Ngưỡng SoH:</span>
                            <span className="font-medium">{model.minSohThreshold}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Batteries at Station */}
        {activeTab === 'batteries' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">
              Pin trong trạm ({batteries.length})
            </h3>

            {batteries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <p>Trạm này chưa có pin nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batteries.map((battery) => {
                  const key = battery.batteryId || battery.id;
                  return (
                    <div 
                      key={key} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewBatteryDetail(battery)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{battery.serialNumber}</h4>
                          <p className="text-sm text-gray-600">{battery.type}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                          battery.status === 'FULL' ? 'bg-green-100 text-green-800' :
                          battery.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                          battery.status === 'CHARGING' ? 'bg-yellow-100 text-yellow-800' :
                          battery.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' :
                          battery.status === 'FAULTY' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {battery.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dung lượng:</span>
                          <span className="font-semibold">{battery.capacityKwh} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Mức sạc:</span>
                          <span className="font-semibold">{battery.currentChargePercentage || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Chu kỳ sạc:</span>
                          <span>{battery.totalChargeCycles || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Lượt đổi:</span>
                          <span>{battery.totalSwapCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Giá thuê:</span>
                          <span className="font-semibold text-green-600">
                            {new Intl.NumberFormat('vi-VN', { 
                              style: 'currency', 
                              currency: 'VND' 
                            }).format(battery.rentalPrice || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <button className="text-[#0028b8] text-sm hover:underline">
                          Xem chi tiết →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatteryManagement;
