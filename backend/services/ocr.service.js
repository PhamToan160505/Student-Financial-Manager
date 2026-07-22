const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const categorizationService = require('./categorization.service');

// Ensure local cache directory exists for Tesseract language files (vie.traineddata + eng.traineddata)
const cachePath = path.join(__dirname, '../../tesseract_cache');
try {
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
    console.log('[OCR Service] Created local Tesseract cache folder:', cachePath);
  }
} catch (err) {
  console.warn('[OCR Service] Could not create tesseract_cache folder, using default temporary cache.');
}

/**
 * OCR Service - Handles offline receipt image OCR using Tesseract.js (`vie+eng`)
 * and triggers AI categorization.
 */
const ocrService = {
  /**
   * Process image buffer: run OCR and get AI categorized suggestions
   * @param {Buffer} imageBuffer - Buffer from multer memoryStorage
   * @param {number} userId - User ID for categorization matching
   */
  processReceiptImage: async (imageBuffer, userId) => {
    let rawText = '';
    try {
      console.log('[OCR Service] Starting Tesseract OCR recognition (vie+eng)...');
      const result = await Tesseract.recognize(
        imageBuffer,
        'vie+eng', // Mandatory Vietnamese + English language support (Point 2)
        {
          cachePath: cachePath, // Cache trained data locally (Point 9)
          cacheMethod: 'write',
          logger: (m) => {
            if (m.status === 'recognizing text' && Math.round(m.progress * 100) % 50 === 0) {
              console.log(`[OCR Progress] ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      rawText = result.data?.text || '';
      console.log(`[OCR Service] OCR extraction complete (${rawText.length} characters).`);
    } catch (err) {
      console.error('[OCR Service] Tesseract recognition failed:', err.message);
      rawText = '';
    }

    // Clean and trim raw text
    const cleanedText = rawText.trim();

    // Call Groq AI categorization (Gracefully handles errors / short text)
    const suggestions = await categorizationService.categorizeReceipt(cleanedText, userId);

    // Return unified camelCase convention (Point 5)
    return {
      ocrRawText: cleanedText,
      ocrExtractedAmount: suggestions.amount,
      ocrExtractedMerchant: suggestions.merchant,
      aiSuggestedCategoryId: suggestions.suggestedCategoryId
    };
  }
};

module.exports = ocrService;
