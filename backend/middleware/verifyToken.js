const jwt = require('jsonwebtoken');

/**
 * Middleware verifyToken.js — mandatory for all protected routes except login/register.
 * Verifies Authorization: Bearer <token> header against JWT_SECRET.
 * Assigns req.user = { id, email } without re-querying the database.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token không tồn tại hoặc chưa đăng nhập' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Lỗi cấu hình server: Thiếu JWT_SECRET' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn (phiên đăng nhập hết hạn)' });
    }
    req.user = { id: decoded.id, email: decoded.email }; // gán vào req, KHÔNG query lại DB
    next();
  });
}

module.exports = verifyToken;
