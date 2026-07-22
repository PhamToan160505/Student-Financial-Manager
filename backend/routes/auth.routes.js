const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');
const { loginLimiter } = require('../middleware/rateLimiter');
const { registerValidationRules, loginValidationRules } = require('../middleware/validateRequest');

// POST /api/auth/register
router.post('/register', registerValidationRules, authController.register);

// POST /api/auth/login - Protected by rate limiter against brute-force
router.post('/login', loginLimiter, loginValidationRules, authController.login);

// GET /api/auth/me - Protected by verifyToken middleware
router.get('/me', verifyToken, authController.getMe);

module.exports = router;
