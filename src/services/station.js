import API from './auth';

export async function getAllStations() {
  const res = await API.get('/api/station/all');
  return res?.data?.data ?? [];
}

export async function getOperationalStations() {
  const res = await API.get('/api/station/operational');
  return res?.data?.data ?? [];
}

export async function createStation(data) {
  const res = await API.post('/api/station/create', data);
  return res?.data?.data;
}

export async function updateStation(id, data) {
  if (!id) {
    console.error('Station ID is missing');
    throw new Error('Station ID is required');
  }
  console.log('Updating station with ID:', id, 'Data:', data);
  try {
    const res = await API.put(`/api/station/${id}/update`, data);
    console.log('Update response:', res?.data);
    return res?.data?.data;
  } catch (error) {
    console.error('Error updating station:', error.response || error);
    throw error;
  }
}

export async function changeStationStatus(id, newStatus) {
  console.log('Changing station status:', id, newStatus);
  if (!id) {
    throw new Error('Station ID is required');
  }
  const res = await API.patch(`/api/station/${id}/status?status=${newStatus}`);
  return res?.data?.data;
}