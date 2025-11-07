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
    
    // Load batteries for each status SEQUENTIALLY to avoid overwhelming backend
    for (const status of statuses) {
      try {
        const res = await API.get(`/api/battery/station/${stationInfo.stationId}/status`, { 
          params: { status, page: 1 } 
        });
        const batteries = res?.data?.data || [];
        if (Array.isArray(batteries) && batteries.length > 0) {
          allBatteries.push(...batteries);
        }
      } catch (error) {
        console.warn(`Failed to get batteries for status ${status}:`, error?.response?.status || error.message);
        // Continue with other statuses even if one fails
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
    let hasMore = false;
    let allStatusesFailed = true;
    
    // Load batteries for each status SEQUENTIALLY to avoid overwhelming backend
    for (const status of statuses) {
      try {
        const res = await API.get(`/api/battery/station/${stationInfo.stationId}/status`, { 
          params: { status, page } 
        });
        const batteries = res?.data?.data || [];
        
        allStatusesFailed = false; // At least one status succeeded
        
        if (Array.isArray(batteries) && batteries.length > 0) {
          allBatteries.push(...batteries);
          
          // If any status returned 10 items, there might be more pages
          if (batteries.length === 10) {
            hasMore = true;
          }
        }
      } catch (error) {
        console.warn(`Failed to get batteries for status ${status}:`, error?.response?.status || error.message);
        // Continue with other statuses even if one fails
      }
    }
    
    // If ALL statuses failed and this is page 1, retry with delay
    if (allStatusesFailed && page === 1) {
      console.log('⚠️ All status APIs failed on first attempt, retrying after delay...');
      
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Retry all statuses once more
      for (const status of statuses) {
        try {
          const res = await API.get(`/api/battery/station/${stationInfo.stationId}/status`, { 
            params: { status, page } 
          });
          const batteries = res?.data?.data || [];
          
          if (Array.isArray(batteries) && batteries.length > 0) {
            allBatteries.push(...batteries);
            allStatusesFailed = false; // At least one succeeded on retry
            
            if (batteries.length === 10) {
              hasMore = true;
            }
          }
        } catch (error) {
          console.warn(`Retry failed for status ${status}:`, error?.response?.status || error.message);
        }
      }
      
      if (allStatusesFailed) {
        console.error('❌ All retries failed. Backend API appears to be down.');
      } else {
        console.log('✅ Retry successful after delay');
      }
    }
    
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
          const res = await API.get(`/api/battery/station/${stationInfo.stationId}/status`, { 
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
 * Get ALL batteries for a specific station with FULL status (all pages)
 * For swap confirmation and walk-in creation - needs all available batteries
 * @param {string} stationId - Station UUID
 */
export async function getBatteriesByStationComplete(stationId) {
  try {
    const allBatteries = [];
    let currentPage = 1;
    let hasMore = true;
    let consecutiveErrors = 0;
    const MAX_ERRORS = 3; // Allow up to 3 retries
    
    while (hasMore && consecutiveErrors < MAX_ERRORS) {
      try {
        const batteries = await getBatteriesByStationAndStatus(stationId, 'FULL', currentPage);
        
        // Reset error counter on success
        consecutiveErrors = 0;
        
        if (batteries.length === 0) {
          hasMore = false;
        } else {
          allBatteries.push(...batteries);
          
          // If we got less than 10 batteries, we've reached the end
          if (batteries.length < 10) {
            hasMore = false;
          } else {
            currentPage++;
          }
        }
      } catch (pageError) {
        consecutiveErrors++;
        console.warn(`❌ Attempt ${consecutiveErrors}/${MAX_ERRORS} failed for page ${currentPage}:`, pageError?.response?.status || pageError.message);
        
        // If this is a 500 error and we haven't exceeded max retries, wait and retry
        if (pageError?.response?.status === 500 && consecutiveErrors < MAX_ERRORS) {
          console.log(`⏳ Waiting 2 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          // Don't increment consecutiveErrors yet - the retry will determine success/failure
          consecutiveErrors--; // Undo the increment so we can retry
        } else {
          // Other errors or exceeded retries - stop pagination
          hasMore = false;
        }
      }
    }
    
    if (allBatteries.length === 0 && consecutiveErrors >= MAX_ERRORS) {
      console.error(`⚠️ Failed to load any batteries after ${MAX_ERRORS} attempts. Backend API may be down.`);
    }
    
    console.log(`Loaded ${allBatteries.length} FULL batteries from station ${stationId} (${currentPage} pages, ${consecutiveErrors} errors)`);
    return allBatteries;
  } catch (error) {
    console.error('Failed to get all batteries by station:', error);
    // Return empty array instead of throwing - allow UI to show "no batteries available"
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
    
    // Fetch batteries for each status SEQUENTIALLY to avoid overwhelming backend
    for (const status of statuses) {
      try {
        const batteries = await getBatteriesByStationAndStatus(stationId, status, 1);
        if (Array.isArray(batteries) && batteries.length > 0) {
          allBatteries.push(...batteries);
        }
      } catch (error) {
        console.warn(`Failed to get batteries for status ${status}:`, error?.response?.status || error.message);
        // Continue with other statuses
      }
    }
    
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
