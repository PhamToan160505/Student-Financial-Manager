/**
 * Utility functions for standardizing API response formats across the entire application.
 * Format required by convention: { success: boolean, data: any, message: string }
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 500, data = null) => {
  return res.status(statusCode).json({
    success: false,
    data,
    message
  });
};

module.exports = {
  sendSuccess,
  sendError
};
