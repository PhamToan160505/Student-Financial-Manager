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
  getAvailableBalance(month) {
    return api.get('/dashboard/available-balance', { params: { month } });
  }
};

export default dashboardService;
