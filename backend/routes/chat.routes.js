const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const chatController = require('../controllers/chat.controller');

// Dual Rate Limiting (Point 2 of User Review)
// Custom keyGenerator: uses req.user.id (from verifyToken) instead of default IP!
// Ensures shared networks (dorm/campus wifi) aren't pooled together, and user switching networks remains limited.

const chatShortRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // max 15 messages per 15 minutes
  keyGenerator: (req) => String(req.user.id),
  validate: false,
  message: {
    success: false,
    message: 'Bạn đã trò chuyện quá nhanh (vượt ngưỡng 15 tin/15 phút). Để bảo vệ hạn mức AI miễn phí, vui lòng nghỉ tay vài phút rồi trò chuyện tiếp nhé!'
  }
});

const chatDailyRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours window
  max: 40, // max 40 messages per day
  keyGenerator: (req) => String(req.user.id),
  validate: false,
  message: {
    success: false,
    message: 'Bạn đã đạt giới hạn 40 tin nhắn AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai nhé!'
  }
});

// GET /api/chat/history - Get recent conversation history
router.get('/history', chatController.getHistory);

// DELETE /api/chat/history - Clear conversation history
router.delete('/history', chatController.clearHistory);

// Configure Multer with memoryStorage for image uploads in chat
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận định dạng ảnh hợp lệ (JPEG, PNG, WEBP)'));
    }
  }
});

// POST /api/chat/advisor - Send message to AI (Protected by BOTH rate limiters)
// Note: verifyToken is mounted before these routes in server.js so req.user exists before keyGenerator runs!
router.post('/advisor', chatShortRateLimiter, chatDailyRateLimiter, upload.array('images', 10), chatController.sendMessage);

// [Điểm 5] Rate limit riêng cho endpoint ghi dữ liệu thật (tạo giao dịch từ chat)
// Tách khỏi /advisor vì endpoint này thực sự ghi DB — cần rào riêng, thoải mái hơn nhưng vẫn có giới hạn.
const confirmActionRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 100, // max 100 giao dịch/giờ qua chat
  keyGenerator: (req) => String(req.user.id),
  validate: false,
  message: {
    success: false,
    message: 'Bạn đã tạo quá nhiều giao dịch qua chat trong 1 giờ (giới hạn 100). Vui lòng thử lại sau!'
  }
});

// POST /api/chat/confirm-action - Confirm an AI-proposed action (Tool Use)
router.post('/confirm-action', confirmActionRateLimiter, chatController.confirmAction);

// V2: Confirm budget setup from AI Chat
router.post('/confirm-budget', confirmActionRateLimiter, chatController.confirmBudget);

module.exports = router;
