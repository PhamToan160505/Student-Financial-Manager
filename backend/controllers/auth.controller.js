const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Controller for User Authentication.
 * Includes register, login, and getMe handlers.
 * All functions wrapped with try/catch passing errors to next(err).
 */

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return sendError(res, 'Email này đã được đăng ký trong hệ thống. Vui lòng sử dụng email khác hoặc đăng nhập.', 409);
    }

    // 2. Hash password with bcrypt (salt rounds >= 10 according to security rules)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Create user in database
    const newUserId = await userModel.create({
      fullName,
      email,
      passwordHash
    });

    return sendSuccess(res, {
      user: {
        id: newUserId,
        fullName,
        email
      }
    }, 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Find user by email ONLY (never query with password directly in SQL)
    const user = await userModel.findByEmail(email);
    if (!user) {
      return sendError(res, 'Sai email hoặc mật khẩu', 401);
    }

    // 2. Compare password with hashed password from DB using bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Sai email hoặc mật khẩu', 401);
    }

    // 3. Generate stateless JWT token containing { id, email } only
    const tokenPayload = {
      id: user.id,
      email: user.email
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '8h' // Token expires after 8 hours according to rule 4.2
    });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email
      }
    }, 'Đăng nhập thành công!');
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    // req.user is set by verifyToken middleware (IDOR prevention)
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return sendError(res, 'Không tìm thấy thông tin người dùng', 404);
    }

    return sendSuccess(res, {
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        createdAt: user.created_at
      }
    }, 'Lấy thông tin tài khoản thành công');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe
};
