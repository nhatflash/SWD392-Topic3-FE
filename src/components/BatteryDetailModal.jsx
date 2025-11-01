/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { getSoHChartData, getSoHStats, predictSoHThreshold, recordSoHDataPoint } from '../services/sohTracking';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { getAccessToken } from '../services/auth';
import SoHChart from './SoHChart';

const BatteryDetailModal = ({ batteryState, onClose, stationId, enableRealtime = true }) => {
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'health'
  const [currentState, setCurrentState] = useState(batteryState);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!batteryState) return;
    setCurrentState(batteryState);

    // Load SoH tracking data
    const data = getSoHChartData(batteryState.batteryId, 50);
    const statsData = getSoHStats(batteryState.batteryId);
    const predictionData = predictSoHThreshold(batteryState.batteryId, 60);

    setChartData(data);
    setStats(statsData);
    setPrediction(predictionData);
  }, [batteryState]);

  // Optional realtime updates via SSE (use station stream and filter by batteryId)
  useEffect(() => {
    if (!enableRealtime || !stationId || !batteryState?.batteryId) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const url = `${baseURL}/api/battery-monitoring/stream/${stationId}`;

      const es = new EventSourcePolyfill(url, {
        headers: { Authorization: `Bearer ${token}` },
        heartbeatTimeout: 60000,
      });

      es.addEventListener('battery-update', (event) => {
        try {
          const state = JSON.parse(event.data);
          if (String(state.batteryId) !== String(batteryState.batteryId)) return;

          setCurrentState(state);
          if (state.stateOfHealth != null) {
            try { recordSoHDataPoint(state.batteryId, state.stateOfHealth, state.status); } catch {}
          }

          // refresh chart and stats lightly
          const data = getSoHChartData(state.batteryId, 50);
          setChartData(data);
          setStats(getSoHStats(state.batteryId));
          setPrediction(predictSoHThreshold(state.batteryId, 60));
        } catch {}
      });

      es.onerror = () => {
        try { es.close(); } catch {}
      };

      eventSourceRef.current = es;
      return () => { try { es.close(); } catch {} };
    } catch {
      // ignore realtime errors in modal
    }
  }, [enableRealtime, stationId, batteryState?.batteryId]);

  if (!batteryState) return null;

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      FULL: 'bg-green-100 text-green-800',
      IN_USE: 'bg-blue-100 text-blue-800',
      CHARGING: 'bg-yellow-100 text-yellow-800',
      MAINTENANCE: 'bg-orange-100 text-orange-800',
      FAULTY: 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'degrading': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'degrading': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Chi tiết pin: {currentState.serialNumber}</h2>
            <p className="text-sm text-gray-500 mt-1">{currentState.batteryType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Đóng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'info'
                ? 'border-[#0028b8] text-[#0028b8]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Thông tin
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'health'
                ? 'border-[#0028b8] text-[#0028b8]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sức khỏe pin (SoH)
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Status and Charge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                  <span className={`inline-block px-3 py-1.5 text-sm font-semibold rounded-full ${getStatusBadgeClass(currentState.status)}`}>
                    {currentState.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mức sạc</label>
                  <p className="text-3xl font-bold text-gray-900">{currentState.chargeLevel}%</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nhiệt độ</label>
                  <p className={`text-2xl font-bold ${currentState.temperature > 50 ? 'text-red-600' : 'text-gray-900'}`}>
                    {currentState.temperature} °C
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Điện áp</label>
                  <p className="text-2xl font-bold text-gray-900">{currentState.voltage} V</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Dòng điện</label>
                  <p className="text-2xl font-bold text-gray-900">{currentState.current} A</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Công suất</label>
                  <p className="text-2xl font-bold text-gray-900">{currentState.powerKwh} kWh</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Sức khỏe pin (SoH)</label>
                  <p className={`text-2xl font-bold ${currentState.stateOfHealth < 60 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {currentState.stateOfHealth}%
                  </p>
                </div>
              </div>

              {/* Charging Info */}
              {currentState.status === 'CHARGING' && currentState.estimatedMinutesToFull > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <label className="text-sm font-medium text-yellow-800">Thời gian sạc đầy dự kiến</label>
                  </div>
                  <p className="text-xl font-bold text-yellow-900">
                    ~{Math.floor(currentState.estimatedMinutesToFull / 60)}h {currentState.estimatedMinutesToFull % 60}m
                  </p>
                </div>
              )}

              {/* Alert */}
              {currentState.abnormal && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">Cảnh báo</label>
                      <p className="text-red-900 font-semibold">{currentState.alertLevel}: {currentState.abnormalReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-6">
              {/* Stats Summary */}
              {stats && stats.dataPoints > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-blue-600 mb-1">Số điểm dữ liệu</label>
                    <p className="text-2xl font-bold text-blue-900">{stats.dataPoints}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-green-600 mb-1">SoH trung bình</label>
                    <p className="text-2xl font-bold text-green-900">{stats.avgSoH}%</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-orange-600 mb-1">SoH thấp nhất</label>
                    <p className="text-2xl font-bold text-orange-900">{stats.minSoH}%</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-purple-600 mb-1">Xu hướng</label>
                    <p className={`text-2xl font-bold ${getTrendColor(stats.trend)}`}>
                      {getTrendIcon(stats.trend)} {stats.trend === 'improving' ? 'Tốt lên' : stats.trend === 'degrading' ? 'Xuống' : stats.trend === 'stable' ? 'Ổn định' : 'Chưa rõ'}
                    </p>
                  </div>
                </div>
              )}

              {/* Degradation Rate */}
              {stats && stats.degradationRate != null && (
                <div className={`rounded-lg p-4 ${stats.degradationRate < 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <label className="block text-sm font-medium mb-1 ${stats.degradationRate < 0 ? 'text-red-700' : 'text-green-700'}">
                    Tốc độ suy giảm SoH
                  </label>
                  <p className={`text-xl font-bold ${stats.degradationRate < 0 ? 'text-red-900' : 'text-green-900'}`}>
                    {stats.degradationRate > 0 ? '+' : ''}{stats.degradationRate.toFixed(4)}% / ngày
                  </p>
                </div>
              )}

              {/* Prediction */}
              {prediction && prediction.willReachThreshold && prediction.estimatedDays > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-yellow-700 mb-1">Dự đoán bảo trì</label>
                      <p className="text-yellow-900">
                        SoH có thể giảm xuống <strong>60%</strong> trong khoảng <strong>{prediction.estimatedDays} ngày</strong>
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Ngày dự kiến: {prediction.estimatedDate.toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-4">Biểu đồ SoH theo thời gian</h3>
                <SoHChart batteryId={batteryState.batteryId} data={chartData} width={700} height={350} />
              </div>

              {chartData && chartData.data.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Chưa có đủ dữ liệu để hiển thị biểu đồ</p>
                  <p className="text-sm mt-2">Dữ liệu sẽ được thu thập tự động khi giám sát realtime</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#0028b8] text-white rounded-md hover:bg-[#001a8b] transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatteryDetailModal;
