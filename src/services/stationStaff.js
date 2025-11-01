import API from './auth';

/**
 * DEPRECATED: Backend endpoint does not exist
 * Returns null to prevent API errors
 */
export async function getMyStaffInfo() {
  return null;
}

/**
 * Get all staff members
 * BE already returns full staff info (firstName, lastName, email, etc.)
 */
export async function getAllStaff() {
  const res = await API.get('/api/station-staff/all');
  return res?.data?.data ?? [];
}

export async function getStationStaff(stationId) {
  if (!stationId) {
    throw new Error('Station ID is required');
  }
  
  try {
    const res = await API.get(`/api/station-staff/station/${stationId}/staff`);
    return res?.data?.data ?? [];
  } catch (error) {
    console.error('Error fetching station staff:', error);
    // If station staff API fails, try to get all staff as fallback
    if (error?.response?.status === 403 || error?.response?.status === 401) {
      console.log('Access denied for station staff, trying to get all staff...');
      const res = await API.get('/api/station-staff/all');
      return res?.data?.data ?? [];
    }
    throw error;
  }
}

export async function createStaff(data) {
  // Gửi status và gender qua URL parameter
  const params = new URLSearchParams({ 
    status: data.status,
    gender: data.gender || 'MALE' // Default gender
  });
  
  // Body theo CreateStationStaffRequest
  const requestData = {
    staffEmail: data.staffEmail,
    password: data.password,
    confirmPassword: data.confirmPassword,
    phone: data.phone,
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    identityNumber: data.identityNumber,
    AvatarUrl: data.avatarUrl || '',
    stationName: data.stationName,
    salary: data.salary
  };
  
  const res = await API.post(`/api/station-staff/create?${params}`, requestData);
  return res?.data?.data;
}

export async function updateStaffStatus(staffId, data) {
  // Controller expects status as URL parameter (required) and salary in request body
  const params = new URLSearchParams();
  
  // Always include status parameter - use existing status or default to FULL_TIME
  const status = data.status || 'FULL_TIME';
  params.append('status', status);
  
  // Only send salary in request body (as per Swagger spec)
  const requestBody = {
    salary: data.salary
  };
  
  const url = `/api/station-staff/update/${staffId}?${params.toString()}`;
  const res = await API.put(url, requestBody);
  return res?.data?.data;
}

export async function deleteStaff(staffId) {
  const res = await API.delete(`/api/station-staff/delete/${staffId}`);
  return res?.data?.data;
}