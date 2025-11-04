import axios from 'axios';

// const BASE_URL = 'https://czf23bx8-8080.asse.devtunnels.ms';
// const BASE_URL = import.meta.env.VITE_API_URL;
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:8080' // Khi chạy npm run dev
    : 'https://9gjwld5d-8080.asse.devtunnels.ms'); // fallback khi build mà quên set env

const API = axios.create({
	baseURL: BASE_URL,
	headers: { 'Content-Type': 'application/json' },
});

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function getAccessToken() {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens({ accessToken, refreshToken }) {
	if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
	if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

API.interceptors.request.use(cfg => {
	const token = getAccessToken();
	if (token) {
		cfg.headers = cfg.headers || {};
		cfg.headers.Authorization = `Bearer ${token}`;
	}
	return cfg;
});

// Response interceptor: Auto-refresh token on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
	failedQueue.forEach(prom => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token);
		}
	});
	failedQueue = [];
};

API.interceptors.response.use(
	response => response,
	async error => {
		const originalRequest = error.config;

		// Skip refresh logic for auth endpoints
		if (originalRequest.url?.includes('/api/auth/refresh') || 
		    originalRequest.url?.includes('/api/auth/login') ||
		    originalRequest.url?.includes('/api/auth/register')) {
			return Promise.reject(error);
		}

		// If 401 and not already retrying
		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				// Wait for the ongoing refresh to complete
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then(token => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return API(originalRequest);
					})
					.catch(err => {
						return Promise.reject(err);
					});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			const refreshToken = getRefreshToken();
			if (!refreshToken) {
				// No refresh token, logout
				isRefreshing = false;
				clearTokens();
				console.error('❌ Token refresh failed: No refresh token available. Redirecting to login...');
				alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
				window.location.href = '/login';
				return Promise.reject(error);
			}

			try {
				const res = await API.post('/api/auth/refresh', { refreshToken });
				const data = res.data?.data;
				
				// BE returns data as string (new access token), not object
				if (data && typeof data === 'string') {
					// Keep same refresh token, only update access token
					setTokens({ accessToken: data, refreshToken });
					console.log('✅ [Auto Refresh] Token refreshed successfully');
					console.log('   ├─ Refresh Token: ✓ No change (reused existing)');
					console.log('   └─ Access Token: ✓ Updated to new token');
					
					// Update Authorization header and retry original request
					originalRequest.headers.Authorization = `Bearer ${data}`;
					processQueue(null, data);
					
					return API(originalRequest);
				} else {
					console.error('❌ [Auto Refresh] Invalid response from server', res.data);
					throw new Error('No access token in refresh response');
				}
			} catch (err) {
				console.error('❌ [Auto Refresh] Failed:', err?.response?.data || err?.message);
				processQueue(err, null);
				clearTokens();
				alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
				window.location.href = '/login';
				return Promise.reject(err);
			} finally {
				isRefreshing = false;
			}
		}

		return Promise.reject(error);
	}
);

function parseApiError(err) {
	try {
		if (err.response?.data) {
			const body = err.response.data;
			// support cases where API wraps payload in `data`
			const payload = body.data || body;
			const fieldErrors = payload.fieldErrors || body.fieldErrors || payload.errors || body.errors;
			const message = body.message || payload.message || body.error || payload.error;
			
			// Special handling for authentication errors
			if (err.response.status === 401) {
				console.error('🔐 Authentication error:', message || 'Unauthorized');
			}
			if (err.response.status === 403) {
				console.error('🚫 Authorization error:', message || 'Forbidden');
			}
			
			if (fieldErrors) return { message: message || 'Validation error', fieldErrors };
			if (message) return { message };
		}
	} catch (e) {
		console.warn('parseApiError internal error', e, err);
	}
	// fallback to generic message and include status/text when available
	const fallback = { message: err.message || 'Unknown error' };
	if (err.response) {
		fallback.status = err.response.status;
		fallback.statusText = err.response.statusText;
		console.error(`API Error [${fallback.status}]:`, fallback.message);
	}
	return fallback;
}


export async function register(payload) {
	try {
		const res = await API.post('/api/auth/register', payload);
		return res.data;
	} catch (err) {
		throw parseApiError(err);
	}
}

export async function login({ email, password }) {
	try {
		const res = await API.post('/api/auth/login', { email, password });
		const api = res.data;
		const data = api?.data || {};
		setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
		console.log('✅ Login successful');
		return api;
	} catch (err) {
		console.error('❌ Login failed:', err?.response?.data?.message || err.message);
		throw parseApiError(err);
	}
}

export async function refresh(refreshToken) {
	try {
		const token = refreshToken || getRefreshToken();
		if (!token) {
			console.error('❌ [Manual Refresh] No refresh token provided');
			throw new Error('No refresh token available');
		}
		
		console.log('🔄 [Manual Refresh] Requesting new access token...');
		const res = await API.post('/api/auth/refresh', { refreshToken: token });
		const api = res.data;
		// BE returns: { message, data: "newAccessToken", timestamp }
		// data is a string (new access token), not an object
		const newAccessToken = api?.data;
		if (newAccessToken && typeof newAccessToken === 'string') {
			// Keep the same refresh token, only update access token
			setTokens({ accessToken: newAccessToken, refreshToken: token });
			console.log('✅ [Manual Refresh] SUCCESS!');
			console.log('   ├─ Refresh Token: ✓ No change (kept existing)');
			console.log('   └─ Access Token: ✓ Updated to new token');
		} else {
			console.error('❌ [Manual Refresh] Invalid response', api);
			throw new Error('Invalid refresh response');
		}
		return api;
	} catch (err) {
		console.error('❌ [Manual Refresh] Failed:', err?.response?.data?.message || err.message);
		throw parseApiError(err);
	}
}

export async function getProfile() {
	const paths = ['/api/profile', '/api/auth/me', '/api/users/me', '/api/me', '/api/users/current'];
	for (const p of paths) {
		try {
			const res = await API.get(p);
			if (res?.data?.data) {
				return res.data.data;
			}
			if (res?.data) {
				return res.data;
			}
		} catch (e) {
			// ignore and try next path
			console.warn(`⚠️ Failed to get profile from ${p}:`, e?.response?.status || e.message);
		}
	}
	console.error('❌ Failed to load profile from all endpoints');
	return null;
}

export async function logout() {
	try {
		await API.post('/api/auth/logout', {});
		clearTokens();
		return { message: 'Logged out' };
	} catch (err) {
		clearTokens();
		throw parseApiError(err);
	}
}

export default API;