const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const receiptModel = require('../models/receipt.model');
const transactionModel = require('../models/transaction.model');
const ocrService = require('../services/ocr.service');
const { sendSuccess, sendError } = require('../utils/response');

// Configure Multer with memoryStorage (Strict security: NO temporary files written to server disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận định dạng ảnh hợp lệ (JPEG, PNG, WEBP)'));
    }
  }
}).single('receipt');

/**
 * Upload buffer stream to Cloudinary wrapper
 */
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'qlsv-finance/receipts',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Controller: Handle receipt upload, Cloudinary CDN storage, AI OCR, and save to DB
 */
async function handleUploadReceipt(req, res, next) {
  try {
    if (!req.file) {
      return sendError(res, 'Vui lòng chọn hoặc chụp ảnh hóa đơn tải lên', 400);
    }

    console.log(`[Receipt Controller] Uploading image (${req.file.originalname}, ${req.file.size} bytes) to Cloudinary...`);
    const cloudResult = await uploadBufferToCloudinary(req.file.buffer);

    console.log('[Receipt Controller] Cloudinary upload success. Running AI OCR Pipeline...');
    // Run OCR and AI Categorization Pipeline
    const ocrResult = await ocrService.processReceiptImage(req.file.buffer, req.user.id);

    // Save URL and OCR details to database (`receipts` table)
    const receiptId = await receiptModel.create({
      userId: req.user.id,
      imageUrl: cloudResult.secure_url,
      cloudinaryPublicId: cloudResult.public_id,
      ocrRawText: ocrResult.ocrRawText,
      ocrExtractedAmount: ocrResult.ocrExtractedAmount,
      ocrExtractedMerchant: ocrResult.ocrExtractedMerchant,
      aiSuggestedCategoryId: ocrResult.aiSuggestedCategoryId
    });

    // Return unified camelCase JSON convention (Point 5)
    return sendSuccess(
      res,
      {
        receipt: {
          id: receiptId,
          imageUrl: cloudResult.secure_url,
          cloudinaryPublicId: cloudResult.public_id,
          ocrRawText: ocrResult.ocrRawText,
          ocrExtractedAmount: ocrResult.ocrExtractedAmount,
          ocrExtractedMerchant: ocrResult.ocrExtractedMerchant,
          aiSuggestedCategoryId: ocrResult.aiSuggestedCategoryId
        }
      },
      'Quét và phân tích hóa đơn AI thành công!',
      201
    );
  } catch (err) {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'Kích thước ảnh hóa đơn tối đa là 5MB', 400);
    }
    next(err);
  }
}

/**
 * Controller: Delete receipt by ID with FK constraint checking
 */
async function deleteReceipt(req, res, next) {
  try {
    const { id } = req.params;

    // Check IDOR ownership
    const receipt = await receiptModel.findByIdAndUserId(id, req.user.id);
    if (!receipt) {
      return sendError(res, 'Không tìm thấy hóa đơn hoặc bạn không có quyền xóa', 404);
    }

    // Check FK constraint with transactions (Point 7)
    const linkedCount = await transactionModel.countByReceiptId(id);
    if (linkedCount > 0) {
      return sendError(
        res,
        'Hóa đơn này đang được gắn với một giao dịch trong Sổ thu chi. Vui lòng xóa hoặc hủy liên kết ở giao dịch trước để bảo toàn audit trail tài chính!',
        400
      );
    }

    // Delete from MySQL table
    await receiptModel.remove(id, req.user.id);

    // Delete image from Cloudinary to clean up CDN storage
    try {
      if (receipt.cloudinary_public_id) {
        await cloudinary.uploader.destroy(receipt.cloudinary_public_id);
      }
    } catch (cloudErr) {
      console.warn('[Receipt Controller] Failed to destroy Cloudinary image:', cloudErr.message);
    }

    return sendSuccess(res, null, 'Xóa hóa đơn thành công!');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upload,
  handleUploadReceipt,
  deleteReceipt
};
