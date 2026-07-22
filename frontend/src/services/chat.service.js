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
  }
};

export default chatService;
