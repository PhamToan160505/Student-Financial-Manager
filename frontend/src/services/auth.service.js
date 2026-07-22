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
   * Get current authenticated user profile
   */
  async getMe() {
    return await api.get('/auth/me');
  }
};

export default authService;
