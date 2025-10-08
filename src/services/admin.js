import API from './auth';

export async function getUsers({ page = 0, size = 10, sort = ['id','asc'] } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.set('sort', `${sort[0]},${sort[1]}`);
  const res = await API.get(`/api/admin/users?${params.toString()}`);
  return res?.data?.data ?? [];
}

export async function getUsersByRole(role, { page = 0, size = 10, sort = ['id','asc'] } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.set('sort', `${sort[0]},${sort[1]}`);
  const res = await API.get(`/api/admin/users/role/${role}?${params.toString()}`);
  return res?.data?.data ?? [];
}


