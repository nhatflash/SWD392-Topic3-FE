import API from './auth';

export async function listVehicles() {
  const res = await API.get('/api/vehicle');
  return res?.data?.data ?? [];
}

export async function registerVehicle(payload) {
  const res = await API.post('/api/vehicle', payload);
  return res?.data?.data;
}

export async function updateVehicle(vehicleId, payload) {
  const res = await API.put(`/api/vehicle/${vehicleId}`, payload);
  return res?.data?.data;
}

export async function deactivateVehicle(vehicleId) {
  const res = await API.delete(`/api/vehicle/${vehicleId}`);
  return res?.data?.data ?? true;
}



