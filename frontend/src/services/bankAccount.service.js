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
  }
};

export default bankAccountService;
