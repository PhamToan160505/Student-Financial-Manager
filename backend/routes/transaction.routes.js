const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { check, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

function validateInput(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400);
  }
  next();
}

const transactionRules = [
  check('amount')
    .notEmpty().withMessage('Số tiền không được để trống')
    .isNumeric().withMessage('Số tiền phải là dạng số')
    .custom(val => {
      const num = Number(val);
      if (num < 1000) throw new Error('Số tiền tối thiểu là 1.000đ');
      if (num > 100000000000) throw new Error('Số tiền tối đa là 100.000.000.000đ (100 tỷ)');
      return true;
    }),
  check('categoryId')
    .notEmpty().withMessage('Vui lòng chọn danh mục')
    .isNumeric().withMessage('ID danh mục không hợp lệ'),
  check('type')
    .isIn(['expense', 'income']).withMessage('Loại giao dịch phải là expense hoặc income'),
  check('transactionDate')
    .notEmpty().withMessage('Ngày giao dịch không được để trống')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Ngày giao dịch định dạng YYYY-MM-DD không đúng'),
  validateInput
];

// Routes protected by verifyToken mounted in server.js
// GET /api/transactions
router.get('/', transactionController.getAllTransactions);

// GET /api/transactions/summary
router.get('/summary', transactionController.getSummary);

// GET /api/transactions/quick-templates
router.get('/quick-templates', transactionController.getQuickTemplates);

// GET /api/transactions/streak
router.get('/streak', transactionController.getStreak);

// POST /api/transactions/from-receipt
router.post('/from-receipt', transactionController.createTransactionFromReceipt);

// POST /api/transactions
router.post('/', transactionRules, transactionController.createTransaction);

// PUT /api/transactions/:id
router.put('/:id', transactionRules, transactionController.updateTransaction);

// DELETE /api/transactions/:id
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
