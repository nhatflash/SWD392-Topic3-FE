import axios from 'axios';

const BASE_URL = 'http://localhost:8080';
// const BASE_URL = 'https://9gjwld5d-8080.asse.devtunnels.ms/swagger-ui/index.html';

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

function parseApiError(err) {
	try {
		if (err.response?.data) {
			const body = err.response.data;
			// support cases where API wraps payload in `data`
			const payload = body.data || body;
			const fieldErrors = payload.fieldErrors || body.fieldErrors || payload.errors || body.errors;
			const message = body.message || payload.message || body.error || payload.error;
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
		return api;
	} catch (err) {
		throw parseApiError(err);
	}
}

export async function refresh(refreshToken) {
	try {
		const token = refreshToken || getRefreshToken();
		const res = await API.post('/api/auth/refresh', { refreshToken: token });
		const api = res.data;
		const data = api?.data || {};
		if (data.accessToken) setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
		return api;
	} catch (err) {
		throw parseApiError(err);
	}
}

export async function getProfile() {
		const paths = ['/api/profile', '/api/auth/me', '/api/users/me', '/api/me', '/api/users/current'];
	for (const p of paths) {
		try {
			const res = await API.get(p);
			if (res?.data?.data) return res.data.data;
			if (res?.data) return res.data;
		} catch (e) {
			// ignore and try next path
			console.debug('getProfile try failed for', p, e?.message ?? e);
		}
	}
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