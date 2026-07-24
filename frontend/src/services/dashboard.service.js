import api from './api';

/**
 * Dashboard Service - Calls API for dashboard statistics and charts.
 */
const dashboardService = {
  getStats(month) {
    return api.get('/dashboard/stats', { params: { month } });
  },
  getForecast(month) {
    return api.get('/dashboard/forecast', { params: { month } });
  },
  getInsight(month) {
    return api.get('/dashboard/insight', { params: { month } });
  },
  getAvailableBalance() {
    return api.get('/dashboard/available-balance');
  }
};

export default dashboardService;
