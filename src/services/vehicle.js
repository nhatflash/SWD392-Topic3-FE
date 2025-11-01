import API from './auth';

/**
 * Vehicle Management APIs
 * All endpoints require DRIVER role authentication
 */

/**
 * Get all vehicles for the authenticated driver
 * Role: DRIVER
 * @returns {Promise<Array>} Array of VehicleResponse
 */
export async function listVehicles() {
  const res = await API.get('/api/vehicle');
  return res?.data?.data ?? [];
}

/**
 * Alias for listVehicles - clearer naming for driver use case
 */
export const getUserVehicles = listVehicles;

/**
 * Register a new vehicle for the authenticated driver
 * Role: DRIVER
 * @param {object} payload - RegisterVehicleRequest
 * @param {string} payload.vin - Vehicle Identification Number
 * @param {string} payload.make - Vehicle manufacturer
 * @param {string} payload.model - Vehicle model
 * @param {number} payload.year - Manufacturing year
 * @param {string} payload.licensePlate - License plate number
 * @param {string} payload.batteryType - Battery type (e.g., "TYPE_A", "TYPE_B")
 * @param {number} payload.batteryCapacity - Number of batteries needed
 * @returns {Promise<Object>} VehicleResponse
 */
export async function registerVehicle(payload) {
  const res = await API.post('/api/vehicle/register', payload);
  return res?.data?.data;
}

/**
 * Update an existing vehicle
 * Role: DRIVER
 * @param {string} vehicleId - UUID of the vehicle
 * @param {object} payload - UpdateVehicleRequest (same fields as register)
 * @returns {Promise<Object>} VehicleResponse
 */
export async function updateVehicle(vehicleId, payload) {
  const res = await API.patch(`/api/vehicle/${vehicleId}`, payload);
  return res?.data?.data;
}

/**
 * Deactivate a vehicle (soft delete)
 * Note: BE endpoint may not exist, this is placeholder
 * @param {string} vehicleId - UUID of the vehicle
 */
export async function deactivateVehicle(vehicleId) {
  const res = await API.delete(`/api/vehicle/${vehicleId}`);
  return res?.data?.data ?? true;
}

/**
 * Get a specific vehicle by ID
 * Note: BE doesn't have direct endpoint, filter from getUserVehicles
 * @param {string} vehicleId - UUID of the vehicle
 * @returns {Promise<Object|null>} VehicleResponse or null if not found
 */
export async function getVehicleById(vehicleId) {
  const vehicles = await getUserVehicles();
  return vehicles.find(v => v.vehicleId === vehicleId || v.id === vehicleId) || null;
}

/**
 * Get vehicles for a specific driver (STAFF access)
 * Role: STAFF, ADMIN
 * @param {string} driverId - UUID of the driver (userId)
 * @returns {Promise<Array>} Array of VehicleResponse
 */
export async function getVehiclesByDriverId(driverId) {
  try {
    const res = await API.get(`/api/vehicle/all/${driverId}`);
    return res?.data?.data ?? [];
  } catch (error) {
    console.error('Failed to get driver vehicles:', error);
    return [];
  }
}




