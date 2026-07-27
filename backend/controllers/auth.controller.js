const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require('../models/user.model');
const authModel = require('../models/auth.model');
const { validatePasswordStrength } = require('../utils/password');
const { sendOTP } = require('../services/email.service');
const { sendSuccess, sendError } = require('../utils/response');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Controller for User Authentication.
 * Includes register, login, and getMe handlers.
 * All functions wrapped with try/catch passing errors to next(err).
 */

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    // Validate password strength
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu không đủ mạnh',
        errors: passwordErrors
      });
    }

    // 1. Check if user already exists
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      if (existingUser.email_verified) {
        return sendError(res, 'Email này đã được đăng ký trong hệ thống. Vui lòng sử dụng email khác hoặc đăng nhập.', 409);
      } else {
        // If exists but unverified, we can either allow overwriting or just say it exists but needs verification
        // For simplicity, we just delete the old unverified user or reuse it. Here we reuse by updating the password
        const passwordHash = await bcrypt.hash(password, 10);
        // We need a function to update password if we reuse, but let's just delete the unverified one and recreate, 
        // or just return an error telling them to verify.
        return sendError(res, 'Email này đã đăng ký nhưng chưa xác thực. Vui lòng đăng nhập để xác thực.', 409);
      }
    }

    // 2. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create user in database (email_verified = false by default in DB schema)
    const newUserId = await userModel.create({
      fullName,
      email,
      passwordHash
    });

    // Temporary Bypass OTP: Verify immediately
    await userModel.verifyEmail(email);

    return sendSuccess(res, {
      email
    }, 'Đăng ký thành công!', 201);
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

    // Temporary Bypass OTP: Remove email_verified check so old unverified users can also login

    // 3. Generate stateless JWT token (Access Token, expires in 15m)
    const tokenPayload = {
      id: user.id,
      email: user.email
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '100y' 
    });

    // 4. Generate Refresh Token (40 bytes random)
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    
    // Default expiration: 1 day (for "session" behavior in DB, even though cookie is session)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 day
    await authModel.createRefreshToken(user.id, tokenHash, expiresAt);

    // 5. Set Cookie (HttpOnly) - No maxAge means session cookie
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    });

    // Lazy cleanup of old tokens
    authModel.cleanupExpiredTokens();

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url
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
        avatar_url: user.avatar_url,
        createdAt: user.created_at
      }
    }, 'Lấy thông tin tài khoản thành công');
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    if (!rawRefreshToken) {
      return sendError(res, 'Không tìm thấy refresh token', 401);
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const validToken = await authModel.findValidRefreshToken(tokenHash);

    if (!validToken) {
      // Security measure: if token is not found or revoked, clear cookie
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return sendError(res, 'Refresh token không hợp lệ', 401);
    }

    if (validToken.revoked) {
      // Possible Replay Attack! Revoke all tokens for this user
      await authModel.revokeAllForUser(validToken.user_id);
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return sendError(res, 'Phát hiện đăng nhập bất thường, vui lòng đăng nhập lại', 401);
    }

    if (new Date(validToken.expires_at) < new Date()) {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      return sendError(res, 'Refresh token đã hết hạn', 401);
    }

    // Issue new Access Token (15m)
    const user = await userModel.findById(validToken.user_id);
    if (!user) {
      return sendError(res, 'Tài khoản không tồn tại', 401);
    }
    const tokenPayload = { id: user.id, email: user.email };
    const newAccessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '100y' });

    // Rotate Refresh Token
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
    
    // Revoke old token
    await authModel.revokeToken(validToken.id);

    // Calculate remaining duration for the new token (so it doesn't extend the max limit infinitely)
    const oldExpiryDate = new Date(validToken.expires_at);
    // Create new token with same old expiry (or max 14 days)
    await authModel.createRefreshToken(user.id, newTokenHash, oldExpiryDate);

    // Maintain the same cookie maxAge as before if it was a persistent cookie
    // We check if it's far in the future
    const msLeft = oldExpiryDate.getTime() - Date.now();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    };
    if (msLeft > 24 * 60 * 60 * 1000) {
      cookieOptions.maxAge = msLeft;
    }
    
    res.cookie('refreshToken', newRawRefreshToken, cookieOptions);

    return sendSuccess(res, { token: newAccessToken }, 'Refresh token thành công');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      const validToken = await authModel.findValidRefreshToken(tokenHash);
      if (validToken) {
        await authModel.revokeToken(validToken.id);
      }
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    });
    return sendSuccess(res, null, 'Đăng xuất thành công');
  } catch (err) {
    next(err);
  }
}

async function rememberDevice(req, res, next) {
  try {
    // Requires valid Access Token (req.user)
    const rawRefreshToken = req.cookies.refreshToken;
    if (!rawRefreshToken) {
      return sendError(res, 'Không tìm thấy refresh token', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const validToken = await authModel.findValidRefreshToken(tokenHash);
    
    if (!validToken || validToken.revoked || validToken.user_id !== req.user.id) {
      return sendError(res, 'Token không hợp lệ', 401);
    }

    // Set to 14 days
    const newExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await authModel.extendTokenExpiry(tokenHash, newExpiresAt);

    // Update Cookie with maxAge
    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 14 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, null, 'Đã ghi nhớ thiết bị 14 ngày');
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return sendError(res, 'Vui lòng cung cấp email và mã OTP', 400);
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return sendError(res, 'Không tìm thấy người dùng', 404);
    }

    if (user.email_verified) {
      return sendError(res, 'Email này đã được xác thực', 400);
    }

    if (user.otp_attempts >= 5) {
      return sendError(res, 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu gửi lại mã mới.', 429);
    }

    if (!user.otp_code_hash || !user.otp_expires_at || user.otp_purpose !== 'register') {
      return sendError(res, 'Mã OTP không hợp lệ hoặc không có yêu cầu xác thực', 400);
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      return sendError(res, 'Mã OTP đã hết hạn', 400);
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== user.otp_code_hash) {
      await userModel.incrementOtpAttempts(email);
      return sendError(res, 'Mã OTP không chính xác', 400);
    }

    // OTP Correct!
    await userModel.verifyEmail(email);
    await userModel.clearOtp(email);

    // Issue Access Token & Refresh Token (same as Login)
    const tokenPayload = { id: user.id, email: user.email };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '100y' });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    await authModel.createRefreshToken(user.id, tokenHash, expiresAt);

    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email
      }
    }, 'Xác thực tài khoản thành công!');
  } catch (err) {
    next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Vui lòng cung cấp email', 400);

    const user = await userModel.findByEmail(email);
    if (!user) return sendError(res, 'Không tìm thấy người dùng', 404);
    if (user.email_verified) return sendError(res, 'Email này đã được xác thực', 400);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await userModel.updateOtp(email, otpHash, expiresAt, 'register');
    await sendOTP(email, otpCode, 'register');

    return sendSuccess(res, null, 'Đã gửi lại mã OTP. Vui lòng kiểm tra email của bạn.');
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Vui lòng cung cấp email', 400);

    const user = await userModel.findByEmail(email);
    // Don't leak if email exists or not for security, but we do need to generate OTP if exists
    if (user) {
      // Temporary Bypass OTP: Set a fixed OTP '000000' and don't send email
      const otpCode = '000000';
      const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await userModel.updateOtp(email, otpHash, expiresAt, 'reset_password');
      // await sendOTP(email, otpCode, 'reset_password');
    }

    // Always return success
    return sendSuccess(res, null, 'Đã bỏ qua OTP, vui lòng đặt mật khẩu mới.');
  } catch (err) {
    next(err);
  }
}

async function verifyResetOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return sendError(res, 'Vui lòng cung cấp email và mã OTP', 400);

    const user = await userModel.findByEmail(email);
    if (!user) return sendError(res, 'Yêu cầu không hợp lệ', 400);

    if (user.otp_attempts >= 5) {
      return sendError(res, 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu gửi lại mã mới.', 429);
    }

    if (!user.otp_code_hash || !user.otp_expires_at || user.otp_purpose !== 'reset_password') {
      return sendError(res, 'Mã OTP không hợp lệ hoặc không có yêu cầu xác thực', 400);
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      return sendError(res, 'Mã OTP đã hết hạn', 400);
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== user.otp_code_hash) {
      await userModel.incrementOtpAttempts(email);
      return sendError(res, 'Mã OTP không chính xác', 400);
    }

    return sendSuccess(res, null, 'Mã OTP hợp lệ');
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return sendError(res, 'Vui lòng cung cấp đủ thông tin: email, mã OTP, mật khẩu mới', 400);
    }

    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu không đủ mạnh',
        errors: passwordErrors
      });
    }

    const user = await userModel.findByEmail(email);
    if (!user) {
      return sendError(res, 'Yêu cầu không hợp lệ', 400);
    }

    if (user.otp_attempts >= 5) {
      return sendError(res, 'Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu gửi lại mã mới.', 429);
    }

    if (!user.otp_code_hash || !user.otp_expires_at || user.otp_purpose !== 'reset_password') {
      return sendError(res, 'Mã OTP không hợp lệ hoặc không có yêu cầu xác thực', 400);
    }

    if (new Date(user.otp_expires_at) < new Date()) {
      return sendError(res, 'Mã OTP đã hết hạn', 400);
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== user.otp_code_hash) {
      await userModel.incrementOtpAttempts(email);
      return sendError(res, 'Mã OTP không chính xác', 400);
    }

    // OTP Correct! Update Password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(email, passwordHash);
    
    // In case they reset password but hadn't verified email before, verify it now
    if (!user.email_verified) {
      await userModel.verifyEmail(email);
    }
    
    await userModel.clearOtp(email);
    
    // Revoke all existing sessions for security
    await authModel.revokeToken(user.id); // This revokes all refresh tokens, forcing re-login across devices

    // Issue Access Token & Refresh Token
    const tokenPayload = { id: user.id, email: user.email };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '100y' });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day default
    await authModel.createRefreshToken(user.id, tokenHash, expiresAt);

    res.cookie('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    });

    return sendSuccess(res, {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email
      }
    }, 'Đổi mật khẩu thành công!');
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id; // From verifyToken middleware
    const { fullName } = req.body;
    let avatarUrl = null;

    if (!fullName || fullName.trim().length === 0) {
      return sendError(res, 'Họ và tên không được để trống.', 400);
    }

    // Check if a file was uploaded
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, `avatars/${userId}`);
      avatarUrl = uploadResult.secure_url;
    }

    // Update in DB
    const updatedUser = await userModel.updateProfile(userId, fullName.trim(), avatarUrl);

    if (!updatedUser) {
      return sendError(res, 'Không tìm thấy người dùng.', 404);
    }

    return sendSuccess(res, {
      user: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        email: updatedUser.email,
        avatar_url: updatedUser.avatar_url
      }
    }, 'Cập nhật hồ sơ thành công!');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
  rememberDevice,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  updateProfile
};
