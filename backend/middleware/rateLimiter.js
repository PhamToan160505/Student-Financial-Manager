const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware specifically for login endpoints.
 * Limits each IP to 5 login attempts per 15-minute window to prevent brute-force attacks.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per key
  message: {
    success: false,
    data: null,
    message: 'Quá nhiều yêu cầu thất bại. Vui lòng thử lại sau 15 phút để đảm bảo an toàn.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Chỉ tính các request thất bại (sai pass/otp)
});

module.exports = {
  loginLimiter
};
