import React, { useState, useEffect } from 'react';
import { getAllUnconfirmedSwaps, getSwapStatusText, getSwapTypeText } from '../../../services/swapTransaction';
import { getVehiclesByDriverId } from '../../../services/vehicle';
import { getStationById } from '../../../services/station';
import { getUsers } from '../../../services/admin';

const SwapHistoryTab = () => {
  const [swaps, setSwaps] = useState([]);
  const [filteredSwaps, setFilteredSwaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  useEffect(() => {
    loadSwaps();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, swaps]);

  const loadSwaps = async () => {
    try {
      setLoading(true);
      setError('');
      // This gets all swaps from station, including completed/canceled
      const [data, usersData] = await Promise.all([
        getAllUnconfirmedSwaps(),
        getUsers({ page: 1, size: 100 })
      ]);
      
      // Enrich with details
      const enriched = await Promise.all(
        data.map(async (swap) => {
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
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Không thể tải dữ liệu';
      setError('Lỗi: ' + errorMessage);
      console.error('Load history error:', e?.response?.data || e);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...swaps];

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(s => s.type === filters.type);
    }

    // Filter by search (code, driver name, license plate)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        (s.code || '').toLowerCase().includes(search) ||
        (s.driverInfo?.firstName || '').toLowerCase().includes(search) ||
        (s.driverInfo?.email || '').toLowerCase().includes(search) ||
        (s.vehicleInfo?.licensePlate || '').toLowerCase().includes(search)
      );
    }

    setFilteredSwaps(filtered);
  };

  const getStatusBadge = (status) => {
    const badges = {
      SCHEDULED: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800' },
      IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800' },
      CANCELED: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {getSwapStatusText(status)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const badges = {
      SCHEDULED: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      WALK_IN: { bg: 'bg-orange-100', text: 'text-orange-800' },
    };
    const badge = badges[type] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {getSwapTypeText(type)}
      </span>
    );
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
        <h2 className="text-xl font-semibold text-gray-900">Lịch sử giao dịch</h2>
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

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
          <input
            type="text"
            placeholder="Mã đơn, tên khách, biển số..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0028b8] focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0028b8] focus:border-transparent"
          >
            <option value="">Tất cả</option>
            <option value="SCHEDULED">Đã đặt lịch</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELED">Đã hủy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0028b8] focus:border-transparent"
          >
            <option value="">Tất cả</option>
            <option value="SCHEDULED">Đặt lịch trước</option>
            <option value="WALK_IN">Walk-in</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Hiển thị {filteredSwaps.length} / {swaps.length} giao dịch
      </div>

      {/* Swaps Table */}
      {filteredSwaps.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy giao dịch</h3>
          <p className="mt-1 text-sm text-gray-500">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSwaps.map(swap => (
                <tr key={swap.transactionId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{swap.code || swap.transactionId?.slice(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {swap.driverInfo?.firstName && swap.driverInfo?.lastName 
                        ? `${swap.driverInfo.firstName} ${swap.driverInfo.lastName}` 
                        : swap.driverInfo?.email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {swap.vehicleInfo?.make || ''} {swap.vehicleInfo?.model || ''}
                    </div>
                    <div className="text-sm text-gray-500">{swap.vehicleInfo?.licensePlate || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getTypeBadge(swap.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(swap.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {swap.scheduledTime && new Date(swap.scheduledTime).toLocaleString('vi-VN')}
                    </div>
                    {swap.swapEndTime && (
                      <div className="text-xs text-gray-500">
                        Hoàn thành: {new Date(swap.swapEndTime).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {swap.swapPrice ? `${Number(swap.swapPrice).toLocaleString('vi-VN')} đ` : 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SwapHistoryTab;
