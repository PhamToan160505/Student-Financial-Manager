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
  keyGenerator: (req) => req.user ? String(req.user.id) : req.ip,
  message: {
    success: false,
    message: 'Bạn đã trò chuyện quá nhanh (vượt ngưỡng 15 tin/15 phút). Để bảo vệ hạn mức AI miễn phí, vui lòng nghỉ tay vài phút rồi trò chuyện tiếp nhé!'
  }
});

const chatDailyRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours window
  max: 40, // max 40 messages per day
  keyGenerator: (req) => req.user ? String(req.user.id) : req.ip,
  message: {
    success: false,
    message: 'Bạn đã đạt giới hạn 40 tin nhắn AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai nhé!'
  }
});

// GET /api/chat/history - Get recent conversation history
router.get('/history', chatController.getHistory);

// DELETE /api/chat/history - Clear conversation history
router.delete('/history', chatController.clearHistory);

// POST /api/chat/advisor - Send message to AI (Protected by BOTH rate limiters)
// Note: verifyToken is mounted before these routes in server.js so req.user exists before keyGenerator runs!
router.post('/advisor', chatShortRateLimiter, chatDailyRateLimiter, chatController.sendMessage);

module.exports = router;
