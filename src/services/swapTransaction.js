import API from './auth';

/**
 * Swap Transaction Management APIs
 * Handles the complete battery swap lifecycle
 */

// ============= DRIVER APIs =============

/**
 * Create a scheduled battery swap appointment
 * Role: DRIVER
 * @param {object} payload - CreateScheduledBatterySwapRequest
 * @param {string} payload.vehicleId - UUID of the vehicle
 * @param {string} payload.stationId - UUID of the station
 * @param {string} payload.scheduledTime - ISO datetime string (e.g., "2025-10-28T14:30:00")
 * @param {string} [payload.notes] - Optional notes
 * @returns {Promise<Object>} SwapTransactionResponse
 */
export async function createScheduledSwap(payload) {
  const res = await API.post('/api/swap/scheduled', payload);
  return res?.data?.data;
}

// ============= STAFF APIs =============

/**
 * Get all unconfirmed swap transactions for staff's station
 * Role: STAFF
 * @returns {Promise<Array>} Array of SwapTransactionResponse
 */
export async function getAllUnconfirmedSwaps() {
  const res = await API.get('/api/swap/scheduled/all');
  const data = res?.data?.data;
  
  // Make sure we return array and filter only SCHEDULED status on frontend as fallback
  const swaps = Array.isArray(data) ? data : [];
  
  return swaps;
}

/**
 * Confirm a scheduled swap and assign batteries
 * Role: STAFF  
 * @param {string} transactionId - UUID of the swap transaction
 * @param {Array<string>} batteryIds - Array of battery UUIDs to assign
 * @returns {Promise<Object>} SwapTransactionResponse
 */
export async function confirmScheduledSwap(transactionId, batteryIds) {
  const res = await API.post(`/api/swap/scheduled/${transactionId}/confirm`, { batteryIds });
  return res?.data?.data;
}

/**
 * Create a walk-in swap transaction (for customers without appointment)
 * Role: STAFF
 * @param {object} payload - CreateWalkInSwapRequest
 * @param {string} payload.driverId - UUID of the driver
 * @param {string} payload.vehicleId - UUID of the vehicle
 * @param {Array<string>} payload.batteryIds - Array of battery UUIDs to assign
 * @param {string} [payload.notes] - Optional notes
 * @returns {Promise<Object>} SwapTransactionResponse
 */
export async function createWalkInSwap(payload) {
  const res = await API.post('/api/swap/walkIn', payload);
  return res?.data?.data;
}

/**
 * Confirm that the customer has arrived at the station
 * Role: STAFF
 * @param {string} transactionId - UUID of the swap transaction
 * @returns {Promise<Object>} SwapTransactionResponse
 */
export async function confirmArrival(transactionId) {
  const res = await API.post(`/api/swap/${transactionId}/confirmArrival`);
  return res?.data?.data;
}

/**
 * Process the battery swapping operation
 * Role: STAFF
 * @param {string} transactionId - UUID of the swap transaction
 * @param {boolean} isProcessing - true to start swapping, false to complete
 * @returns {Promise<Object>} SwapTransactionResponse
 */
export async function processSwapping(transactionId, isProcessing) {
  const res = await API.post(
    `/api/swap/${transactionId}/swapping?isProcessing=${isProcessing}`
  );
  return res?.data?.data;
}

/**
 * Start the battery swapping process
 * Role: STAFF
 * @param {string} transactionId - UUID of the swap transaction
 * @returns {Promise<Object>} SwapTransactionResponse
 */
export async function startSwapping(transactionId) {
  return processSwapping(transactionId, true);
}

/**
 * Complete the battery swapping process
 * Role: STAFF
 * @param {string} transactionId - UUID of the swap transaction
 * @returns {Promise<Object>} SwapTransactionResponse
 */
export async function completeSwapping(transactionId) {
  return processSwapping(transactionId, false);
}

// ============= Helper/Utility Functions =============

/**
 * Get swap status display text
 * @param {string} status - TransactionStatus enum value
 * @returns {string} Vietnamese display text
 */
export function getSwapStatusText(status) {
  const statusMap = {
    SCHEDULED: 'Đã đặt lịch',
    CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang thực hiện',
    COMPLETED: 'Hoàn thành',
    CANCELED: 'Đã hủy'
  };
  return statusMap[status] || status;
}

/**
 * Get swap type display text
 * @param {string} type - SwapType enum value
 * @returns {string} Vietnamese display text
 */
export function getSwapTypeText(type) {
  const typeMap = {
    SCHEDULED: 'Đặt lịch trước',
    WALK_IN: 'Trực tiếp'
  };
  return typeMap[type] || type;
}
