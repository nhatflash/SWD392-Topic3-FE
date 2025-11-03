import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RevenueChart = ({ chartData, loading = false, error = null, selectedPeriod = 'MONTH', onPeriodChange }) => {
  
  // Get dynamic title based on period
  const getChartTitle = () => {
    switch (selectedPeriod) {
      case 'DAY':
        return 'Biểu đồ doanh thu theo ngày';
      case 'YEAR':
        return 'Biểu đồ doanh thu theo năm';
      default:
        return 'Biểu đồ doanh thu theo tháng';
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: getChartTitle(),
        font: {
          size: 16,
          weight: 'bold',
          family: 'Inter, sans-serif'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (datasetLabel.includes('Doanh thu')) {
              return `${datasetLabel}: ${new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(value)}`;
            }
            
            return `${datasetLabel}: ${value.toLocaleString('vi-VN')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, sans-serif'
          },
          color: '#6b7280'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, sans-serif'
          },
          color: '#6b7280',
          callback: function(value) {
            return new Intl.NumberFormat('vi-VN', {
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(value) + ' VND';
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, sans-serif'
          },
          color: '#6b7280',
          callback: function(value) {
            return value.toLocaleString('vi-VN');
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0028b8] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Đang tải biểu đồ doanh thu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">Không thể tải biểu đồ</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500">Chưa có dữ liệu biểu đồ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Period Selection Dropdown */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Báo cáo doanh thu</h3>
        {onPeriodChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-sm text-gray-600">Xem theo:</label>
            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white hover:border-gray-400 focus:border-[#0028b8] focus:ring-1 focus:ring-[#0028b8] outline-none transition-colors"
            >
              <option value="DAY">Ngày</option>
              <option value="MONTH">Tháng (12 tháng)</option>
              <option value="YEAR">Năm</option>
            </select>
          </div>
        )}
      </div>
      
      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Chart summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Tổng doanh thu</p>
            <p className="text-lg font-bold text-[#0028b8]">
              {chartData.datasets[0]?.data 
                ? new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(chartData.datasets[0].data.reduce((sum, val) => sum + val, 0))
                : '0 VND'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {selectedPeriod === 'DAY' ? 'Ngày cao nhất' : 
               selectedPeriod === 'YEAR' ? 'Năm cao nhất' : 
               'Tháng cao nhất'}
            </p>
            <p className="text-lg font-bold text-green-600">
              {(() => {
                if (!chartData.datasets[0]?.data || chartData.datasets[0].data.length === 0) return 'N/A';
                const maxValue = Math.max(...chartData.datasets[0].data);
                if (maxValue === 0) return 'Chưa có dữ liệu';
                const maxIndex = chartData.datasets[0].data.indexOf(maxValue);
                return chartData.labels[maxIndex] || 'N/A';
              })()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {selectedPeriod === 'DAY' ? 'Trung bình/ngày' : 
               selectedPeriod === 'YEAR' ? 'Trung bình/năm' : 
               'Trung bình/tháng'}
            </p>
            <p className="text-lg font-bold text-orange-600">
              {(() => {
                if (!chartData.datasets[0]?.data || chartData.datasets[0].data.length === 0) return '0 VND';
                
                const revenues = chartData.datasets[0].data;
                const totalRevenue = revenues.reduce((sum, val) => sum + val, 0);
                
                // Count months with revenue > 0 instead of all months
                const monthsWithRevenue = revenues.filter(revenue => revenue > 0).length;
                
                if (monthsWithRevenue === 0) return '0 VND';
                
                const averageRevenue = totalRevenue / monthsWithRevenue;
                
                return new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(averageRevenue);
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;