import axios from 'axios';

/**
 * Shared Axios instance for API communication.
 * ALL API requests from the frontend must go through service files that use this instance.
 * Components must NEVER call axios or fetch directly.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000
});

// Request Interceptor: Automatically attach JWT token to Authorization header if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardize error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid/expired (except on login route), we can clear token or trigger logout in auth context later
      console.warn('[API Interceptor] Unauthorized request (401)');
    }
    return Promise.reject(error);
  }
);

export default api;
