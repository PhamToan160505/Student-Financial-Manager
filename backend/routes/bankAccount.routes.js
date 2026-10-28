const express = require('express');
const { body, param, validationResult } = require('express-validator');
const bankAccountController = require('../controllers/bankAccount.controller');
const { sendError } = require('../utils/response');

const router = express.Router();

function validateInput(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }
  next();
}

router.get('/', bankAccountController.getBankAccounts);

router.get('/category-rules', bankAccountController.getCategoryRules);

router.post(
  '/category-rules',
  body('code')
    .trim()
    .toUpperCase()
    .matches(/^[A-Z0-9]{1,20}$/).withMessage('Mã danh mục chỉ gồm 1-20 chữ cái không dấu hoặc chữ số'),
  body('categoryId').isInt({ min: 1 }).withMessage('Danh mục không hợp lệ'),
  validateInput,
  bankAccountController.saveCategoryRule
);

router.delete(
  '/category-rules/:id',
  param('id').isInt({ min: 1 }).withMessage('ID quy tắc không hợp lệ'),
  validateInput,
  bankAccountController.deleteCategoryRule
);

router.post(
  '/',
  body('accountNumber')
    .customSanitizer(value => String(value || '').replace(/[\s-]/g, ''))
    .matches(/^\d{8,20}$/).withMessage('Số tài khoản VietinBank phải gồm 8-20 chữ số'),
  body('label')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 }).withMessage('Tên gợi nhớ tối đa 100 ký tự'),
  validateInput,
  bankAccountController.connectBankAccount
);

router.delete(
  '/:id',
  param('id').isInt({ min: 1 }).withMessage('ID liên kết không hợp lệ'),
  validateInput,
  bankAccountController.disconnectBankAccount
);

module.exports = router;
