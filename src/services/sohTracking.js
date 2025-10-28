/**
 * Battery State of Health (SoH) Tracking Service
 * Tracks SoH degradation over time for battery health monitoring
 */

const SOH_HISTORY_KEY = 'batterySOHHistory';
const MAX_HISTORY_POINTS = 100; // Keep last 100 data points per battery

/**
 * Get SoH history for a specific battery from localStorage
 * @param {string} batteryId - Battery UUID
 * @returns {Array} Array of {timestamp, soh, status} objects
 */
export function getSoHHistory(batteryId) {
  try {
    const allHistory = JSON.parse(localStorage.getItem(SOH_HISTORY_KEY) || '{}');
    return allHistory[batteryId] || [];
  } catch (e) {
    console.error('Failed to get SoH history:', e);
    return [];
  }
}

/**
 * Record a new SoH data point for a battery
 * @param {string} batteryId - Battery UUID
 * @param {number} soh - State of Health percentage (0-100)
 * @param {string} status - Battery status (CHARGING, FULL, etc.)
 */
export function recordSoHDataPoint(batteryId, soh, status) {
  try {
    const allHistory = JSON.parse(localStorage.getItem(SOH_HISTORY_KEY) || '{}');
    const batteryHistory = allHistory[batteryId] || [];
    
    // Add new data point
    const newPoint = {
      timestamp: Date.now(),
      soh: parseFloat(soh),
      status
    };
    
    batteryHistory.push(newPoint);
    
    // Keep only last N points to avoid localStorage bloat
    if (batteryHistory.length > MAX_HISTORY_POINTS) {
      batteryHistory.shift();
    }
    
    allHistory[batteryId] = batteryHistory;
    localStorage.setItem(SOH_HISTORY_KEY, JSON.stringify(allHistory));
    
    return newPoint;
  } catch (e) {
    console.error('Failed to record SoH data point:', e);
    return null;
  }
}

/**
 * Clear SoH history for a specific battery or all batteries
 * @param {string} batteryId - Battery UUID (optional, clears all if not provided)
 */
export function clearSoHHistory(batteryId = null) {
  try {
    if (batteryId) {
      const allHistory = JSON.parse(localStorage.getItem(SOH_HISTORY_KEY) || '{}');
      delete allHistory[batteryId];
      localStorage.setItem(SOH_HISTORY_KEY, JSON.stringify(allHistory));
    } else {
      localStorage.removeItem(SOH_HISTORY_KEY);
    }
  } catch (e) {
    console.error('Failed to clear SoH history:', e);
  }
}

/**
 * Get SoH statistics for a battery
 * @param {string} batteryId - Battery UUID
 * @returns {Object} Stats including min, max, avg, trend
 */
export function getSoHStats(batteryId) {
  const history = getSoHHistory(batteryId);
  
  if (history.length === 0) {
    return {
      dataPoints: 0,
      minSoH: null,
      maxSoH: null,
      avgSoH: null,
      currentSoH: null,
      trend: 'unknown', // 'improving', 'stable', 'degrading', 'unknown'
      degradationRate: null // percentage per day
    };
  }
  
  const sohValues = history.map(h => h.soh);
  const minSoH = Math.min(...sohValues);
  const maxSoH = Math.max(...sohValues);
  const avgSoH = sohValues.reduce((sum, val) => sum + val, 0) / sohValues.length;
  const currentSoH = sohValues[sohValues.length - 1];
  
  // Calculate trend (compare last 10% of data vs first 10%)
  let trend = 'stable';
  let degradationRate = null;
  
  if (history.length >= 10) {
    const segmentSize = Math.max(Math.floor(history.length * 0.1), 2);
    const recentData = history.slice(-segmentSize);
    const oldData = history.slice(0, segmentSize);
    
    const recentAvg = recentData.reduce((sum, h) => sum + h.soh, 0) / recentData.length;
    const oldAvg = oldData.reduce((sum, h) => sum + h.soh, 0) / oldData.length;
    
    const change = recentAvg - oldAvg;
    
    if (change > 0.5) trend = 'improving';
    else if (change < -0.5) trend = 'degrading';
    else trend = 'stable';
    
    // Calculate degradation rate (SoH % per day)
    const timeSpanMs = recentData[recentData.length - 1].timestamp - oldData[0].timestamp;
    const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);
    if (timeSpanDays > 0) {
      degradationRate = change / timeSpanDays;
    }
  }
  
  return {
    dataPoints: history.length,
    minSoH: parseFloat(minSoH.toFixed(2)),
    maxSoH: parseFloat(maxSoH.toFixed(2)),
    avgSoH: parseFloat(avgSoH.toFixed(2)),
    currentSoH: parseFloat(currentSoH.toFixed(2)),
    trend,
    degradationRate: degradationRate ? parseFloat(degradationRate.toFixed(4)) : null
  };
}

/**
 * Get chart-ready data for SoH visualization
 * @param {string} batteryId - Battery UUID
 * @param {number} maxPoints - Maximum number of points to return (for performance)
 * @returns {Object} {labels: [], data: [], colors: []}
 */
export function getSoHChartData(batteryId, maxPoints = 50) {
  const history = getSoHHistory(batteryId);
  
  // Downsample if too many points
  let dataPoints = history;
  if (history.length > maxPoints) {
    const step = Math.ceil(history.length / maxPoints);
    dataPoints = history.filter((_, index) => index % step === 0);
  }
  
  const labels = dataPoints.map(h => {
    const date = new Date(h.timestamp);
    return date.toLocaleDateString('vi-VN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  });
  
  const data = dataPoints.map(h => h.soh);
  
  // Color code based on SoH level
  const colors = dataPoints.map(h => {
    if (h.soh >= 80) return 'rgba(34, 197, 94, 0.8)'; // green
    if (h.soh >= 60) return 'rgba(234, 179, 8, 0.8)'; // yellow
    if (h.soh >= 40) return 'rgba(249, 115, 22, 0.8)'; // orange
    return 'rgba(239, 68, 68, 0.8)'; // red
  });
  
  return { labels, data, colors };
}

/**
 * Predict when SoH will drop below a threshold
 * @param {string} batteryId - Battery UUID
 * @param {number} threshold - SoH threshold percentage (default 60)
 * @returns {Object} {willReachThreshold: boolean, estimatedDays: number, estimatedDate: Date}
 */
export function predictSoHThreshold(batteryId, threshold = 60) {
  const stats = getSoHStats(batteryId);
  
  if (!stats.degradationRate || stats.degradationRate >= 0 || stats.dataPoints < 10) {
    return {
      willReachThreshold: false,
      estimatedDays: null,
      estimatedDate: null,
      reason: stats.dataPoints < 10 ? 'Insufficient data' : 'No degradation detected'
    };
  }
  
  const currentSoH = stats.currentSoH;
  const dropNeeded = currentSoH - threshold;
  
  if (dropNeeded <= 0) {
    return {
      willReachThreshold: true,
      estimatedDays: 0,
      estimatedDate: new Date(),
      reason: 'Already below threshold'
    };
  }
  
  // degradationRate is negative (e.g., -0.05% per day)
  const daysUntilThreshold = dropNeeded / Math.abs(stats.degradationRate);
  const estimatedDate = new Date(Date.now() + daysUntilThreshold * 24 * 60 * 60 * 1000);
  
  return {
    willReachThreshold: true,
    estimatedDays: Math.ceil(daysUntilThreshold),
    estimatedDate,
    reason: 'Based on current degradation rate'
  };
}
