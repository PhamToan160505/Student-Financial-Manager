import api from './api';

/**
 * Receipt Service - API communication for receipt upload and AI scanning.
 */
const receiptService = {
  /**
   * Upload image and get OCR / AI categorization suggestions
   * @param {FormData} formData - Contains 'receipt' file field
   */
  uploadAndScan: async (formData) => {
    return api.post('/receipts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // Allow up to 60s for Tesseract + Groq processing
    });
  },

  /**
   * Delete receipt by ID
   */
  deleteReceipt: async (id) => {
    return api.delete(`/receipts/${id}`);
  }
};

export default receiptService;
