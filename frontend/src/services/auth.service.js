import api from './api';

/**
 * Authentication Service - All API interactions related to user authentication go here.
 * Components/Hooks MUST NOT call axios/api directly for auth operations.
 */

const authService = {
  /**
   * Register a new student user
   * @param {Object} data { fullName, email, password }
   */
  async register(data) {
    return await api.post('/auth/register', data);
  },

  /**
   * Login user with credentials
   * @param {Object} credentials { email, password }
   */
  async login(credentials) {
    return await api.post('/auth/login', credentials);
  },

  /**
   * Verify OTP
   */
  async verifyOtp(data) {
    return await api.post('/auth/verify-otp', data);
  },

  /**
   * Resend OTP
   */
  async resendOtp(data) {
    return await api.post('/auth/resend-otp', data);
  },

  /**
   * Forgot Password
   */
  async forgotPassword(data) {
    return await api.post('/auth/forgot-password', data);
  },

  /**
   * Verify Reset Password OTP
   */
  async verifyResetOtp(data) {
    return await api.post('/auth/verify-reset-otp', data);
  },

  /**
   * Reset Password
   */
  async resetPassword(data) {
    return await api.post('/auth/reset-password', data);
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    return await api.get('/auth/me');
  },

  /**
   * Remember current device (extends refresh token to 14 days)
   */
  async rememberDevice() {
    return await api.post('/auth/remember-device');
  },

  /**
   * Logout user and clear cookies
   */
  async logout() {
    return await api.post('/auth/logout');
  },

  /**
   * Update user profile and avatar
   * @param {FormData} formData - form data containing fullName and avatar file
   */
  async updateProfile(formData) {
    return await api.put('/auth/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default authService;
