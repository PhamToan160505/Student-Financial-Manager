import api from './api';

/**
 * Transaction Service - All API calls for transactions resource.
 * Components must NEVER call api/axios directly.
 * Flow: Component → useTransactions hook → transactionService → api.js
 */
const transactionService = {
  getAll(params = {}) {
    // params: { month, type, categoryId, search }
    return api.get('/transactions', { params });
  },

  getSummary(month) {
    return api.get('/transactions/summary', { params: { month } });
  },

  getQuickTemplates() {
    return api.get('/transactions/quick-templates');
  },

  getStreak() {
    return api.get('/transactions/streak');
  },

  create(data) {
    // data: { categoryId, type, amount, transactionDate, note, merchant }
    return api.post('/transactions', data);
  },

  createFromReceipt(data) {
    // data: { receiptId, categoryId, type, amount, transactionDate, note, merchant, isModifiedByUser }
    return api.post('/transactions/from-receipt', data);
  },

  update(id, data) {
    return api.put(`/transactions/${id}`, data);
  },

  remove(id) {
    return api.delete(`/transactions/${id}`);
  }
};

export default transactionService;
