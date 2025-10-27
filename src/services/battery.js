import API from './auth';

/**
 * Battery Management APIs
 * All endpoints require ADMIN role unless specified
 */

// ============= Battery CRUD =============

/**
 * Get all batteries (paginated)
 * Role: ADMIN
 * @param {number} page - Page index (1-based)
 */
export async function getAllBatteries(page = 1) {
  const res = await API.get('/api/battery/all', { params: { page } });
  const data = res?.data?.data;
  // Support both array and paginated { content: [] } shapes
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  return [];
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

/**
 * Get battery inventory for a station by status
 * Role: STAFF
 * @param {string} status - BatteryStatus enum value
 * @param {number} page - Page index (1-based)
 */
export async function getBatteryInventory(status, page = 1) {
  const params = { page };
  if (status) params.status = status;
  const res = await API.get('/api/battery/inventory', { params });
  return res?.data?.data ?? [];
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
 * Role: ADMIN
 * @param {number} page - Page index (1-based)
 */
export async function getAllBatteryModels(page = 1) {
  const res = await API.get('/api/battery/model', { params: { page } });
  const data = res?.data?.data;
  // Support both array and paginated { content: [] } shapes
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  return [];
}

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
