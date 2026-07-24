const { check, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * Middleware to check validation results from express-validator rules.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0].msg;
    return sendError(res, firstError, 400);
  }
  next();
}

const registerValidationRules = [
  check('fullName')
    .trim()
    .notEmpty().withMessage('Họ tên không được để trống')
    .isLength({ min: 2, max: 50 }).withMessage('Họ tên phải từ 2 đến 50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/).withMessage('Họ tên chỉ được chứa chữ cái và khoảng trắng'),
  check('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng'),
  check('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6, max: 30 }).withMessage('Mật khẩu phải từ 6 đến 30 ký tự'),
  handleValidationErrors
];

const loginValidationRules = [
  check('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không đúng định dạng'),
  check('password')
    .notEmpty().withMessage('Mật khẩu không được để trống'),
  handleValidationErrors
];

const budgetValidationRules = [
  check('category_id')
    .notEmpty().withMessage('ID danh mục không được để trống')
    .isInt({ min: 1 }).withMessage('ID danh mục phải là số nguyên dương'),
  check('amount')
    .notEmpty().withMessage('Số tiền hạn mức không được để trống')
    .isFloat({ min: 1000, max: 100000000000 }).withMessage('Số tiền hạn mức phải từ 1,000 đ đến 100 tỷ đ'),
  check('month')
    .optional()
    .matches(/^\d{4}-\d{2}$/).withMessage('Tháng phải có định dạng YYYY-MM'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidationRules,
  loginValidationRules,
  budgetValidationRules
};
