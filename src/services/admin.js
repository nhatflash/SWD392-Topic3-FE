import API from './auth';

export async function getUsers({ page = 1, size = 10, sort = ['id','asc'] } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  const res = await API.get(`/api/user/all?${params.toString()}`);
  return res?.data?.data ?? [];
}

export async function getUsersByRole(role, { page = 1, size = 10, sort = ['id','asc'] } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page)); 
  const res = await API.get(`/api/user/role/${role}?${params.toString()}`);
  return res?.data?.data ?? [];
}


