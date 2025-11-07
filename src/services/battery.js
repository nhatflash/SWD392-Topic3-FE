import API from './auth';
import { jwtDecode } from 'jwt-decode';

/**
 * Battery Management APIs
 * All endpoints require ADMIN role unless specified
 */

// ============= Battery CRUD =============

/**
 * Get all batteries (paginated)
 * Role: ADMIN
 * @param {number} page - Page index (1-based for backend)
 * Note: Backend uses fixed page size of 10 (LIST_SIZE constant), size parameter is ignored
 */
export async function getAllBatteries(page = 1) {
  const res = await API.get('/api/battery/all', { params: { page } });
  const data = res?.data?.data;
  // Backend returns array directly (not wrapped in pagination object)
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Get ALL batteries across all pages (for admin dashboard)
 * Backend uses PAGE_SIZE = 10, so we need to fetch multiple pages
 * Role: ADMIN
 */
export async function getAllBatteriesComplete() {
  try {
    const allBatteries = [];
    let currentPage = 1;
    let hasMore = true;
    
    while (hasMore) {
      const batteries = await getAllBatteries(currentPage);
      
      if (batteries.length === 0) {
        // No more batteries
        hasMore = false;
      } else {
        allBatteries.push(...batteries);
        
        // If we got less than 10 batteries (LIST_SIZE), we've reached the end
        if (batteries.length < 10) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }
    }
    
    console.log(`Loaded ${allBatteries.length} batteries from ${currentPage} pages`);
    return allBatteries;
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
 * Note: Backend uses fixed page size of 10 (LIST_SIZE constant), size parameter is ignored
 */
export async function getAllBatteryModels(page = 1) {
  const res = await API.get('/api/battery/model', { params: { page } });
  const data = res?.data?.data;
  // Backend returns array directly (not wrapped in pagination object)
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Get ALL battery models across all pages
 * Backend uses PAGE_SIZE = 10, so we need to fetch multiple pages
 */
export async function getAllBatteryModelsComplete() {
  try {
    const allModels = [];
    let currentPage = 1;
    let hasMore = true;
    
    while (hasMore) {
      const models = await getAllBatteryModels(currentPage);
      
      if (models.length === 0) {
        // No more models
        hasMore = false;
      } else {
        allModels.push(...models);
        
        // If we got less than 10 models (LIST_SIZE), we've reached the end
        if (models.length < 10) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }
    }
    
    console.log(`Loaded ${allModels.length} battery models from ${currentPage} pages`);
    return allModels;
  } catch (error) {
    console.error('Failed to get all battery models:', error);
    return [];
  }
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
    console.log('🔵 [1/4] Starting getCurrentStaffStation...');
    
    // Get all staff and find current user's staff info
    console.log('🔵 [2/4] Fetching /api/station-staff/all...');
    const res = await API.get('/api/station-staff/all');
    const allStaff = res?.data?.data || [];
    console.log('✅ [2/4] Got', allStaff.length, 'staff members');
    
    // Get current user ID from JWT token (most reliable)
    console.log('🔵 [3/4] Getting userId from JWT token...');
    let currentUserId = null;
    
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const decoded = jwtDecode(token);
        console.log('✅ [3/4] Decoded JWT:', decoded);
        // Spring Security JWT usually has "sub" field with userId
        currentUserId = decoded.sub || decoded.userId || decoded.id;
      }
    } catch (jwtError) {
      console.warn('⚠️ Cannot decode JWT:', jwtError);
    }
    
    // Fallback: Try API profile if JWT fails
    if (!currentUserId) {
      console.log('🔵 [3/4] JWT failed, trying API profile...');
      const { getCurrentProfile } = await import('./user');
      const profile = await getCurrentProfile();
      console.log('✅ [3/4] Profile from API:', profile);
      currentUserId = profile?.userId || profile?.id;
    }
    
    if (!currentUserId) {
      console.error('❌ [3/4] Cannot get userId from JWT or API');
      throw new Error('Cannot get current user ID');
    }
    
    console.log('✅ [3/4] Using userId:', currentUserId);
    
    // Find staff record that matches current user
    console.log('🔵 [4/4] Finding staff with userId:', currentUserId);
    const currentStaff = allStaff.find(staff => 
      String(staff.staffId) === String(currentUserId)
    );
    
    if (!currentStaff) {
      console.error('❌ [4/4] Staff not found! userId:', currentUserId);
      console.error('Available staffIds:', allStaff.map(s => s.staffId));
      throw new Error('Staff chưa được phân công vào trạm nào');
    }
    
    console.log('✅ [4/4] Found staff station:', currentStaff.stationName);
    
    return {
      stationId: currentStaff.stationId,
      stationName: currentStaff.stationName
    };
  } catch (error) {
    console.error('❌ getCurrentStaffStation ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Get batteries for STAFF's own station by status
 * Role: STAFF (backend auto-detects station from authenticated user)
 * @param {string} status - BatteryStatus enum: FULL, IN_USE, CHARGING, MAINTENANCE, FAULTY, RETIRED
 * @param {number} page - Page index (1-based)
 * Note: Backend endpoint does NOT accept stationId - it auto-detects from JWT auth
 */
export async function getStaffBatteryByStatus(status, page = 1) {
  const res = await API.get('/api/battery/station/status', {
    params: { status, page }
  });
  const data = res?.data?.data;
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  return [];
}

/**
 * Get battery inventory for current staff's station (all statuses, all pages)
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
        // Backend expects: GET /api/battery/station/status?status=FULL&page=1
        // Backend auto-detects stationId from authenticated staff user
        const res = await API.get('/api/battery/station/status', { 
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

/**
 * Get battery inventory for current staff's station with pagination
 * @param {number} page - Page number (1-based)
 * @returns {Promise<Object>} {batteries: Array, hasMore: boolean, stationInfo: Object}
 */
export async function getStaffBatteryInventoryPaginated(page = 1) {
  try {
    // Get staff's station info
    const stationInfo = await getCurrentStaffStation();
    
    if (!stationInfo?.stationId) {
      throw new Error('Staff chưa được phân công vào trạm nào');
    }

    // Get batteries for all statuses at this station for specific page
    const statuses = ['FULL', 'IN_USE', 'CHARGING', 'MAINTENANCE', 'FAULTY', 'RETIRED'];
    const allBatteries = [];
    
    // For pagination, we need to get batteries from each status and combine
    // Backend uses LIST_SIZE = 10, so we'll get page data for each status
    const promises = statuses.map(async (status) => {
      try {
        // Backend expects: GET /api/battery/station/status?status=FULL&page=1
        // Backend auto-detects stationId from authenticated staff user
        const res = await API.get('/api/battery/station/status', { 
          params: { status, page } 
        });
        const batteries = res?.data?.data || [];
        return { status, batteries };
      } catch (error) {
        console.warn(`Failed to get batteries for status ${status}:`, error?.response?.status);
        return { status, batteries: [] };
      }
    });
    
    const results = await Promise.all(promises);
    let totalBatteriesThisPage = 0;
    
    for (const { batteries } of results) {
      if (Array.isArray(batteries)) {
        allBatteries.push(...batteries);
        totalBatteriesThisPage += batteries.length;
      }
    }
    
    // Check if there are more pages by seeing if any status returned full page (10 items)
    const hasMore = results.some(({ batteries }) => batteries.length === 10);
    
    console.log(`Found ${allBatteries.length} batteries for station ${stationInfo.stationId} page ${page}`);
    
    return {
      batteries: allBatteries,
      hasMore,
      stationInfo
    };
  } catch (error) {
    console.error('Failed to get staff battery inventory:', error);
    throw error;
  }
}

/**
 * Get total count of batteries for current staff's station
 * @returns {Promise<number>} Total number of batteries in staff's station
 */
export async function getStaffBatteryTotalCount() {
  try {
    // Get staff's station info
    const stationInfo = await getCurrentStaffStation();
    
    if (!stationInfo?.stationId) {
      throw new Error('Staff chưa được phân công vào trạm nào');
    }

    // Get total count by loading all pages and counting
    let totalCount = 0;
    let currentPage = 1;
    let hasMore = true;
    
    const statuses = ['FULL', 'IN_USE', 'CHARGING', 'MAINTENANCE', 'FAULTY', 'RETIRED'];
    
    while (hasMore) {
      const promises = statuses.map(async (status) => {
        try {
          // Backend expects: GET /api/battery/station/status?status=FULL&page=1
          // Backend auto-detects stationId from authenticated staff user
          const res = await API.get('/api/battery/station/status', { 
            params: { status, page: currentPage } 
          });
          return res?.data?.data || [];
        } catch (error) {
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      let pageTotal = 0;
      
      for (const batteries of results) {
        if (Array.isArray(batteries)) {
          pageTotal += batteries.length;
        }
      }
      
      if (pageTotal === 0) {
        hasMore = false;
      } else {
        totalCount += pageTotal;
        
        // If any status returned less than 10 items, we've reached the end
        const hasFullPages = results.some(batteries => batteries.length === 10);
        if (!hasFullPages) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }
    }
    
    return totalCount;
  } catch (error) {
    console.error('Failed to get staff battery total count:', error);
    return 0;
  }
}

/**
 * Get total count of battery models across all pages
 * @returns {Promise<number>} Total number of battery models
 */
export async function getBatteryModelsTotalCount() {
  try {
    let totalCount = 0;
    let currentPage = 1;
    let hasMore = true;
    
    while (hasMore) {
      const models = await getAllBatteryModels(currentPage);
      
      if (models.length === 0) {
        hasMore = false;
      } else {
        totalCount += models.length;
        
        // If we got less than 10 models (LIST_SIZE), we've reached the end
        if (models.length < 10) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }
    }
    
    return totalCount;
  } catch (error) {
    console.error('Failed to get battery models total count:', error);
    return 0;
  }
}

// ============= Helper for fetching batteries by station =============
// Note: BE doesn't have direct endpoint for this, but we can filter client-side
// or use inventory endpoint if we have staff access to that station

/**
 * Get ALL FULL batteries for STAFF's own station (all pages)
 * For walk-in creation - needs all available batteries from staff's station
 * Role: STAFF (backend auto-detects station from authenticated user)
 */
export async function getStaffBatteriesComplete() {
  try {
    console.log(`🔍 Loading all FULL batteries for staff's station...`);
    
    const allBatteries = [];
    let currentPage = 1;
    let hasMore = true;
    
    while (hasMore) {
      const batteries = await getStaffBatteryByStatus('FULL', currentPage);
      
      if (batteries.length === 0) {
        hasMore = false;
      } else {
        allBatteries.push(...batteries);
        
        // If we got less than 10 batteries (LIST_SIZE), we've reached the end
        if (batteries.length < 10) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }
    }
    
    console.log(`✅ Loaded ${allBatteries.length} FULL batteries from ${currentPage} pages`);
    return allBatteries;
  } catch (error) {
    console.error('Failed to get staff batteries complete:', error);
    return [];
  }
}

/**
 * Get ALL batteries for a specific station with FULL status (all pages)
 * For swap confirmation - when approving bookings that may be from different stations
 * Note: Backend has NO endpoint to get batteries by stationId, so we must filter client-side
 * @param {string} stationId - Station UUID
 */
export async function getBatteriesByStationComplete(stationId) {
  try {
    console.log(`🔍 Loading FULL batteries for station ${stationId}...`);
    
    // Backend doesn't have endpoint to get batteries by specific stationId
    // So we need to:
    // 1. Get station info to get station name
    // 2. Get ALL batteries and filter by station name + FULL status
    
    // Import station service dynamically to avoid circular dependency
    const { getStationById } = await import('./station');
    const station = await getStationById(stationId);
    const stationName = station?.stationName;
    
    if (!stationName) {
      console.warn(`⚠️ Station not found for ID: ${stationId}`);
      return [];
    }
    
    const allBatteries = await getAllBatteriesComplete();
    
    // Filter by currentStationName (backend returns station name, not ID)
    const stationBatteries = allBatteries.filter(battery => 
      battery.currentStationName === stationName && battery.status === 'FULL'
    );
    
    console.log(`✅ Found ${stationBatteries.length} FULL batteries for station "${stationName}"`);
    return stationBatteries;
  } catch (error) {
    console.error('Failed to get all batteries by station:', error);
    return [];
  }
}

/**
 * Get ALL batteries for STAFF's own station (all statuses, all pages)
 * For Battery Management page - shows all batteries regardless of status
 * Role: STAFF (backend auto-detects station from authenticated user)
 */
export async function getStaffAllBatteries() {
  try {
    // Get batteries with all possible statuses
    const statuses = ['FULL', 'IN_USE', 'CHARGING', 'MAINTENANCE', 'FAULTY', 'RETIRED'];
    const allBatteries = [];
    
    // Fetch batteries for each status
    for (const status of statuses) {
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const batteries = await getStaffBatteryByStatus(status, currentPage);
        
        if (batteries.length === 0) {
          hasMore = false;
        } else {
          allBatteries.push(...batteries);
          
          // If we got less than 10 batteries (LIST_SIZE), we've reached the end
          if (batteries.length < 10) {
            hasMore = false;
          } else {
            currentPage++;
          }
        }
      }
    }
    
    console.log(`Total batteries found for staff's station:`, allBatteries.length);
    return allBatteries;
  } catch (error) {
    console.error('Failed to get all staff batteries:', error);
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
