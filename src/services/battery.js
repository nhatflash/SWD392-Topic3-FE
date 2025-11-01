import API from './auth';

/**
 * Battery Management APIs
 * All endpoints require ADMIN role unless specified
 */

// ============= Battery CRUD =============

/**
 * Get all batteries (paginated)
 * Role: ADMIN
 * @param {number} page - Page index (1-based for backend)
 * @param {number} size - Page size
 */
export async function getAllBatteries(page = 1, size = 20) {
  const res = await API.get('/api/battery/all', { params: { page, size } });
  const data = res?.data?.data;
  // Support both array and paginated { content: [] } shapes
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

/**
 * Get ALL batteries across all pages (for admin dashboard)
 * Role: ADMIN
 */
export async function getAllBatteriesComplete() {
  try {
    // First, get the first page to check total count/pages
    const firstPageRes = await API.get('/api/battery/all', { params: { page: 1, size: 100 } });
    const firstPageData = firstPageRes?.data?.data;
    
    // If it's just an array, return it
    if (Array.isArray(firstPageData)) {
      return firstPageData;
    }
    
    // If it's paginated, check if we need more pages
    if (firstPageData?.content && Array.isArray(firstPageData.content)) {
      const { content, totalPages = 1, totalElements = content.length } = firstPageData;
      
      // If only one page or got all elements, return first page content
      if (totalPages <= 1 || content.length >= totalElements) {
        return content;
      }
      
      // Otherwise, get all pages
      const allBatteries = [...content];
      const promises = [];
      
      for (let page = 2; page <= totalPages; page++) {
        promises.push(
          API.get('/api/battery/all', { params: { page, size: 100 } })
            .then(res => res?.data?.data?.content || [])
            .catch(() => [])
        );
      }
      
      const additionalPages = await Promise.all(promises);
      additionalPages.forEach(pageContent => {
        if (Array.isArray(pageContent)) {
          allBatteries.push(...pageContent);
        }
      });
      
      return allBatteries;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to get all batteries:', error);
    return [];
  }
}

/**
 * Get battery details by ID
 * Role: ADMIN
 * @param {string} batteryId - UUID of battery
 */
export async function getBatteryById(batteryId) {
  const res = await API.get(`/api/battery/${batteryId}`);
  return res?.data?.data;
}

/**
 * Add new battery to a station
 * Role: ADMIN (but endpoint expects STAFF context with stationId from auth)
 * Note: BE expects currentStationId from authenticated user (STAFF role)
 * For ADMIN use case, we'll need to pass stationId explicitly if BE supports it
 * @param {object} payload - Battery creation data
 */
export async function addNewBattery(stationId, payload) {
  const res = await API.post(`/api/battery/station/${stationId}`, payload);
  return res?.data?.data;
}

// ============= Battery Model CRUD =============

/**
 * Define/create a new battery model
 * Role: ADMIN
 * @param {object} payload - DefineBatteryModelRequest
 */
export async function defineBatteryModel(payload) {
  const res = await API.post('/api/battery/model', payload);
  return res?.data?.data;
}

/**
 * Get all battery models (paginated)
 * Role: Public (no auth required based on BE @GetMapping without @PreAuthorize)
 * @param {number} page - Page index (1-based for backend)
 * @param {number} size - Page size
 */
export async function getAllBatteryModels(page = 1, size = 20) {
  const res = await API.get('/api/battery/model', { params: { page, size } });
  const data = res?.data?.data;
  // Support both array and paginated { content: [] } shapes
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.items && Array.isArray(data.items)) return data.items;
  return [];
}

/**
 * Alias for getAllBatteryModels - for driver use case
 * @param {number} page - Page index (1-based), optional
 */
export const getBatteryModels = getAllBatteryModels;

/**
 * Update a battery model
 * Role: ADMIN
 * @param {string} modelId - UUID of battery model
 * @param {object} payload - UpdateBatteryModelRequest
 */
export async function updateBatteryModel(modelId, payload) {
  const res = await API.patch(`/api/battery/model/${modelId}`, payload);
  return res?.data?.data;
}

// ============= Staff Station Functions =============

/**
 * Get current staff's station information using station-staff API
 * @returns {Promise<Object>} Station info with {stationId, stationName}
 */
export async function getCurrentStaffStation() {
  try {
    // Get all staff and find current user's staff info
    const res = await API.get('/api/station-staff/all');
    const allStaff = res?.data?.data || [];
    
    // Get current user info to match
    const { getCurrentProfile } = await import('./user');
    const profile = await getCurrentProfile();
    
    if (!profile?.userId && !profile?.id) {
      throw new Error('Cannot get current user ID');
    }
    
    const currentUserId = profile.userId || profile.id;
    
    // Find staff record that matches current user
    const currentStaff = allStaff.find(staff => 
      String(staff.staffId) === String(currentUserId)
    );
    
    if (!currentStaff) {
      throw new Error('Staff chưa được phân công vào trạm nào');
    }
    
    return {
      stationId: currentStaff.stationId,
      stationName: currentStaff.stationName
    };
  } catch (error) {
    console.error('Failed to get current staff station:', error);
    throw error;
  }
}

/**
 * Get battery inventory for current staff's station
 * @returns {Promise<Array>} Array of batteries for all statuses
 */
export async function getStaffBatteryInventory() {
  try {
    // Get staff's station info
    const stationInfo = await getCurrentStaffStation();
    
    if (!stationInfo?.stationId) {
      throw new Error('Staff chưa được phân công vào trạm nào');
    }

    // Get batteries for all statuses at this station
    const statuses = ['FULL', 'IN_USE', 'CHARGING', 'MAINTENANCE', 'FAULTY', 'RETIRED'];
    const allBatteries = [];
    
    const promises = statuses.map(async (status) => {
      try {
        const res = await API.get(`/api/battery/station/${stationInfo.stationId}/status`, { 
          params: { status, page: 1 } 
        });
        return res?.data?.data || [];
      } catch (error) {
        console.warn(`Failed to get batteries for status ${status}:`, error?.response?.status);
        return [];
      }
    });
    
    const results = await Promise.all(promises);
    for (const batteries of results) {
      if (Array.isArray(batteries)) {
        allBatteries.push(...batteries);
      }
    }
    
    console.log(`Found ${allBatteries.length} batteries for station ${stationInfo.stationId} (${stationInfo.stationName})`);
    return allBatteries;
  } catch (error) {
    console.error('Failed to get staff battery inventory:', error);
    throw error;
  }
}

// ============= Helper for fetching batteries by station =============
// Note: BE doesn't have direct endpoint for this, but we can filter client-side
// or use inventory endpoint if we have staff access to that station

/**
 * Get batteries for a specific station by status
 * Role: Requires authentication
 * @param {string} stationId - Station UUID
 * @param {string} status - BatteryStatus enum: FULL, IN_USE, CHARGING, MAINTENANCE, FAULTY, RETIRED
 * @param {number} page - Page index (1-based)
 */
export async function getBatteriesByStationAndStatus(stationId, status, page = 1) {
  const res = await API.get(`/api/battery/station/${stationId}/status`, {
    params: { status, page }
  });
  const data = res?.data?.data;
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  return [];
}

/**
 * Get all batteries for a specific station (FULL status = ready to use)
 * @param {string} stationId - Station UUID
 */
export async function getBatteriesByStation(stationId) {
  // Get batteries with FULL status (ready to rent/swap)
  try {
    return await getBatteriesByStationAndStatus(stationId, 'FULL', 1);
  } catch (error) {
    console.error('Failed to get batteries by station:', error);
    return [];
  }
}

/**
 * Get ALL batteries for a specific station (all statuses)
 * For Battery Management page - shows all batteries regardless of status
 * @param {string} stationId - Station UUID
 */
export async function getAllBatteriesByStation(stationId) {
  try {
    // Get batteries with all possible statuses
    const statuses = ['FULL', 'IN_USE', 'CHARGING', 'MAINTENANCE', 'FAULTY', 'RETIRED'];
    const allBatteries = [];
    
    // Fetch batteries for each status in parallel
    const promises = statuses.map(status => 
      getBatteriesByStationAndStatus(stationId, status, 1).catch(() => [])
    );
    
    const results = await Promise.all(promises);
    
    // Combine all results
    results.forEach(batteries => {
      if (Array.isArray(batteries)) {
        allBatteries.push(...batteries);
      }
    });
    
    console.log(`Total batteries found for station ${stationId}:`, allBatteries.length);
    return allBatteries;
  } catch (error) {
    console.error('Failed to get all batteries by station:', error);
    return [];
  }
}

// ============= Battery Monitoring APIs (Real-time) =============

/**
 * Get real-time battery states for a station
 * Role: STAFF, ADMIN
 * @param {string} stationId - Station UUID
 * @returns {Promise<Array>} Array of BatteryState objects
 */
export async function getBatteryStatesByStation(stationId) {
  const res = await API.get(`/api/battery-monitoring/station/${stationId}`);
  return res?.data?.data ?? [];
}

/**
 * Get real-time battery state for a single battery
 * Role: STAFF, ADMIN
 * @param {string} batteryId - Battery UUID
 * @returns {Promise<Object>} BatteryState object
 */
export async function getBatteryStateById(batteryId) {
  const res = await API.get(`/api/battery-monitoring/battery/${batteryId}`);
  return res?.data?.data;
}

/**
 * Get SSE connection statistics (admin only)
 * Role: ADMIN
 * @returns {Promise<Object>} Connection stats
 */
export async function getMonitoringStats() {
  const res = await API.get('/api/battery-monitoring/stats');
  return res?.data?.data ?? {};
}

/**
 * Create SSE connection for real-time battery monitoring
 * Role: STAFF, ADMIN
 * @param {string} stationId - Station UUID
 * @param {string} token - JWT token for authentication
 * @returns {EventSource} SSE connection
 */
export function createBatteryMonitoringStream(stationId, token) {
  const baseURL = API.defaults.baseURL || '';
  const url = `${baseURL}/api/battery-monitoring/stream/${stationId}`;
  
  // EventSource doesn't support custom headers, so we pass token as query param
  // or use a library that supports headers
  const eventSource = new EventSource(url, {
    withCredentials: true
  });
  
  return eventSource;
}
