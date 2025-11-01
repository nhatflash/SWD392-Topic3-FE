import API from './auth';

// Thêm tham số page, size mặc định
export async function getAllStations(page = 0, size = 20) {
  const res = await API.get(`/api/station/all?page=${page}&size=${size}`);
  // Nếu backend trả về dạng phân trang, lấy res.data.data.content hoặc res.data.data.items
  const data = res?.data?.data;
  if (Array.isArray(data)) return data;
  if (data?.content) return data.content;
  if (data?.items) return data.items;
  return [];
}

export async function getOperationalStations(page = 0, size = 20) {
  const res = await API.get(`/api/station/operational?page=${page}&size=${size}`);
  const data = res?.data?.data;
  if (Array.isArray(data)) return data;
  if (data?.content) return data.content;
  if (data?.items) return data.items;
  return [];
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
  try {
    const res = await API.put(`/api/station/${id}/update`, data);
    return res?.data?.data;
  } catch (error) {
    console.error('Error updating station:', error.response || error);
    throw error;
  }
}

export async function changeStationStatus(id, newStatus) {
  if (!id) {
    throw new Error('Station ID is required');
  }
  const res = await API.patch(`/api/station/${id}/status?status=${newStatus}`);
  return res?.data?.data;
}

export async function getStationById(id) {
  if (!id) {
    throw new Error('Station ID is required');
  }
  const res = await API.get(`/api/station/${id}`);
  return res?.data?.data;
}