import api from './api';

/**
 * Budget Service - Handles all API communication for monthly budgets
 */
const budgetService = {
  /**
   * Get budgets, progress, warnings, and summary for a specific month YYYY-MM
   */
  getBudgetsByMonth: async (month) => {
    const params = month ? { month } : {};
    return api.get('/budgets', { params });
  },

  /**
   * Create or update (upsert) a monthly budget limit for a category
   */
  upsertBudget: async (data) => {
    return api.post('/budgets', data);
  },

  /**
   * Delete a budget limit by ID
   */
  deleteBudget: async (id) => {
    return api.delete(`/budgets/${id}`);
  }
};

export default budgetService;
