/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../../context/AuthContext';
import { getAllBatteryModels, getStaffBatteryInventoryPaginated, getCurrentStaffStation, getStaffBatteryTotalCount, getBatteryModelsTotalCount } from '../../../services/battery';
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
  
  // Pagination states
  const [batteryCurrentPage, setBatteryCurrentPage] = useState(1);
  const [batteryHasMore, setBatteryHasMore] = useState(true);
  const [modelCurrentPage, setModelCurrentPage] = useState(1);
  const [modelHasMore, setModelHasMore] = useState(true);
  
  // Total counts for tab display
  const [totalBatteryCount, setTotalBatteryCount] = useState(0);
  const [totalModelCount, setTotalModelCount] = useState(0);
  
  // Search states
  const [batterySearchQuery, setBatterySearchQuery] = useState('');
  const [batterySearchDateFrom, setBatterySearchDateFrom] = useState('');
  const [batterySearchDateTo, setBatterySearchDateTo] = useState('');
  const [batterySearchWarrantyFrom, setBatterySearchWarrantyFrom] = useState('');
  const [batterySearchWarrantyTo, setBatterySearchWarrantyTo] = useState('');
  const [modelSearchQuery, setModelSearchQuery] = useState('');

  // Load data when component mounts
  const loadData = async () => {
    setBatteryCurrentPage(1);
    setModelCurrentPage(1);
    await Promise.all([
      loadBatteries(1),
      loadBatteryModels(1),
      loadTotalCounts() // Load total counts for tab display
    ]);
  };

  // Load total counts for tab display
  const loadTotalCounts = async () => {
    try {
      const [batteryTotal, modelTotal] = await Promise.all([
        getStaffBatteryTotalCount().catch(() => 0),
        getBatteryModelsTotalCount().catch(() => 0)
      ]);
      
      setTotalBatteryCount(batteryTotal);
      setTotalModelCount(modelTotal);
      
      console.log(`Total counts: ${batteryTotal} batteries, ${modelTotal} models`);
    } catch (error) {
      console.error('Failed to load total counts:', error);
      // Set to current page counts as fallback
      setTotalBatteryCount(batteries.length);
      setTotalModelCount(batteryModels.length);
    }
  };

  // Load batteries for specific page
  const loadBatteries = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const result = await getStaffBatteryInventoryPaginated(page);
      setBatteries(result.batteries);
      setBatteryHasMore(result.hasMore);
      setBatteryCurrentPage(page);
      
      // Set station name from result
      if (result.stationInfo?.stationName) {
        setStationName(result.stationInfo.stationName);
      }
      
      console.log(`Loaded ${result.batteries.length} batteries for page ${page}`);
    } catch (e) {
      console.error('Failed to load batteries:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể tải pin';
      setError(`Không thể tải dữ liệu pin: ${errorMessage}`);
      setBatteries([]);
    } finally {
      setLoading(false);
    }
  };

  // Load battery models for specific page
  const loadBatteryModels = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const modelsData = await getAllBatteryModels(page);
      setBatteryModels(modelsData);
      setModelHasMore(modelsData.length === 10); // Backend LIST_SIZE = 10
      setModelCurrentPage(page);
      
      console.log(`Loaded ${modelsData.length} models for page ${page}`);
    } catch (e) {
      console.error('Failed to load battery models:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể tải models';
      setError(`Không thể tải danh sách models: ${errorMessage}`);
      setBatteryModels([]);
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Giá pin</label>
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
              Model pin ({totalModelCount || batteryModels.length})
            </button>
            <button
              onClick={() => setActiveTab('batteries')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'batteries'
                  ? 'border-[#0028b8] text-[#0028b8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pin trong trạm ({totalBatteryCount || batteries.length})
            </button>
          </nav>
        </div>

        {/* Tab Content: Battery Models */}
        {activeTab === 'models' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">
              Danh sách Model pin ({totalModelCount || batteryModels.length})
            </h3>
            
            {/* Search Section */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm theo Type / Manufacturer / Chemistry
                  </label>
                  <input
                    type="text"
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    placeholder="Nhập type, hãng sản xuất hoặc hóa chất..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setModelSearchQuery('')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>
            
            {batteryModels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <p>Chưa có thông tin loại pin</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batteryModels.filter(model => {
                  const searchLower = modelSearchQuery.toLowerCase();
                  return !modelSearchQuery ||
                    model.type?.toLowerCase().includes(searchLower) ||
                    model.manufacturer?.toLowerCase().includes(searchLower) ||
                    model.chemistry?.toLowerCase().includes(searchLower);
                }).map((model) => {
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
                        
                        {/* Compatible Vehicles */}
                        {model.compatibleVehicles && model.compatibleVehicles.length > 0 && (
                          <div className="pt-2 border-t mt-2">
                            <span className="text-gray-500 text-xs block mb-2">Xe tương thích:</span>
                            <div className="flex flex-wrap gap-1">
                              {model.compatibleVehicles.map((vehicle, vIdx) => (
                                <span 
                                  key={vIdx} 
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                >
                                  {vehicle}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Battery Models Pagination */}
            {!loading && batteryModels.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4">
                <div className="text-sm text-gray-500">
                  Trang {modelCurrentPage} - Hiển thị {batteryModels.length} models
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadBatteryModels(modelCurrentPage - 1)}
                    disabled={modelCurrentPage <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Trước
                  </button>
                  
                  {/* Show page numbers */}
                  {modelCurrentPage > 2 && (
                    <>
                      <button
                        onClick={() => loadBatteryModels(1)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        1
                      </button>
                      {modelCurrentPage > 3 && <span className="px-2 text-gray-400">...</span>}
                    </>
                  )}
                  
                  {modelCurrentPage > 1 && (
                    <button
                      onClick={() => loadBatteryModels(modelCurrentPage - 1)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {modelCurrentPage - 1}
                    </button>
                  )}
                  
                  <span className="px-3 py-1 text-sm bg-[#0028b8] text-white rounded font-medium">
                    {modelCurrentPage}
                  </span>
                  
                  {modelHasMore && (
                    <button
                      onClick={() => loadBatteryModels(modelCurrentPage + 1)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {modelCurrentPage + 1}
                    </button>
                  )}
                  
                  <button
                    onClick={() => loadBatteryModels(modelCurrentPage + 1)}
                    disabled={!modelHasMore}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Batteries at Station */}
        {activeTab === 'batteries' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">
              Pin trong trạm ({totalBatteryCount || batteries.length})
            </h3>

            {/* Search Section */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Text Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm theo Số serial / Model / Trạm
                  </label>
                  <input
                    type="text"
                    value={batterySearchQuery}
                    onChange={(e) => setBatterySearchQuery(e.target.value)}
                    placeholder="Nhập số serial, model hoặc tên trạm..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Clear Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setBatterySearchQuery('');
                      setBatterySearchDateFrom('');
                      setBatterySearchDateTo('');
                      setBatterySearchWarrantyFrom('');
                      setBatterySearchWarrantyTo('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
                
                {/* Manufacture Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày SX từ
                  </label>
                  <input
                    type="date"
                    value={batterySearchDateFrom}
                    onChange={(e) => setBatterySearchDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày SX đến
                  </label>
                  <input
                    type="date"
                    value={batterySearchDateTo}
                    onChange={(e) => setBatterySearchDateTo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Warranty Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hết BH từ
                  </label>
                  <input
                    type="date"
                    value={batterySearchWarrantyFrom}
                    onChange={(e) => setBatterySearchWarrantyFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hết BH đến
                  </label>
                  <input
                    type="date"
                    value={batterySearchWarrantyTo}
                    onChange={(e) => setBatterySearchWarrantyTo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {batteries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <p>Trạm này chưa có pin nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batteries.filter(battery => {
                  // Text search filter
                  const searchLower = batterySearchQuery.toLowerCase();
                  const matchesText = !batterySearchQuery || 
                    battery.serialNumber?.toLowerCase().includes(searchLower) ||
                    battery.type?.toLowerCase().includes(searchLower) ||
                    battery.currentStationName?.toLowerCase().includes(searchLower);
                  
                  // Manufacture date filter
                  let matchesManufactureDate = true;
                  if (batterySearchDateFrom || batterySearchDateTo) {
                    const mfgDate = battery.manufactureDate ? new Date(battery.manufactureDate) : null;
                    if (mfgDate) {
                      if (batterySearchDateFrom) {
                        const fromDate = new Date(batterySearchDateFrom);
                        if (mfgDate < fromDate) matchesManufactureDate = false;
                      }
                      if (batterySearchDateTo) {
                        const toDate = new Date(batterySearchDateTo);
                        if (mfgDate > toDate) matchesManufactureDate = false;
                      }
                    } else {
                      matchesManufactureDate = false;
                    }
                  }
                  
                  // Warranty date filter
                  let matchesWarrantyDate = true;
                  if (batterySearchWarrantyFrom || batterySearchWarrantyTo) {
                    const warrantyDate = battery.warrantyExpiryDate ? new Date(battery.warrantyExpiryDate) : null;
                    if (warrantyDate) {
                      if (batterySearchWarrantyFrom) {
                        const fromDate = new Date(batterySearchWarrantyFrom);
                        if (warrantyDate < fromDate) matchesWarrantyDate = false;
                      }
                      if (batterySearchWarrantyTo) {
                        const toDate = new Date(batterySearchWarrantyTo);
                        if (warrantyDate > toDate) matchesWarrantyDate = false;
                      }
                    } else {
                      matchesWarrantyDate = false;
                    }
                  }
                  
                  return matchesText && matchesManufactureDate && matchesWarrantyDate;
                }).map((battery) => {
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
                          <span className="text-gray-500">Giá pin:</span>
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
            
            {/* Battery Pagination */}
            {!loading && batteries.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4">
                <div className="text-sm text-gray-500">
                  Trang {batteryCurrentPage} - Hiển thị {batteries.length} pin
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadBatteries(batteryCurrentPage - 1)}
                    disabled={batteryCurrentPage <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Trước
                  </button>
                  
                  {/* Show page numbers */}
                  {batteryCurrentPage > 2 && (
                    <>
                      <button
                        onClick={() => loadBatteries(1)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        1
                      </button>
                      {batteryCurrentPage > 3 && <span className="px-2 text-gray-400">...</span>}
                    </>
                  )}
                  
                  {batteryCurrentPage > 1 && (
                    <button
                      onClick={() => loadBatteries(batteryCurrentPage - 1)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {batteryCurrentPage - 1}
                    </button>
                  )}
                  
                  <span className="px-3 py-1 text-sm bg-[#0028b8] text-white rounded font-medium">
                    {batteryCurrentPage}
                  </span>
                  
                  {batteryHasMore && (
                    <button
                      onClick={() => loadBatteries(batteryCurrentPage + 1)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {batteryCurrentPage + 1}
                    </button>
                  )}
                  
                  <button
                    onClick={() => loadBatteries(batteryCurrentPage + 1)}
                    disabled={!batteryHasMore}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatteryManagement;
