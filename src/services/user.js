import axios from 'axios';

// Use relative base URL in dev so Vite proxy handles CORS
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Tạo axios instance với config mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động thêm token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý response
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn, redirect về login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Lấy thông tin profile hiện tại
export const getCurrentProfile = async () => {
  try {
    const response = await apiClient.get('/api/profile');
    return response.data.data; // Trả về data từ ApiResponse
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không thể lấy thông tin profile');
  }
};

// Cập nhật profile
export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.patch('/api/profile', profileData);
    return response.data.data; // Trả về data từ ApiResponse
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không thể cập nhật profile');
  }
};

// Upload avatar (nếu cần API riêng cho upload file)
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/api/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data; // Trả về URL của avatar
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Không thể upload avatar');
  }
};

// Resolve avatar or static file URL: supports http/https/data and relative paths from backend
export const resolveAssetUrl = (raw) => {
  if (!raw) return '';
  const val = String(raw);
  if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:')) return val;
  const origin = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const cleanOrigin = origin.replace(/\/$/, '');
  const cleanPath = val.startsWith('/') ? val : `/${val}`;
  return `${cleanOrigin}${cleanPath}`;
};
