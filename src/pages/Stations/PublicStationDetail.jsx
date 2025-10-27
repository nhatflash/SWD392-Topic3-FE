/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOperationalStations } from '../../services/station';
import { getAllBatteryModels, getAllBatteries } from '../../services/battery';

const PublicStationDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [batteries, setBatteries] = useState([]);
  const [batteryModels, setBatteryModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'batteries', 'models'

  const loadStationDetail = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [stations, modelsData, batteriesData] = await Promise.all([
        getOperationalStations(),
        getAllBatteryModels().catch(() => []),
        getAllBatteries().catch(() => [])
      ]);
      
      // Find station by ID (BE uses 'id' field from BaseEntity)
      const foundStation = stations.find(s => 
        String(s.id) === String(id) || String(s.stationId) === String(id)
      );
      
      if (!foundStation) {
        setError('Không tìm thấy trạm hoặc trạm không hoạt động');
        setLoading(false);
        return;
      }
      
      setStation(foundStation);
      setBatteryModels(modelsData);

      // Filter batteries for this station by matching currentStationName to station.name
      const stationBatteries = (batteriesData || []).filter(b => {
        if (!b?.currentStationName || !foundStation?.name) return false;
        const batteryStation = String(b.currentStationName).trim().toLowerCase();
        const currentStation = String(foundStation.name).trim().toLowerCase();
        return batteryStation === currentStation;
      });
      setBatteries(stationBatteries);
    } catch (e) {
      console.error('Failed to load station details:', e);
      setError(e?.response?.data?.message || e?.message || 'Không thể tải thông tin trạm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadStationDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#00b894] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (!station) {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Quay lại"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold">Chi tiết trạm</h1>
          <p className="text-sm text-gray-500">Thông tin chi tiết về trạm và các loại pin có sẵn</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'info'
                ? 'border-[#0028b8] text-[#0028b8]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thông tin trạm
          </button>
          <button
            onClick={() => setActiveTab('batteries')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'batteries'
                ? 'border-[#0028b8] text-[#0028b8]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pin tại trạm ({batteries.length})
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'models'
                ? 'border-[#0028b8] text-[#0028b8]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Loại pin hỗ trợ ({batteryModels.length})
          </button>
        </nav>
      </div>

      {/* Tab Content: Station Information */}
      {activeTab === 'info' && (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        {station.imageUrl && (
          <div className="relative h-64">
            <img 
              src={station.imageUrl} 
              alt={station.name}
              className="w-full h-full object-cover"
            />
            <span className={`absolute top-4 right-4 px-3 py-1 text-sm font-semibold rounded-full ${
              station.status === 'OPERATIONAL' 
                ? 'bg-green-100 text-green-700' 
                : station.status === 'MAINTENANCE' 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {station.status}
            </span>
          </div>
        )}
        
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{station.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                <p className="text-gray-900">{station.address}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả</label>
                <p className="text-gray-900">{station.description || 'Không có mô tả'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Giờ mở cửa</label>
                  <p className="text-gray-900">{station.openingTime}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Giờ đóng cửa</label>
                  <p className="text-gray-900">{station.closingTime}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tổng dung lượng</label>
                  <p className="text-gray-900 text-lg font-semibold">{station.totalCapacity} pin</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dung lượng hiện tại</label>
                  <p className="text-gray-900 text-lg font-semibold">{station.currentCapacity} pin</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tổng vị trí đổi</label>
                  <p className="text-gray-900 text-lg font-semibold">{station.totalSwapBays}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Vị trí trống</label>
                  <p className="text-gray-900 text-lg font-semibold">{station.idleSwapBays}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                <p className="text-gray-900">{station.contactPhone || 'Chưa có'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Email liên hệ</label>
                <p className="text-gray-900">{station.contactEmail || 'Chưa có'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Tab Content: Battery Models */}
      {activeTab === 'models' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">
            Các loại pin hỗ trợ ({batteryModels.length})
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
              {batteryModels.map((model) => (
                <div key={model.modelId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Batteries at Station */}
      {activeTab === 'batteries' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">
            Pin tại trạm ({batteries.length})
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
                  <div key={key} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
                      {battery.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 italic">{battery.notes}</p>
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
    </div>
  );
};

export default PublicStationDetail;
