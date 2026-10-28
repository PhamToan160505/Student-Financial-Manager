import api from './api';

const bankAccountService = {
  getAll() {
    return api.get('/bank-accounts');
  },

  connect(data) {
    return api.post('/bank-accounts', data);
  },

  disconnect(id) {
    return api.delete(`/bank-accounts/${id}`);
  },

  getCategoryRules() {
    return api.get('/bank-accounts/category-rules');
  },

  saveCategoryRule(data) {
    return api.post('/bank-accounts/category-rules', data);
  },

  deleteCategoryRule(id) {
    return api.delete(`/bank-accounts/category-rules/${id}`);
  }
};

export default bankAccountService;
