const { sendError } = require('../utils/response');

/**
 * Centralized error handler middleware.
 * Captures all unhandled errors passed via next(err).
 * Ensures internal details/SQL errors are never exposed to the client in production/standard responses.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler] Caught error:', err);

  const statusCode = err.statusCode || err.status || err.http_code || 500;
  
  // Do not expose sensitive internal error messages or SQL error syntax to client
  let message = err.message || 'Lỗi hệ thống nội bộ (Internal Server Error)';
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Đã xảy ra lỗi từ phía máy chủ. Vui lòng thử lại sau.';
  }

  return sendError(res, message, statusCode);
}

module.exports = errorHandler;
