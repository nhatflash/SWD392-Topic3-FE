import API from './auth';

/**
 * Dashboard APIs for Admin
 * Get statistics and metrics data
 */

/**
 * Get dashboard swap price statistics
 * Role: ADMIN, STAFF (with station access)
 * @param {object} options
 * @param {string} options.type - Dashboard type: "DAY", "MONTH", "YEAR"  
 * @param {string} options.targetDate - Target date in ISO format (optional)
 * @returns {Promise<object>} Dashboard statistics with revenue and transaction data
 */
export async function getDashboardStats({ type = 'DAY', targetDate = null } = {}) {
  const params = new URLSearchParams();
  params.set('type', type);
  
  if (targetDate) {
    params.set('targetDate', targetDate);
  }
  
  const res = await API.get(`/api/station/swap-price?${params.toString()}`);
  return res?.data?.data;
}

/**
 * Get daily dashboard statistics (default)
 * @returns {Promise<object>} Today's dashboard stats
 */
export async function getDailyDashboard() {
  return getDashboardStats({ type: 'DAY' });
}

/**
 * Get monthly dashboard statistics
 * @returns {Promise<object>} This year's monthly breakdown
 */
export async function getMonthlyDashboard() {
  return getDashboardStats({ type: 'MONTH' });
}

/**
 * Get yearly dashboard statistics  
 * @returns {Promise<object>} This year's stats
 */
export async function getYearlyDashboard() {
  return getDashboardStats({ type: 'YEAR' });
}

/**
 * Get revenue chart data for different time periods
 * @param {string} period - Time period: "DAY", "MONTH", "YEAR"
 * @returns {Promise<object>} Chart data with labels and revenue values
 */
export async function getRevenueChartData(period = 'MONTH') {
  try {
    const data = await getDashboardStats({ type: period });
    
    // Transform backend data to chart format
    if (data?.details && Array.isArray(data.details)) {
      const labels = data.details.map(item => item.label || 'N/A');
      const revenues = data.details.map(item => item.revenue || 0);
      const transactions = data.details.map(item => item.transactions || 0);
      
      return {
        labels,
        datasets: [
          {
            label: 'Doanh thu (VND)',
            data: revenues,
            backgroundColor: 'rgba(0, 40, 184, 0.8)',
            borderColor: 'rgba(0, 40, 184, 1)',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Số giao dịch',
            data: transactions,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
            yAxisID: 'y1',
          }
        ]
      };
    }
    
    // Fallback with sample data based on period
    let fallbackLabels = [];
    switch (period) {
      case 'DAY':
        // Last 7 days
        fallbackLabels = ['6 ngày trước', '5 ngày trước', '4 ngày trước', '3 ngày trước', '2 ngày trước', 'Hôm qua', 'Hôm nay'];
        break;
      case 'YEAR':
        // Last 5 years
        const currentYear = new Date().getFullYear();
        fallbackLabels = Array.from({length: 5}, (_, i) => (currentYear - 4 + i).toString());
        break;
      default: // MONTH
        fallbackLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    }
    
    return {
      labels: fallbackLabels,
      datasets: [
        {
          label: 'Doanh thu (VND)',
          data: new Array(fallbackLabels.length).fill(0),
          backgroundColor: 'rgba(0, 40, 184, 0.8)',
          borderColor: 'rgba(0, 40, 184, 1)',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  } catch (error) {
    console.error('Failed to get revenue chart data:', error);
    // Return empty chart data on error
    const fallbackLabels = period === 'DAY' 
      ? ['6 ngày trước', '5 ngày trước', '4 ngày trước', '3 ngày trước', '2 ngày trước', 'Hôm qua', 'Hôm nay']
      : period === 'YEAR'
      ? Array.from({length: 5}, (_, i) => (new Date().getFullYear() - 4 + i).toString())
      : ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
      
    return {
      labels: fallbackLabels,
      datasets: [
        {
          label: 'Doanh thu (VND)',
          data: new Array(fallbackLabels.length).fill(0),
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgba(156, 163, 175, 1)',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  }
}