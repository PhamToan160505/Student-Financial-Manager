const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');
const { loginLimiter } = require('../middleware/rateLimiter');
const { registerValidationRules, loginValidationRules } = require('../middleware/validateRequest');
const { upload } = require('../config/cloudinary');

// POST /api/auth/register
router.post('/register', registerValidationRules, authController.register);

// POST /api/auth/login - Protected by rate limiter against brute-force
router.post('/login', loginLimiter, loginValidationRules, authController.login);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/resend-otp
router.post('/resend-otp', loginLimiter, authController.resendOtp);

// POST /api/auth/forgot-password
router.post('/forgot-password', loginLimiter, authController.forgotPassword);

// POST /api/auth/verify-reset-otp
router.post('/verify-reset-otp', loginLimiter, authController.verifyResetOtp);

// POST /api/auth/reset-password
router.post('/reset-password', loginLimiter, authController.resetPassword);

// GET /api/auth/me - Protected by verifyToken middleware
router.get('/me', verifyToken, authController.getMe);

// PUT /api/auth/profile - Update profile and avatar
router.put('/profile', verifyToken, upload.single('avatar'), authController.updateProfile);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/remember-device
router.post('/remember-device', verifyToken, authController.rememberDevice);

module.exports = router;
