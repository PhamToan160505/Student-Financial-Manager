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
