import api from './api';

/**
 * Category Service - All API calls for categories resource.
 * Components must NEVER call api/axios directly.
 * Flow: Component → useCategories hook → categoryService → api.js
 */
const categoryService = {
  getAll() {
    return api.get('/categories');
  },

  create(data) {
    // data: { name, type, icon, color }
    return api.post('/categories', data);
  },

  update(id, data) {
    // data: { name, icon, color }
    return api.put(`/categories/${id}`, data);
  },

  remove(id) {
    return api.delete(`/categories/${id}`);
  }
};

export default categoryService;
