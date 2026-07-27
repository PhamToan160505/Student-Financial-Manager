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
  timeout: 60000,
  withCredentials: true
});

// Request Interceptor: Automatically attach JWT token to Authorization header if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Prevent infinite loops if /refresh itself fails
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

// Response Interceptor: Standardize error handling and auto-refresh token
api.interceptors.response.use(
  (response) => {
    // Optional: Return response.data directly if that fits the pattern better, 
    // but typically we return the whole response and let services pick .data
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    const noRefreshRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-otp',
      '/auth/resend-otp',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-reset-otp',
      '/auth/refresh'
    ];
    const shouldSkipRefresh = noRefreshRoutes.some(route => originalRequest.url?.includes(route));

    // Handle 401 Unauthorized for token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (res.data?.success) {
          const newToken = res.data.data.token;
          localStorage.setItem('token', newToken);
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          originalRequest.headers.Authorization = 'Bearer ' + newToken;
          
          processQueue(null, newToken);
          return api(originalRequest);
        }
      } catch (err) {
        processQueue(err, null);
        // If refresh fails, clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
