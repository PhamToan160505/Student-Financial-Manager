import api from './api';

/**
 * Chat Service - Calls API endpoints for global AI Financial Advisor
 */
const chatService = {
  getHistory() {
    return api.get('/chat/history');
  },
  sendMessage(message) {
    return api.post('/chat/advisor', { message });
  },
  clearHistory() {
    return api.delete('/chat/history');
  },
  // V1: Xác nhận tạo giao dịch từ AI
  confirmAction: async (payload) => {
    const response = await api.post('/chat/confirm-action', { actionPayload: payload });
    return response;
  },

  // V2: Xác nhận tạo ngân sách từ AI
  confirmBudget: async (payload) => {
    const response = await api.post('/chat/confirm-budget', payload);
    return response;
  }
};

export default chatService;
